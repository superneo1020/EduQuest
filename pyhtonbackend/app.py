from __future__ import annotations
import logging
import os
import json
import requests
import psycopg2
from typing import Any, List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime
from collections import defaultdict
from pydantic_settings import BaseSettings, SettingsConfigDict
from psycopg2.extras import RealDictCursor


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash-lite"
    gemini_location: str = "us-central1"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "eduquestdb"
    db_user: str = "eduquestuser"
    db_password: str = "eduquestpass"
    log_level: str = "INFO"


settings = Settings()

if not settings.gemini_api_key:
    raise ValueError("GEMINI_API_KEY is required! Set it in .env file.")

logging.basicConfig(level=settings.log_level, format="%(asctime)s | %(levelname)s | %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger("eduquest-analytics")


class DatabaseClient:
    def __init__(self):
        self.conn = psycopg2.connect(
            host=settings.db_host, port=settings.db_port, database=settings.db_name,
            user=settings.db_user, password=settings.db_password, cursor_factory=RealDictCursor
        )
        logger.info(f"Connected to PostgreSQL at {settings.db_host}:{settings.db_port}/{settings.db_name}")

    def fetch_game_scores(self) -> List[Dict[str, Any]]:
        query = """
                SELECT ugs.id, ugs.user_id, ugs.game_id, COALESCE(g.name, 'Unknown') as game_name,
                       COALESCE(g.type, 'UNKNOWN') as game_type, COALESCE(g.difficulty, 'EASY') as difficulty,
                       ugs.scores, COALESCE(ugs.metadata, '{"questions": [], "extraData": {}}') as metadata,
                       ugs.created_at, u.username
                FROM user_game_scores ugs
                         LEFT JOIN games g ON ugs.game_id = g.id
                         LEFT JOIN users u ON ugs.user_id = u.id
                ORDER BY ugs.created_at DESC \
                """
        with self.conn.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def fetch_class_scores(self, exclude_user_id: int) -> List[Dict[str, Any]]:
        query = """
                SELECT ugs.id, ugs.user_id, ugs.game_id, COALESCE(g.name, 'Unknown') as game_name,
                       COALESCE(g.type, 'UNKNOWN') as game_type, COALESCE(g.difficulty, 'EASY') as difficulty,
                       ugs.scores, COALESCE(ugs.metadata, '{"questions": [], "extraData": {}}') as metadata,
                       ugs.created_at
                FROM user_game_scores ugs
                         LEFT JOIN games g ON ugs.game_id = g.id
                WHERE ugs.user_id != %s
                ORDER BY ugs.created_at DESC \
                """
        with self.conn.cursor() as cur:
            cur.execute(query, (exclude_user_id,))
            return [dict(row) for row in cur.fetchall()]

    def list_users(self) -> List[Dict[str, Any]]:
        # FIXED: Only select columns that definitely exist in your users table
        query = """
                SELECT DISTINCT u.id, u.username
                FROM users u
                         INNER JOIN user_game_scores ugs ON u.id = ugs.user_id
                ORDER BY u.id \
                """
        with self.conn.cursor() as cur:
            cur.execute(query)
            return [dict(row) for row in cur.fetchall()]

    def close(self):
        if self.conn:
            self.conn.close()


class GeminiClient:
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash-lite", location: str = "us-central1"):
        self.api_key = api_key
        self.model = model
        self.location = location
        self.base_url = f"https://{location}-aiplatform.googleapis.com/v1"

    def _get_endpoint(self) -> str:
        return f"{self.base_url}/publishers/google/models/{self.model}:generateContent?key={self.api_key}"

    def generate(self, prompt: str, temperature: float = 0.7, max_tokens: int = 2048) -> str:
        url = self._get_endpoint()
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens, "topP": 0.95, "topK": 40}
        }
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()

        if "candidates" in data and len(data["candidates"]) > 0:
            candidate = data["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                return "".join([part.get("text", "") for part in candidate["content"]["parts"]])
        return ""


gemini_client = GeminiClient(api_key=settings.gemini_api_key, model=settings.gemini_model, location=settings.gemini_location)


@dataclass
class GameMetadata:
    questions: List[Dict[str, Any]]
    extraData: Dict[str, Any]
    timeTakenSeconds: Optional[int] = None
    correctAnswers: Optional[int] = None
    totalQuestions: Optional[int] = None

    @classmethod
    def from_dict(cls, data: Dict) -> 'GameMetadata':
        if isinstance(data, str):
            data = json.loads(data)
        return cls(questions=data.get("questions", []), extraData=data.get("extraData", {}),
                   timeTakenSeconds=data.get("timeTakenSeconds"), correctAnswers=data.get("correctAnswers"),
                   totalQuestions=data.get("totalQuestions"))


@dataclass
class UserGameScore:
    id: int
    user_id: int
    game_id: int
    game_name: str
    game_type: str
    difficulty: str
    scores: int
    metadata: GameMetadata
    created_at: datetime
    username: Optional[str] = None

    @classmethod
    def from_db_row(cls, data: Dict) -> 'UserGameScore':
        created_at = data.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        elif created_at is None:
            created_at = datetime.now()
        return cls(id=data.get("id", 0), user_id=data.get("user_id", 0), game_id=data.get("game_id", 0),
                   game_name=data.get("game_name", "Unknown"), game_type=data.get("game_type", "UNKNOWN"),
                   difficulty=data.get("difficulty", "EASY"), scores=data.get("scores", 0),
                   metadata=GameMetadata.from_dict(data.get("metadata", {})), created_at=created_at,
                   username=data.get("username"))


class GameScoreAnalytics:
    def __init__(self, client: Optional[GeminiClient] = None):
        self.scores: List[UserGameScore] = []
        self.client = client or gemini_client
        if self.client is None:
            raise ValueError("GeminiClient is required.")

    def load_data(self, scores_data: List[Dict]) -> None:
        self.scores = [UserGameScore.from_db_row(s) for s in scores_data]
        logger.info(f"Loaded {len(self.scores)} score records")

    def get_basic_stats(self) -> Dict[str, Any]:
        if not self.scores:
            return {}
        total_scores = len(self.scores)
        avg_score = sum(s.scores for s in self.scores) / total_scores
        max_score = max(s.scores for s in self.scores)
        min_score = min(s.scores for s in self.scores)
        by_type = defaultdict(list)
        by_difficulty = defaultdict(list)
        by_user = defaultdict(list)
        for score in self.scores:
            by_type[score.game_type].append(score)
            by_difficulty[score.difficulty].append(score)
            by_user[score.user_id].append(score)
        return {
            "total_records": total_scores,
            "average_score": round(avg_score, 2),
            "max_score": max_score,
            "min_score": min_score,
            "unique_users": len(by_user),
            "by_game_type": {k: len(v) for k, v in by_type.items()},
            "by_difficulty": {k: len(v) for k, v in by_difficulty.items()},
            "top_performers": [
                {"user_id": uid, "username": scores[0].username,
                 "avg_score": round(sum(s.scores for s in scores) / len(scores), 2)}
                for uid, scores in sorted(by_user.items(),
                                          key=lambda x: sum(s.scores for s in x[1]) / len(x[1]), reverse=True)[:5]
            ]
        }

    def analyze_performance_patterns(self) -> str:
        stats = self.get_basic_stats()
        game_type_breakdown = []
        for score in self.scores:
            accuracy = None
            if score.metadata.correctAnswers and score.metadata.totalQuestions:
                accuracy = (score.metadata.correctAnswers / score.metadata.totalQuestions) * 100
            game_type_breakdown.append({
                "user": score.username or f"User_{score.user_id}",
                "game": score.game_name, "type": score.game_type, "difficulty": score.difficulty,
                "score": score.scores, "accuracy": round(accuracy, 2) if accuracy else None,
                "time_taken": score.metadata.timeTakenSeconds
            })
        prompt = f"""You are an educational data analyst. Analyze this game score data and provide insights.

DATA SUMMARY:
- Total Records: {stats.get('total_records')}
- Average Score: {stats.get('average_score')}
- Score Range: {stats.get('min_score')} - {stats.get('max_score')}
- Unique Users: {stats.get('unique_users')}

DISTRIBUTION BY GAME TYPE: {json.dumps(stats.get('by_game_type', {}), indent=2)}
DISTRIBUTION BY DIFFICULTY: {json.dumps(stats.get('by_difficulty', {}), indent=2)}

TOP PERFORMERS: {json.dumps(stats.get('top_performers', []), indent=2)}

DETAILED RECORDS (Sample of {min(20, len(game_type_breakdown))} records):
{json.dumps(game_type_breakdown[:20], indent=2)}

Please provide:
1. **Overall Performance Assessment** - How are students performing?
2. **Game Type Analysis** - Which subjects show strongest/weakest performance?
3. **Difficulty Impact** - Does difficulty level affect scores as expected?
4. **Learning Recommendations** - What should students focus on?
5. **Anomaly Detection** - Any unusual patterns or outliers?

Format your response with clear headers and bullet points."""
        return self.client.generate(prompt, temperature=0.3)

    def generate_personalized_report(self, user_id: int) -> str:
        user_scores = [s for s in self.scores if s.user_id == user_id]
        if not user_scores:
            return "No data found for this user."
        username = user_scores[0].username or f"User_{user_id}"
        user_stats = {
            "total_games": len(user_scores),
            "average_score": sum(s.scores for s in user_scores) / len(user_scores),
            "games_played": list(set(s.game_name for s in user_scores)),
            "strengths": [], "weaknesses": []
        }
        by_type = defaultdict(list)
        for score in user_scores:
            by_type[score.game_type].append(score.scores)
        for game_type, scores in by_type.items():
            avg = sum(scores) / len(scores)
            if avg >= 80:
                user_stats["strengths"].append(f"{game_type} (avg: {avg:.1f})")
            elif avg <= 50:
                user_stats["weaknesses"].append(f"{game_type} (avg: {avg:.1f})")
        prompt = f"""You are an educational coach. Create a personalized learning report for {username}.

STUDENT PERFORMANCE DATA:
- Total Games Played: {user_stats['total_games']}
- Overall Average Score: {user_stats['average_score']:.1f}
- Games Attempted: {', '.join(user_stats['games_played'])}

PERFORMANCE BY SUBJECT:
{json.dumps({k: sum(v)/len(v) for k, v in by_type.items()}, indent=2)}

STRENGTHS: {', '.join(user_stats['strengths']) if user_stats['strengths'] else 'None identified'}
AREAS FOR IMPROVEMENT: {', '.join(user_stats['weaknesses']) if user_stats['weaknesses'] else 'None identified'}

Please create:
1. **Encouraging Summary**
2. **Subject Breakdown**
3. **Personalized Study Plan**
4. **Goal Setting**
5. **Motivational Message**

Use an encouraging, supportive tone suitable for young learners."""
        return self.client.generate(prompt, temperature=0.3)

    def compare_with_classmates(self, user_id: int, class_scores_data: List[Dict]) -> str:
        user_scores = [s for s in self.scores if s.user_id == user_id]
        all_class_scores = [UserGameScore.from_db_row(s) for s in class_scores_data]
        user_avg = sum(s.scores for s in user_scores) / len(user_scores) if user_scores else 0
        class_avgs = []
        by_user = defaultdict(list)
        for score in all_class_scores:
            by_user[score.user_id].append(score.scores)
        for uid, scores in by_user.items():
            class_avgs.append(sum(scores) / len(scores))
        class_avgs.sort()
        percentile = sum(1 for avg in class_avgs if avg < user_avg) / len(class_avgs) * 100 if class_avgs else 0
        prompt = f"""Compare this student's performance with their class.

STUDENT'S AVERAGE SCORE: {user_avg:.1f}
CLASS AVERAGE SCORE: {sum(class_avgs)/len(class_avgs):.1f if class_avgs else 0}
PERCENTILE RANKING: {percentile:.1f}%

CLASS SIZE: {len(class_avgs)} students

Provide relative standing, competitive analysis, peer learning opportunities, growth mindset feedback, and next steps. Be encouraging."""
        return self.client.generate(prompt, temperature=0.3)


def main():
    try:
        test = gemini_client.generate("Say 'Connected successfully!'", max_tokens=10)
        logger.info(f"Gemini API: {test}")
    except Exception as e:
        logger.error(f"Gemini failed: {e}")
        return

    db = DatabaseClient()
    try:
        users = db.list_users()
        if not users:
            print("No users with game scores found.")
            return

        print(f"\nFound {len(users)} users with scores:")
        for u in users:
            print(f"  - {u['username']} (ID: {u['id']})")

        raw_scores = db.fetch_game_scores()
        if not raw_scores:
            print("No game scores found.")
            return

        analytics = GameScoreAnalytics()
        analytics.load_data(raw_scores)

        print("\n" + "=" * 60)
        print("BASIC STATISTICS")
        print("=" * 60)
        stats = analytics.get_basic_stats()
        print(json.dumps(stats, indent=2))

        print("\n" + "=" * 60)
        print("AI PERFORMANCE ANALYSIS")
        print("=" * 60)
        try:
            analysis = analytics.analyze_performance_patterns()
            print(analysis)
        except Exception as e:
            print(f"AI Analysis failed: {e}")

        target_user_id = users[0]['id']
        target_username = users[0]['username']
        print("\n" + "=" * 60)
        print(f"PERSONALIZED REPORT FOR {target_username.upper()}")
        print("=" * 60)
        try:
            report = analytics.generate_personalized_report(target_user_id)
            print(report)
        except Exception as e:
            print(f"Report failed: {e}")

        if len(users) > 1:
            print("\n" + "=" * 60)
            print(f"CLASS COMPARISON FOR {target_username.upper()}")
            print("=" * 60)
            try:
                class_data = db.fetch_class_scores(exclude_user_id=target_user_id)
                if class_data:
                    comp = analytics.compare_with_classmates(target_user_id, class_data)
                    print(comp)
                else:
                    print("No class data available.")
            except Exception as e:
                print(f"Comparison failed: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    main()