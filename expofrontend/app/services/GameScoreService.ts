import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface GameScoreRequest {
    gameName: string;
    scores: number;
    gameType?: string;
    gameDifficulty?: string;
    questions?: Array<{
        id: number;
        content: string;
        questionType?: string;
        userAnswer?: string;
        correctAnswer?: string;
        isCorrect?: boolean;
        timeSpent?: number;
    }>;
    gameSpecificData?: Record<string, any>;
}

export interface GameResult {
    correct?: number;
    wrong?: number;
    total?: number;
    score: number;
    accuracy?: number;
    maxStreak?: number;
    difficulty?: string;
    gameType?: string;
    timestamp?: string;
}

class GameScoreService {
    private getApiBaseUrl(): string {
        if (typeof window !== "undefined") {
            return "http://localhost:8080";
        }
        return "http://10.0.2.2:8080";
    }

    /**
     * Save game score to backend (will appear in Recent Achievements)
     */
    async saveGameScore(gameData: GameScoreRequest): Promise<void> {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Transform data to match backend expectations
            console.log('Original gameData:', gameData);
            
            // Known game names from database
            const knownGames = [
                "Speed Calculation",
                "AI Math Adventure", 
                "Listening multiple choice questions",
                "Word matching game",
                "Sentence Reordering Game",
                "Animal sorting game",
                "Human Body Puzzle"
            ];
            
            // Ensure gameName is not blank and within 50 chars
            const gameName = gameData.gameName?.trim();
            console.log('Trimmed gameName:', `"${gameName}"`);
            console.log('GameName length:', gameName?.length);
            console.log('Known games:', knownGames);
            console.log('Is game known?', knownGames.includes(gameName));
            
            if (!gameName || gameName.length === 0) {
                throw new Error('Game name cannot be empty');
            }
            if (gameName.length > 50) {
                throw new Error('Game name too long (max 50 characters)');
            }
            
            if (!knownGames.includes(gameName)) {
                console.warn(`Warning: Game name "${gameName}" is not in the known games list`);
            }
            
            // Ensure scores is a valid integer >= 0
            const scores = Math.max(0, Math.floor(gameData.scores || 0));
            
            const backendRequest = {
                gameName: gameName,
                scores: scores,
                metadata: {
                    questions: gameData.questions || [],
                    extraData: {
                        gameType: gameData.gameType || 'EDUCATIONAL',
                        gameDifficulty: gameData.gameDifficulty || 'MEDIUM',
                        timestamp: new Date().toISOString(),
                        finalScore: scores,
                        ...gameData.gameSpecificData
                    }
                }
            };
            
            console.log('Backend request:', JSON.stringify(backendRequest, null, 2));

            const response = await axios.post(
                `${this.getApiBaseUrl()}/api/user/game/score`,
                backendRequest,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Game score saved successfully:', response.data);
        } catch (error: any) {
            console.error('Failed to save game score:', error);
            
            // Enhanced error logging for debugging
            if (error.response) {
                console.error('Backend validation error:', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
                
                // Try to extract validation error details
                if (error.response.data && typeof error.response.data === 'object') {
                    console.error('Validation error details:', JSON.stringify(error.response.data, null, 2));
                }
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Request setup error:', error.message);
            }
            
            throw error;
        }
    }

    /**
     * Save game result locally for offline functionality
     */
    async saveLocalResult(gameName: string, result: GameResult): Promise<void> {
        try {
            const key = `${gameName.toLowerCase().replace(/\s+/g, '_')}_results`;
            const existingResults = await AsyncStorage.getItem(key);
            const results = existingResults ? JSON.parse(existingResults) : [];
            
            results.push({
                ...result,
                date: new Date().toISOString(),
            });

            // Keep only last 10 results locally
            if (results.length > 10) {
                results.splice(0, results.length - 10);
            }

            await AsyncStorage.setItem(key, JSON.stringify(results));
        } catch (error) {
            console.error('Failed to save local result:', error);
        }
    }

    /**
     * Get local game results
     */
    async getLocalResults(gameName: string): Promise<any[]> {
        try {
            const key = `${gameName.toLowerCase().replace(/\s+/g, '_')}_results`;
            const existingResults = await AsyncStorage.getItem(key);
            return existingResults ? JSON.parse(existingResults) : [];
        } catch (error) {
            console.error('Failed to get local results:', error);
            return [];
        }
    }

    /**
     * Helper method to save both local and backend scores
     */
    async saveCompleteGameResult(
        gameName: string,
        result: GameResult,
        gameType: string = 'EDUCATIONAL',
        difficulty: string = 'MEDIUM'
    ): Promise<void> {
        try {
            // Save locally first for immediate feedback
            await this.saveLocalResult(gameName, result);

            // Save to backend for Recent Achievements
            await this.saveGameScore({
                gameName,
                scores: result.score,
                gameType,
                gameDifficulty: difficulty
            });

            console.log(`Game result for ${gameName} saved successfully`);
        } catch (error) {
            console.error('Failed to save complete game result:', error);
            // Still keep local save even if backend fails
        }
    }
}

export default new GameScoreService();
