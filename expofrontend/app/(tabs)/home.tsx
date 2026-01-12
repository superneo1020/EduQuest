// app/_private.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/src/auth/AuthContext";
import { useRouter } from "expo-router";

/**
 * Simple wrapper that redirects to login if not authenticated.
 * Place pages that require auth inside this layout (or use it programmatically).
 */
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      // navigate to login stack if not authenticated
      router.replace("../(auth)/login");
    }
  }, [token]);

  if (!token) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});