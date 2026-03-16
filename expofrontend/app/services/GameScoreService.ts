import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface GameScoreRequest {
    gameName: string;
    scores: number;
    gameType: string;
    gameDifficulty: string;
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

            const response = await axios.post(
                `${this.getApiBaseUrl()}/api/user/game/score`,
                gameData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Game score saved successfully:', response.data);
        } catch (error) {
            console.error('Failed to save game score:', error);
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
