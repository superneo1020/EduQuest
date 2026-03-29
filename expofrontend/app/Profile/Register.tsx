import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { router } from "expo-router";
import axios from "axios";
// 1. 確保引入圖標
import { User, Lock, Mail } from "lucide-react-native";
import { getApiBaseUrl } from "../../src/api/client";

export default function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleRegister = async () => {
        setErrorMsg(null);

        // 檢查欄位是否填齊
        if (!username || !email || !password || !confirmPassword) {
            setErrorMsg("Please fill in all fields");
            return;
        }

        // 改為檢查密碼是否一致
        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match");
            return;
        }

        // 檢查密碼長度 (後端要求最少8個字符)
        if (password.length < 8) {
            setErrorMsg("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${getApiBaseUrl()}/api/auth/register`, {
                username,
                email,
                password,
                isEducator: false,  // Default to student registration
                schoolName: null   // Optional school name
            });
            router.replace("/Profile/Login");
        } catch (error: any) {
            const serverData = error.response?.data;
            let displayMsg = "Registration failed, please try again.";
            if (typeof serverData === 'string') displayMsg = serverData;
            else if (serverData?.message) displayMsg = serverData.message;
            setErrorMsg(displayMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Join Us</Text>
                            <Text style={styles.subtitle}>Create an account to start your journey</Text>
                        </View>

                        <View style={styles.card}>
                            {/* Username Input */}
                            <View style={styles.inputWrapper}>
                                <User size={20} color="#888" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Username"
                                    value={username}
                                    onChangeText={(t) => { setUsername(t); setErrorMsg(null); }}
                                    autoCapitalize="none"
                                    placeholderTextColor="#AAA"
                                />
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputWrapper}>
                                <Mail size={20} color="#888" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={(t) => { setEmail(t); setErrorMsg(null); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#AAA"
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputWrapper}>
                                <Lock size={20} color="#888" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password (min 8 characters)"
                                    value={password}
                                    onChangeText={(t) => { setPassword(t); setErrorMsg(null); }}
                                    secureTextEntry
                                    placeholderTextColor="#AAA"
                                />
                            </View>

                            {/* Confirm Password Input - 修改這裡 */}
                            <View style={styles.inputWrapper}>
                                <Lock size={20} color="#888" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={(t) => { setConfirmPassword(t); setErrorMsg(null); }}
                                    secureTextEntry
                                    placeholderTextColor="#AAA"
                                />
                            </View>

                            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

                            <TouchableOpacity
                                style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerText}>Create Account</Text>}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => router.push("/Profile/Login")}>
                            <Text style={styles.loginLink}>
                                Already have an account? <Text style={{ color: '#4CAF50', fontWeight: '800' }}>Login</Text>
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
}


// 2. Styles 必須放在組件外面
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7F9FB" },
    scrollContent: { padding: 30, justifyContent: "center", flexGrow: 1 },
    header: { marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 32, fontWeight: "800", color: "#2D3436" },
    subtitle: { fontSize: 16, color: "#636E72", marginTop: 5, textAlign: 'center' },
    card: { backgroundColor: "#FFF", borderRadius: 24, padding: 25, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F5', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15 },
    icon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#2D3436' },
    registerBtn: { backgroundColor: "#4CAF50", paddingVertical: 16, borderRadius: 12, marginTop: 10 },
    registerText: { color: "#FFF", fontWeight: "700", textAlign: "center", fontSize: 18 },
    errorText: { color: "#FF5252", textAlign: "center", marginVertical: 10, fontWeight: "600" },
    loginLink: { marginTop: 25, textAlign: "center", color: "#636E72", fontSize: 15, fontWeight: '600' }
});
