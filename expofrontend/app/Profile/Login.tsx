import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/auth/AuthContext";
import { User, Lock } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // 建議加上圖標

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

            // 注意：因為 setUser 是異步的，直接拿剛剛 signIn 存入的數據最保險
            // 或者在 AuthContext 的 signIn 裡 return userData

            // 獲取存儲在 AsyncStorage 的用戶資訊來判斷
            const storedUser = await AsyncStorage.getItem('auth_user');
            const user = JSON.parse(storedUser || '{}');

            // 檢查 roles 陣列中是否包含 ADMIN 權限
            // 這裡要對應你後端回傳的字串，通常是 'ROLE_ADMIN' 或 'ADMIN'
            const isAdmin = user.roles?.some((role: string) =>
                role === 'ROLE_ADMIN' || role === 'ADMIN'
            );
            const isEducator = user.roles?.some((role: string) =>
                role === 'ROLE_EDUCATOR'
            );

            if (isAdmin) {
                console.log("Welcome Admin!");
                router.replace("/admin"); // 導向你的 Admin 面板路徑
            }
            else if (isEducator) {
                console.log("Welcome Educator!");
                router.replace("/teacher/teacher"); // 導向你的 Admin 面板路徑
            }
            else {
                console.log("Welcome Student!");
                router.replace("/"); // 導向一般學生首頁
            }


        } catch (err: any) {
            setError(err.response?.status === 401 ? "Account or password incorrect" : "Login failed");
            setPassword("");
        } finally {
            setLoading(false);
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
                <View style={styles.inner}>
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>🎓</Text>
                        </View>
                        <Text style={styles.title}>EduQuest</Text>
                        <Text style={styles.subtitle}>Adventure starts with learning</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <User size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Username"
                                value={username}
                                onChangeText={setUsername}
                                style={styles.input}
                                placeholderTextColor="#AAA"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Lock size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                style={styles.input}
                                secureTextEntry
                                placeholderTextColor="#AAA"
                            />
                        </View>

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity
                            style={[styles.loginButton, (!username || !password) && styles.disabledBtn]}
                            onPress={handleLogin}
                            disabled={!username || !password || loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginText}>Sign In</Text>}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => router.push("/Profile/Register")}>
                        <Text style={styles.registerText}>
                            New here? <Text style={styles.registerLink}>Create Account</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F9FB"
    },
    inner: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: "center" },
    header: {
        alignItems: "center",
        marginBottom: 40 },
    logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", marginBottom: 15 },
    logoEmoji: { fontSize: 40 },
    title: { fontSize: 32, fontWeight: "800", color: "#2D3436" },
    subtitle: { fontSize: 16, color: "#636E72", marginTop: 5 },
    form: { backgroundColor: "#FFF", padding: 25, borderRadius: 24, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F3F5", borderRadius: 12, marginBottom: 15, paddingHorizontal: 15 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: "#2D3436" },
    loginButton: { backgroundColor: "#4CAF50", paddingVertical: 16, borderRadius: 12, marginTop: 10, alignItems: "center" },
    disabledBtn: { backgroundColor: "#A5D6A7" },
    loginText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
    errorText: { color: "#FF5252", textAlign: "center", marginBottom: 10, fontWeight: "600" },
    registerText: { textAlign: "center", marginTop: 25, color: "#636E72", fontSize: 15 },
    registerLink: { color: "#4CAF50", fontWeight: "700" }
});