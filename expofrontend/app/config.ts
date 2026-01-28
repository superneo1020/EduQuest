// app/config.ts
export const Config = {
    AI_BASE_URL: process.env.EXPO_PUBLIC_AI_BASE_URL || 'http://localhost:1234/v1',
    AI_MODEL_NAME: process.env.EXPO_PUBLIC_AI_MODEL || 'local-model',
    AI_ENABLED: process.env.EXPO_PUBLIC_AI_ENABLED === 'true' || false, // 默認禁用
};