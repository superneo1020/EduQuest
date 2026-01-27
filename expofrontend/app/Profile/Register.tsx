import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { router } from "expo-router";
import axios from "axios";
import { getApiBaseUrl } from "../../src/api/client";

export default function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [confirmEmail, setConfirmEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // 新增：專門儲存要顯示在畫面上的錯誤訊息
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleRegister = async () => {
        // 每次點擊按鈕先清除舊的錯誤
        setErrorMsg(null);

        // 1. 前端基本驗證
        if (!username || !email || !confirmEmail || !password) {
            setErrorMsg("Please fill in all fields");
            return;
        }

        if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
            setErrorMsg("The two email addresses entered are inconsistent.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMsg("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${getApiBaseUrl()}/api/auth/register`, {
                username,
                email,
                password,
            });

            // 註冊成功可以用 Alert，因為這是重大事件
            router.replace("/Profile/Login");
        } catch (error: any) {
            const serverData = error.response?.data;
            let displayMsg = "Registration failed, please try again later.";

            if (typeof serverData === 'string') {
                displayMsg = serverData;
            } else if (serverData?.message) {
                displayMsg = serverData.message;
            } else if (serverData?.errors) {
                displayMsg = Object.values(serverData.errors).join("\n");
            }

            // 將後端錯誤設定到狀態中顯示
            setErrorMsg(displayMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create An Account</Text>

            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={(text) => { setUsername(text); setErrorMsg(null); }}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => { setEmail(text); setErrorMsg(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Confirm Email"
                placeholderTextColor="#999"
                value={confirmEmail}
                onChangeText={(text) => { setConfirmEmail(text); setErrorMsg(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={(text) => { setPassword(text); setErrorMsg(null); }}
            />

            <TouchableOpacity
                style={[styles.registerBtn, loading && { backgroundColor: "#aaa" }]}
                onPress={handleRegister}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerText}>Register</Text>}
            </TouchableOpacity>

            {/* 新增：在按鈕下方的錯誤提示區域 */}
            {errorMsg ? (

                    <Text style={styles.errorText}>{errorMsg}</Text>

            ) : null}

            <Text style={styles.loginLink} onPress={() => router.push("/Profile/Login")}>
                Already have an account? Login →
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: "center", padding: 30, backgroundColor: '#fff' },
    title: { fontSize: 30, fontWeight: "bold", color: "#4CAF50", textAlign: "center", marginBottom: 40 },
    input: {
        borderWidth: 1,
        borderColor: "#aaa",
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    registerBtn: {
        backgroundColor: "#4CAF50",
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        height: 55,
        justifyContent: 'center'
    },
    registerText: { color: "#fff", fontWeight: "bold", textAlign: "center", fontSize: 18 },

    errorText: {
        color: "#E53935",
        marginTop: 10,
        textAlign: "center",
        fontSize: 14,
        fontWeight: "600",
    },
    loginLink: {
        marginTop: 20,
        textAlign: "center",
        color: "#4CAF50",
        fontWeight: "bold",
        fontSize: 16,
    },
});