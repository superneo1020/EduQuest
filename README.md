## Project Overview
**EduQuest** is a comprehensive educational platform with AI-powered learning features, gamification, and multi-role support (Students, Teachers, Administrators).

## System Architecture
- **Frontend**: React Native/Expo mobile app
- **Backend**: Spring Boot (Java) + Python FastAPI (AI services)
- **Database**: PostgreSQL with pgvector for AI embeddings
- **AI Integration**: Google Gemini 2.5 Flash Lite + OpenAI Whisper

## Quick Start Setup

### Prerequisites
- Node.js 22
- Python 3.13
- Java 17+
- PostgreSQL
- Ollama (for local embeddings)

### Installation Steps

1. **Frontend Setup**
```bash
cd expofrontend
npm install
npx expo start
```

2. **Python Backend Setup**
```bash
cd pythonbackend
pip install -r requirements.txt
python main.py
```

3. **Spring Backend Setup**
```bash
cd springbackend
./gradlew bootRun
```

4. **Database Setup**
```bash
# Create PostgreSQL database
createdb eduquestdb
# User: eduquestuser, Password: eduquestpass
```

## Testing Scenarios for Professor

### Login Credentials (Test Accounts)

**Teacher Account:**
- Username: `edu_teacher1`
- Password: `password`

**Student Account:**
- Username: `student1`
- Password: `password`

**Admin Account:**
- Username: `admin`
- Password: `password`

### App Testing

#### 1. **Student Experience Flow**
1. **Login** with student credentials
2. **Home Dashboard** - View XP, level, daily quests
3. **Subject Games** - Test Math, English, Science, Chinese games
4. **AI Chatbot** - Ask educational questions
5. **Profile Customization** - Change avatar, badges, backgrounds
6. **Leaderboard** - View rankings and achievements
7. **Shop/Inventory** - Purchase items with points

#### 2. **Teacher Dashboard Flow**
1. **Login** with teacher credentials
2. **Dashboard Overview** - View class statistics
3. **Student Management** - Add/remove students, view progress
4. **Class Analytics** - Monitor performance trends
5. **AI Analysis** - Generate student performance reports
6. **Game Scores** - Review individual student results

#### 3. **Administrator Functions**
1. **Role Management** - Approve teacher requests
2. **User Administration** - Manage all system users
3. **System Analytics** - View platform-wide statistics
