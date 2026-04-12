import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, TextInput, Button, Text, ScrollView, StyleSheet, View, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import axios from 'axios';

const BACKEND = 'http://127.0.0.1:8000';   // <-- your laptop IP

export default function chatbot() {
    const [prompt, setPrompt] = useState('');
    const [answer, setAnswer]   = useState('');
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
    const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
    /*  ---------- helpers  ----------  */
    const uriToBlob = async (uri: string) => {
        const resp = await fetch(uri);
        return resp.blob();
    };

    /*  ---------- TALK -> TEXT  ----------  */
    const startRecording = async () => {
        try {
            // 清理之前的录音对象
            if (recording) {
                try {
                    await recording.stopAndUnloadAsync();
                } catch (e) {
                    // 忽略停止失败
                }
                setRecording(null);
            }

            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') { alert('Microphone permission required'); return; }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });

            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync({
                android: {
                    extension: '.wav',
                    outputFormat: 2,
                    audioEncoder: 3,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.wav',
                    outputFormat: 1,
                    audioQuality: 2,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
                web: {
                    mimeType: 'audio/webm',
                    bitsPerSecond: 128000,
                },
            });
            await newRecording.startAsync();
            setRecording(newRecording);
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        setRecording(null);
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();               // local .wav file

            // URI → Blob → File for axios
            if (!uri) {
                alert('Failed to get recording URI');
                return;
            }

            setLoading(true);
            const blob = await uriToBlob(uri);
            const file = new File([blob], 'speech.wav', { type: 'audio/wav' });
            const body = new FormData();
            body.append('file', file);

            const { data } = await axios.post(`${BACKEND}/stt`, body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const recognizedText = data.text;
            setPrompt(recognizedText);

            // Auto-send after STT
            await sendMessage(recognizedText);
        } catch (err) {
            console.error('STT failed', err);
            alert('Speech recognition failed');
            setLoading(false);
        }
    };

    const send = async (text: string, setAnswer: React.Dispatch<React.SetStateAction<string>>) => {
        if (!text.trim()) return;
        try {
            const { data } = await axios.post(`${BACKEND}/chat`, { prompt: text });
            setAnswer(data.response);
        } catch (err) {
            console.error('Chat failed', err);
            alert('Failed to get response');
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        // Add user message to history
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setPrompt('');
        setLoading(true);

        try {
            const { data } = await axios.post(`${BACKEND}/chat`, { prompt: text });
            const botResponse = data.response;

            // Add bot response to history
            setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
            setAnswer(botResponse);
        } catch (err) {
            console.error('Chat failed', err);
            alert('Failed to get response');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        sendMessage(prompt);
    };

    const handleSpeak = async (text: string, messageIndex: number) => {
        try {
            if (speakingIndex === messageIndex) {
                // Stop speaking if already speaking this message
                await Speech.stop();
                setSpeakingIndex(null);
            } else {
                // Stop any other speaking messages
                if (speakingIndex !== null) {
                    await Speech.stop();
                }
                // Start speaking this message
                setSpeakingIndex(messageIndex);
                await Speech.speak(text, {
                    language: 'en-US',
                    rate: 0.9,
                    onDone: () => setSpeakingIndex(null),
                });
            }
        } catch (err) {
            console.error('Speech failed', err);
            alert('Failed to speak text');
            setSpeakingIndex(null);
        }
    };

    /* ---------- UI ---------- */
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>🤖 Eduquest Chatbot</Text>

            {/* Messages Display */}
            <ScrollView style={styles.messagesBox} contentContainerStyle={styles.messagesContent}>
                {messages.length === 0 ? (
                    <Text style={styles.emptyText}>Start a conversation...</Text>
                ) : (
                    messages.map((msg, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.messageBubble,
                                msg.role === 'user' ? styles.userMessage : styles.botMessage,
                            ]}
                        >
                            <Text style={styles.messageText}>{msg.content}</Text>
                            {msg.role === 'bot' && (
                                <TouchableOpacity
                                    onPress={() => handleSpeak(msg.content, idx)}
                                    style={[styles.speakButton, speakingIndex === idx && styles.speakButtonActive]}
                                >
                                    <Text style={styles.speakButtonText}>{speakingIndex === idx ? '⏹ Stop' : '🔊 Speak'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4dabf7" />
                        <Text style={styles.loadingText}>Thinking...</Text>
                    </View>
                )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask anything…"
                        value={prompt}
                        onChangeText={setPrompt}
                        editable={!loading}
                    />
                    <TouchableOpacity
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        disabled={loading}
                        style={[styles.mic, { backgroundColor: recording ? '#ff4d4d' : '#4dabf7', opacity: loading ? 0.5 : 1 }]}
                    >
                        <Text style={{ color: '#fff', fontSize: 20 }}>{recording ? '🔴' : '🎤'}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.sendButton, { opacity: loading || !prompt.trim() ? 0.5 : 1 }]}
                    onPress={handleSend}
                    disabled={loading || !prompt.trim()}
                >
                    <Text style={styles.sendButtonText}>Send ✓</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingTop: 12,
        color: '#1a1a1a',
    },
    messagesBox: {
        flex: 1,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    messagesContent: {
        paddingVertical: 8,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 24,
        fontSize: 16,
    },
    messageBubble: {
        marginVertical: 6,
        marginHorizontal: 8,
        padding: 12,
        borderRadius: 12,
        maxWidth: '85%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#4dabf7',
    },
    botMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#e9ecef',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        color: '#1a1a1a',
    },
    loadingContainer: {
        alignItems: 'center',
        marginVertical: 16,
    },
    loadingText: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
    },
    inputContainer: {
        paddingHorizontal: 12,
        paddingBottom: 16,
        gap: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
        fontSize: 15,
    },
    mic: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButton: {
        backgroundColor: '#4dabf7',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    speakButton: {
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    speakButtonActive: {
        backgroundColor: 'rgba(255, 100, 100, 0.5)',
    },
    speakButtonText: {
        color: '#1a1a1a',
        fontSize: 13,
        fontWeight: '500',
    },
});
