import { GameMetadata } from '../../types/GameMetadata';

/**
 * Converts frontend GameMetadata structure to backend expected format
 */
export function convertToBackendMetadata(frontendMetadata: GameMetadata) {
    const questions = frontendMetadata.questions.map(q => ({
        id: q.id,
        content: q.question, // Backend expects 'content' field
        questionType: q.questionType || 'default',
        userAnswer: String(q.userAnswer || ''),
        correctAnswer: String(q.correctAnswer),
        isCorrect: q.isCorrect || false,
        timeSpent: q.timeSpent || 0
    }));

    const extraData = {
        gameType: frontendMetadata.gameType,
        gameDifficulty: frontendMetadata.gameDifficulty,
        timestamp: frontendMetadata.timestamp,
        finalScore: frontendMetadata.finalScore,
        ...frontendMetadata.gameSpecificData
    };

    return {
        questions: questions,
        extraData: extraData
    };
}