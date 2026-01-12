// src/api/client.ts
import Constants from "expo-constants";

/**
 * Choose the correct backend base URL depending on platform / environment.
 * - Expo web: use http://localhost:8080 (but remember to allow CORS on the backend for the Expo web origin)
 * - Android emulator: 10.0.2.2
 * - iOS simulator: localhost
 * - Physical device: set REACT_NATIVE_PUBLIC_HOST to your machine IP (or change manually)
 */

export function getApiBaseUrl(): string {
    // You can override via env: REACT_NATIVE_PUBLIC_HOST
    // Expo app config: expo - eas - you can set env in app.json if needed.
    const override = (Constants.expoConfig?.extra as any)?.API_BASE_URL || process.env.REACT_NATIVE_PUBLIC_HOST;
    if (override) return override;

    // Basic heuristic: if running on web, use localhost:8080
    if (typeof window !== "undefined") {
        return "http://localhost:8080";
    }

    // For native, prefer Android emulator host mapping
    // Note: if you run on Android emulator, use 10.0.2.2
    // If using Genymotion use 10.0.3.2
    // For iOS simulator, localhost works
    // Change here if you need a different default
    // eslint-disable-next-line no-undef
    const platform = (global as any).navigator?.product || "";
    if (platform === "ReactNative") {
        // Default to Android emulator mapping — change if testing iOS
        return "http://10.0.2.2:8080";
    }

    return "http://localhost:8080";
}