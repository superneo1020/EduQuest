import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Image
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/auth/AuthContext";
import { User, Lock, Sparkles } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signIn } = useAuth();
    
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

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signIn(username, password);

            // Debug: Check if token was stored
            const storedToken = await AsyncStorage.getItem('auth_token');
            console.log('Login: Stored token after signIn:', storedToken ? storedToken.substring(0, 20) + '...' : 'missing');

            // Get stored user info to determine role
            const storedUser = await AsyncStorage.getItem('auth_user');
            const user = JSON.parse(storedUser || '{}');
            console.log('Login: User roles:', user.roles);

            // Check if roles array contains ADMIN permission
            const isAdmin = user.roles?.some((role: string) =>
                role === 'ROLE_ADMIN' || role === 'ADMIN'
            );
            const isEducator = user.roles?.some((role: string) =>
                role === 'ROLE_EDUCATOR'
            );

            if (isAdmin) {
                console.log("Welcome Admin!");
                router.replace("/admin");
            }
            else if (isEducator) {
                console.log("Welcome Educator!");
                router.replace("/teacher/teacher");
            }
            else {
                console.log("Welcome Student!");
                router.replace("/");
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
                        <Animated.View style={[styles.logoCircle, { transform: [{ scale: logoScale }] }]}>
                            <Image 
                                source={require('../../assets/images/icon/EduQuest_icon.png')} 
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </Animated.View>
                        <Text style={styles.title}>EduQuest</Text>
                        <Text style={styles.subtitle}>Welcome Back</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <View style={styles.iconContainer}>
                                <User size={20} color="#64748B" />
                            </View>
                            <TextInput
                                placeholder="Username"
                                value={username}
                                onChangeText={setUsername}
                                style={styles.input}
                                placeholderTextColor="#94A3B8"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <View style={styles.iconContainer}>
                                <Lock size={20} color="#64748B" />
                            </View>
                            <TextInput
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                style={styles.input}
                                secureTextEntry
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity
                            style={[styles.loginButton, (!username || !password) && styles.disabledBtn]}
                            onPress={handleLogin}
                            disabled={!username || !password || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" size="large" />
                            ) : (
                                <Text style={styles.loginText}>Sign In</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => router.push("/Profile/Register")}>
                        <Text style={styles.registerText}>
                            New to EduQuest? <Text style={styles.registerLink}>Create Account</Text>
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
        backgroundColor: '#F8F9FA',
    },
    inner: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: "center"
    },
    header: {
        alignItems: "center",
        marginBottom: 40
    },
    logoCircle: {
        width: 40,
        height: 400,
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    logoImage: {
        width: 400,
        height: 400,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: '#4CAF50',
        marginBottom: 8,
        letterSpacing: -0.5
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: "500"
    },
    form: {
        backgroundColor: "white",
        padding: 28,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
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
    loginButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 12,
        alignItems: "center",
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    disabledBtn: {
        backgroundColor: '#94A3B8',
        opacity: 0.6
    },
    loginText: {
        color: "white",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.5
    },
    errorText: {
        color: '#EF4444',
        textAlign: "center",
        marginBottom: 12,
        fontWeight: "600",
        fontSize: 14,
        backgroundColor: '#FEF2F2',
        padding: 8,
        borderRadius: 8
    },
    registerText: {
        textAlign: "center",
        marginTop: 24,
        color: '#64748B',
        fontSize: 14,
        fontWeight: "500"
    },
    registerLink: {
        color: '#4CAF50',
        fontWeight: "700"
    }
});
