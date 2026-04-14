// Unified Game Metadata Interface
export interface GameMetadata {
  // Common fields for all games
  gameType: string;
  gameDifficulty: string;
  timestamp: string;
  finalScore: number;
  
  // Questions and user answers for detailed tracking
  questions: Array<{
    id: string | number;
    question: string;
    correctAnswer: string | number | number[];
    userAnswer?: string | number | number[];
    isCorrect?: boolean;
    questionType?: string; // e.g., 'multiple-choice', 'text-input', 'matching', etc.
    options?: string[]; // For multiple choice questions
    timeSpent?: number; // Time spent on this question in seconds
    earnedPoints?: number; // Points earned for this question
    score?: number; // Score for this question
    maxScore?: number; // Maximum score for this question
  }>;
  
  // Game-specific data wrapped in unified structure
  gameSpecificData: {
    // Human Body Game specific fields
    totalOrgans?: number;
    correctIdentifications?: number;
    
    // Claw Machine Game specific fields
    totalAttempts?: number;
    caughtAnimals?: number;
    
    // Calculation Game specific fields
    totalTime?: number;
    correctAnswers?: number;
    totalQuestions?: number;
    
    // Chinese Quiz Game specific fields
    totalCharacters?: number;
    correctCharacters?: number;
    
    // Sentence Reorder Game specific fields
    totalSentences?: number;
    correctSentences?: number;
    
    // Writing Game specific fields
    totalWords?: number;
    correctWords?: number;
    
    // Listening Game specific fields
    audioClips?: number;
    correctAnswers?: number;
    
    // Animal Classification Game specific fields
    totalAnimals?: number;
    correctClassifications?: number;
    
    // Applied Math Game specific fields
    totalProblems?: number;
    correctProblems?: number;
    
    // Body Parts Matching Game specific fields
    totalParts?: number;
    correctMatches?: number;
    
    // Add more game-specific fields as needed
    [key: string]: any; // Allow additional fields for future games
  };
}

// Helper function to create unified metadata
export function createGameMetadata(
  gameType: string,
  gameDifficulty: string,
  finalScore: number,
  gameSpecificData: Record<string, any>,
  questions: Array<{
    id: string | number;
    question: string;
    correctAnswer: string | number;
    userAnswer?: string | number;
    isCorrect?: boolean;
    questionType?: string;
    options?: string[];
    timeSpent?: number;
  }> = []
): GameMetadata {
  return {
    gameType,
    gameDifficulty,
    timestamp: new Date().toISOString(),
    finalScore,
    questions,
    gameSpecificData
  };
}
