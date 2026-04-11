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
import { User, Lock, Mail, GraduationCap } from "lucide-react-native";
import { getApiBaseUrl } from "../../src/api/client";
import { TeacherRegistrationStorage } from "../../src/utils/teacherRegistrationStorage";

export default function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [userType, setUserType] = useState<"student" | "teacher">("student");
    const [schoolName, setSchoolName] = useState("");
    const [teacherReason, setTeacherReason] = useState("");

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

        // Additional validation for teacher registration
        if (userType === "teacher") {
            if (!schoolName) {
                setErrorMsg("School name is required for teacher registration");
                return;
            }
            if (!teacherReason) {
                setErrorMsg("Please provide a reason for teacher registration");
                return;
            }
        }

        setLoading(true);

        try {
            if (userType === "teacher") {
                // Create teacher registration request
                await TeacherRegistrationStorage.createRequest({
                    username,
                    email,
                    password,
                    schoolName,
                    reason: teacherReason
                });

                setErrorMsg(null);
                alert("Teacher registration request submitted successfully! Please wait for admin approval.");
                router.replace("/Profile/Login");
            } else {
                // Normal student registration
                await axios.post(`${getApiBaseUrl()}/api/auth/register`, {
                    username,
                    email,
                    password,
                    isEducator: false,
                    schoolName: null
                });
                router.replace("/Profile/Login");
            }
        } catch (error: any) {
            const serverData = error.response?.data;
            let displayMsg = "Registration failed, please try again.";
            if (typeof serverData === 'string') displayMsg = serverData;
            else if (serverData?.message) displayMsg = serverData.message;
            else if (error.message) displayMsg = error.message;
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
                        {/* User Type Selection */}
                        <View style={styles.userTypeContainer}>
                            <Text style={styles.userTypeLabel}>I am a:</Text>
                            <View style={styles.userTypeButtons}>
                                <TouchableOpacity
                                    style={[styles.userTypeButton, userType === "student" && styles.userTypeButtonActive]}
                                    onPress={() => setUserType("student")}
                                >
                                    <User size={20} color={userType === "student" ? "#FFF" : "#888"} />
                                    <Text style={[styles.userTypeButtonText, userType === "student" && styles.userTypeButtonTextActive]}>
                                        Student
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.userTypeButton, userType === "teacher" && styles.userTypeButtonActive]}
                                    onPress={() => setUserType("teacher")}
                                >
                                    <GraduationCap size={20} color={userType === "teacher" ? "#FFF" : "#888"} />
                                    <Text style={[styles.userTypeButtonText, userType === "teacher" && styles.userTypeButtonTextActive]}>
                                        Teacher
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

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

                        {/* Confirm Password Input */}
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

                        {/* Teacher-specific fields */}
                        {userType === "teacher" && (
                            <>
                                <View style={styles.inputWrapper}>
                                    <GraduationCap size={20} color="#888" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="School Name"
                                        value={schoolName}
                                        onChangeText={(t) => { setSchoolName(t); setErrorMsg(null); }}
                                        placeholderTextColor="#AAA"
                                    />
                                </View>

                                <View style={styles.inputWrapper}>
                                    <User size={20} color="#888" style={styles.icon} />
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        placeholder="Why do you want to become a teacher?"
                                        value={teacherReason}
                                        onChangeText={(t) => { setTeacherReason(t); setErrorMsg(null); }}
                                        multiline
                                        numberOfLines={3}
                                        placeholderTextColor="#AAA"
                                    />
                                </View>
                            </>
                        )}

                        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

                        <TouchableOpacity
                            style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerText}>
                                {userType === "teacher" ? "Submit Teacher Request" : "Create Account"}
                            </Text>}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7F9FB" },
    scrollContent: { padding: 30, justifyContent: "center", flexGrow: 1 },
    header: { marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 32, fontWeight: "800", color: "#2D3436" },
    subtitle: { fontSize: 16, color: "#636E72", marginTop: 5, textAlign: 'center' },
    card: { backgroundColor: "#FFF", borderRadius: 24, padding: 25, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },

    // User Type Selection Styles
    userTypeContainer: { marginBottom: 20 },
    userTypeLabel: { fontSize: 16, fontWeight: "600", color: "#2D3436", marginBottom: 10 },
    userTypeButtons: { flexDirection: "row", gap: 10 },
    userTypeButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F1F3F5",
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "transparent"
    },
    userTypeButtonActive: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
    userTypeButtonText: { fontSize: 14, fontWeight: "600", color: "#888", marginLeft: 8 },
    userTypeButtonTextActive: { color: "#FFF" },

    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F5', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15 },
    icon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#2D3436' },
    textArea: { height: 80, textAlignVertical: 'top' },
    registerBtn: { backgroundColor: "#4CAF50", paddingVertical: 16, borderRadius: 12, marginTop: 10 },
    registerText: { color: "#FFF", fontWeight: "700", textAlign: "center", fontSize: 18 },
    errorText: { color: "#FF5252", textAlign: "center", marginVertical: 10, fontWeight: "600" },
    loginLink: { marginTop: 25, textAlign: "center", color: "#636E72", fontSize: 15, fontWeight: '600' }
});
