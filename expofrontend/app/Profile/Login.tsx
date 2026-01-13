import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";
import React, { useState } from "react";
import { router } from "expo-router";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {

        router.replace("/");
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>
                Login to continue your learning adventure
            </Text>

            <View style={styles.form}>
                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    keyboardType="email-address"
                />

                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    secureTextEntry
                />

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/Profile/Register")}>
                    <Text style={styles.registerText}>
                        Don’t have an account? Register
                    </Text>
                </TouchableOpacity>
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
});