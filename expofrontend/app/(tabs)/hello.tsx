import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Button, StyleSheet } from 'react-native';

// Replace with the appropriate URL for your environment:
const BASE_URL = 'http://localhost:8080'; // <-- may change this

export default function HelloScreen() {
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchHello = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BASE_URL}/api/hello`);
            if (!res.ok) {
                // read body if available to include in message
                const bodyText = await res.text().catch(() => '');
                setError(`Request failed: ${res.status} ${res.statusText} ${bodyText ? '- ' + bodyText : ''}`);
                return; // exit without throwing
            }
            const text = await res.text();
            setMessage(text);
        } catch (e: any) {
            setError(e.message ?? String(e));
            setMessage(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHello();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Hello from Spring Boot</Text>

            {loading && <ActivityIndicator size="large" color="#007aff" />}

            {message && <Text style={styles.message}>{message}</Text>}

            {error && <Text style={styles.error}>Error: {error}</Text>}

            <Button title="Reload" onPress={fetchHello} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    title: { fontSize: 20, marginBottom: 12 },
    message: { fontSize: 16, color: 'green', marginVertical: 10 },
    error: { fontSize: 14, color: 'red', marginVertical: 10 },
});