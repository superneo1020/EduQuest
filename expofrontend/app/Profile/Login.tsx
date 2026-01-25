import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/auth/AuthContext";

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signIn } = useAuth();

    const handleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            await signIn(username, password);
            router.replace("/");
        } catch (err: any) {
            console.log("Login Error:", err);

            if (err.response?.status === 401) {
                setError("Incorrect account or password, please try again");
            } else {
                setError("Login failed. Please try again later.");
            }

            setPassword("");
        } finally {
            setLoading(false);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>
                Login to continue your learning adventure
            </Text>

            <View style={styles.form}>
                <TextInput
                    placeholder="User"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={(text) => {
                        setUsername(text);
                        setError(null);
                    }}
                    style={styles.input}
                />

                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setError(null);
                    }}
                    style={styles.input}
                    secureTextEntry
                />

                {loading ? (
                  <ActivityIndicator size="large" color="#007AFF" />
                ) : (
                  <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={!username || !password}>
                      <Text style={styles.loginText}>Login</Text>
                  </TouchableOpacity>
                )}
                {error && (
                    <Text style={styles.errorText}>{error}</Text>
                )}


                {loading ? (
                  <ActivityIndicator size="large" color="#007AFF" />
                ) : (
                  <TouchableOpacity onPress={() => router.push("/Profile/Register")}>
                      <Text style={styles.registerText}>
                          Don’t have an account? Register
                      </Text>
                  </TouchableOpacity>
                )}

            </View>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF",
        paddingHorizontal: 30,
        justifyContent: "center",
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#4CAF50",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 40,
        marginTop: 10,
    },
    form: {
        gap: 18,
    },
    input: {
        borderWidth: 1.5,
        borderColor: "#4CAF50",
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 10,
    },
    loginText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
    },
    registerText: {
        textAlign: "center",
        marginTop: 16,
        color: "#4CAF50",
        fontWeight: "600",
    },
    errorText: {
        color: "#E53935",
        marginTop: 10,
        textAlign: "center",
        fontSize: 14,
        fontWeight: "600",
    },

});