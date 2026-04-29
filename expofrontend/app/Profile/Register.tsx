import React, { useState, useEffect, useRef } from "react";
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
    Platform,
    Animated
} from "react-native";
import { router } from "expo-router";
import axios from "axios";
import { User, Lock, Mail, GraduationCap, Sparkles } from "lucide-react-native";
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
    
    // Animation values
    const logoScale = useRef(new Animated.Value(1)).current;
    
    useEffect(() => {
        const pulseAnimation = Animated.sequence([
            Animated.timing(logoScale, {
                toValue: 1.05,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]);
        
        const loopAnimation = Animated.loop(pulseAnimation);
        loopAnimation.start();
        
        return () => loopAnimation.stop();
    }, []);

    const handleRegister = async () => {
        setErrorMsg(null);

        // Check if all fields are filled
        if (!username || !email || !password || !confirmPassword) {
            setErrorMsg("Please fill in all fields");
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match");
            return;
        }

        // Check password length (backend requires minimum 8 characters)
        if (password.length < 8) {
            setErrorMsg("Password must be at least 8 characters long");
            return;
        }

        // Additional validation for teacher registration
        if (userType === "teacher") {
            if (!teacherReason) {
                setErrorMsg("Please provide a reason for teacher registration");
                return;
            }
        }

        // School name is required for both students and teachers
        if (!schoolName) {
            setErrorMsg("School name is required");
            return;
        }

        setLoading(true);

        try {
            // Direct registration for both student and teacher
            await axios.post(`${getApiBaseUrl()}/api/auth/register`, {
                username,
                email,
                password,
                isEducator: userType === "teacher",
                schoolName: schoolName
            });

            if (userType === "teacher") {
                // Also save the request reason for admin review
                await TeacherRegistrationStorage.createRequest({
                    username,
                    email,
                    password,
                    schoolName,
                    reason: teacherReason
                });

                setErrorMsg(null);
                alert("Teacher registration submitted successfully! Your account is created and pending admin approval.");
            } else {
                setErrorMsg(null);
                alert("Student registration successful!");
            }
            router.replace("/Profile/Login");
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
                        <Animated.View style={[styles.logoCircle, { transform: [{ scale: logoScale }] }]}>
                            <View style={styles.logoIcon}>
                                <Sparkles size={24} color="white" fill="white" />
                            </View>
                        </Animated.View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join EduQuest today</Text>
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
                                    <User size={20} color={userType === "student" ? "#FFF" : "#64748B"} />
                                    <Text style={[styles.userTypeButtonText, userType === "student" && styles.userTypeButtonTextActive]}>
                                        Student
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.userTypeButton, userType === "teacher" && styles.userTypeButtonActive]}
                                    onPress={() => setUserType("teacher")}
                                >
                                    <GraduationCap size={20} color={userType === "teacher" ? "#FFF" : "#64748B"} />
                                    <Text style={[styles.userTypeButtonText, userType === "teacher" && styles.userTypeButtonTextActive]}>
                                        Teacher
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Username Input */}
                        <View style={styles.inputWrapper}>
                            <View style={styles.iconContainer}>
                                <User size={20} color="#64748B" />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                value={username}
                                onChangeText={(t) => { setUsername(t); setErrorMsg(null); }}
                                autoCapitalize="none"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputWrapper}>
                            <View style={styles.iconContainer}>
                                <Mail size={20} color="#64748B" />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={(t) => { setEmail(t); setErrorMsg(null); }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputWrapper}>
                            <View style={styles.iconContainer}>
                                <Lock size={20} color="#64748B" />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Password (min 8 characters)"
                                value={password}
                                onChangeText={(t) => { setPassword(t); setErrorMsg(null); }}
                                secureTextEntry
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputWrapper}>
                            <View style={styles.iconContainer}>
                                <Lock size={20} color="#64748B" />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChangeText={(t) => { setConfirmPassword(t); setErrorMsg(null); }}
                                secureTextEntry
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* School Name - Required for both students and teachers */}
                        <View style={styles.inputWrapper}>
                            <View style={styles.iconContainer}>
                                <GraduationCap size={20} color="#64748B" />
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="School Name"
                                value={schoolName}
                                onChangeText={(t) => { setSchoolName(t); setErrorMsg(null); }}
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {/* Teacher-specific fields */}
                        {userType === "teacher" && (
                            <>

                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconContainer}>
                                        <User size={20} color="#64748B" />
                                    </View>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        placeholder="Why do you want to become a teacher?"
                                        value={teacherReason}
                                        onChangeText={(t) => { setTeacherReason(t); setErrorMsg(null); }}
                                        multiline
                                        numberOfLines={3}
                                        placeholderTextColor="#94A3B8"
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
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="large" />
                            ) : (
                                <Text style={styles.registerText}>
                                    {userType === "teacher" ? "Submit Teacher Request" : "Create Account"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => router.push("/Profile/Login")}>
                        <Text style={styles.loginLink}>
                            Already have an account? <Text style={styles.loginLinkText}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: { padding: 30, justifyContent: "center", flexGrow: 1 },
    header: { marginBottom: 30, alignItems: 'center' },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#4CAF50',
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    logoIcon: {
        width: 32,
        height: 32,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: { 
        fontSize: 28, 
        fontWeight: "800", 
        color: '#4CAF50',
        marginBottom: 8
    },
    subtitle: { 
        fontSize: 16, 
        color: '#64748B', 
        fontWeight: "500"
    },
    card: { 
        backgroundColor: "white", 
        borderRadius: 16, 
        padding: 24, 
        shadowColor: "#000", 
        shadowOpacity: 0.1, 
        shadowRadius: 4, 
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },

    // User Type Selection Styles
    userTypeContainer: { marginBottom: 24 },
    userTypeLabel: { 
        fontSize: 16, 
        fontWeight: "700", 
        color: '#1E293B', 
        marginBottom: 12,
        textAlign: "center"
    },
    userTypeButtons: { flexDirection: "row", gap: 12 },
    userTypeButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 56
    },
    userTypeButtonActive: { 
        backgroundColor: '#4CAF50', 
        borderColor: '#4CAF50'
    },
    userTypeButtonText: { 
        fontSize: 14, 
        fontWeight: "600", 
        color: "#64748B", 
        marginLeft: 8 
    },
    userTypeButtonTextActive: { 
        color: "#FFF",
        fontWeight: "700"
    },

    inputWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F8FAFC', 
        borderRadius: 12, 
        marginBottom: 16, 
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 56
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#F8FAFC",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    input: { 
        flex: 1, 
        paddingVertical: 12, 
        fontSize: 16, 
        color: '#1E293B',
        fontWeight: "500"
    },
    textArea: { 
        height: 80, 
        textAlignVertical: 'top',
        paddingTop: 12
    },
    registerBtn: { 
        backgroundColor: '#4CAF50', 
        paddingVertical: 14, 
        borderRadius: 12, 
        marginTop: 8
    },
    registerText: { 
        color: "#FFF", 
        fontWeight: "700", 
        textAlign: "center", 
        fontSize: 16
    },
    errorText: { 
        color: '#EF4444', 
        textAlign: "center", 
        marginVertical: 12, 
        fontWeight: "600",
        fontSize: 14,
        backgroundColor: '#FEF2F2',
        padding: 8,
        borderRadius: 8
    },
    loginLink: { 
        marginTop: 24, 
        textAlign: "center", 
        color: '#64748B', 
        fontSize: 14, 
        fontWeight: '500' 
    },
    loginLinkText: {
        color: '#4CAF50',
        fontWeight: '700'
    }
});
