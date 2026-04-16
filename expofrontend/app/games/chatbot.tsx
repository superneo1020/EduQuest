import React, { useState, useEffect } from 'react';
import {
    SafeAreaView, TextInput, Button, Text, ScrollView, StyleSheet, View,
    TouchableOpacity, ActivityIndicator, Modal, FlatList, Alert, Platform
} from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

const BACKEND = 'http://127.0.0.1:8000';   // <-- your laptop IP

// Types
interface Message {
    role: 'user' | 'bot';
    content: string;
    isRag?: boolean;  // Track if this was a RAG response
    sources?: string[];  // Track sources for RAG responses
}

interface Document {
    name: string;
    sourceUri: string;
    chunks: number;
}

export default function Chatbot() {
    // Chat states
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

    // Recording states
    const [recording, setRecording] = useState<Audio.Recording | null>(null);

    // RAG states
    const [ragMode, setRagMode] = useState(false);  // Toggle RAG mode
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);
    const [ragStatus, setRagStatus] = useState<any>(null);

    // Check RAG status on mount
    useEffect(() => {
        checkRagStatus();
    }, []);

    /*  ---------- RAG Functions  ----------  */

    const checkRagStatus = async () => {
        try {
            const { data } = await axios.get(`${BACKEND}/rag/status`);
            setRagStatus(data);
            console.log('RAG Status:', data);
        } catch (err) {
            console.log('RAG not available');
            setRagStatus(null);
        }
    };

    const pickAndUploadDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain', 'application/json'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.[0]) return;

            const file = result.assets[0];
            setUploading(true);

            // Read file as blob
            const response = await fetch(file.uri);
            const blob = await response.blob();

            // Create FormData
            const formData = new FormData();
            formData.append('file', blob, file.name);
            formData.append('display_name', file.name);

            // Upload using fetch
            const uploadResponse = await fetch(`${BACKEND}/rag/upload-file`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.detail || `HTTP ${uploadResponse.status}`);
            }

            const data = await uploadResponse.json();

            setDocuments(prev => [...prev, {
                name: data.document_name,
                sourceUri: data.source_uri,
                chunks: data.chunks_uploaded
            }]);

            Alert.alert('Upload Successful', `${data.document_name} (${data.chunks_uploaded} chunks)`);

            if (!ragMode) setRagMode(true);

        } catch (err: any) {
            console.error('Upload error:', err);
            Alert.alert('Upload Failed', err.message);
        } finally {
            setUploading(false);
        }
    };

    const sendRagQuery = async (text: string) => {
        if (!text.trim()) return;

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setPrompt('');
        setLoading(true);

        try {
            const { data } = await axios.post(`${BACKEND}/rag/query`, {
                question: text,
                top_k: 5
            });

            const botMessage: Message = {
                role: 'bot',
                content: data.answer,
                isRag: true,
                sources: data.sources
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (err: any) {
            console.error('RAG query failed', err);
            Alert.alert('Query Failed', err.response?.data?.detail || 'Could not query knowledge base');

            // Fallback to regular chat
            await sendRegularMessage(text);
        } finally {
            setLoading(false)
        }
    };

    /*  ---------- Chat Functions  ----------  */

    const sendRegularMessage = async (text: string) => {
        if (!text.trim()) return;

        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setPrompt('');
        setLoading(true);

        try {
            const { data } = await axios.post(`${BACKEND}/chat`, { prompt: text });

            setMessages(prev => [...prev, {
                role: 'bot',
                content: data.response,
                isRag: false
            }]);
        } catch (err) {
            console.error('Chat failed', err);
            Alert.alert('Failed to get response');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (text: string) => {
        if (ragMode && ragStatus?.rag_available) {
            await sendRagQuery(text);
        } else {
            await sendRegularMessage(text);
        }
    };

    /*  ---------- Speech-to-Text  ----------  */

    const uriToBlob = async (uri: string) => {
        const resp = await fetch(uri);
        return resp.blob();
    };

    const startRecording = async () => {
        try {
            if (recording) {
                try {
                    await recording.stopAndUnloadAsync();
                } catch (e) {
                    // Ignore
                }
                setRecording(null);
            }

            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Microphone permission required');
                return;
            }

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
            const uri = recording.getURI();

            if (!uri) {
                Alert.alert('Error', 'Failed to get recording URI');
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
            await sendMessage(recognizedText);
        } catch (err) {
            console.error('STT failed', err);
            Alert.alert('Speech recognition failed');
            setLoading(false);
        }
    };

    /*  ---------- Text-to-Speech  ----------  */

    const handleSpeak = async (text: string, messageIndex: number) => {
        try {
            if (speakingIndex === messageIndex) {
                await Speech.stop();
                setSpeakingIndex(null);
            } else {
                if (speakingIndex !== null) {
                    await Speech.stop();
                }
                setSpeakingIndex(messageIndex);
                await Speech.speak(text, {
                    language: 'en-US',
                    rate: 0.9,
                    onDone: () => setSpeakingIndex(null),
                });
            }
        } catch (err) {
            console.error('Speech failed', err);
            setSpeakingIndex(null);
        }
    };

    /*  ---------- UI Components  ----------  */

    const renderMessage = (msg: Message, idx: number) => (
        <View
            key={idx}
            style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userMessage : styles.botMessage,
                msg.isRag && styles.ragMessage  // Highlight RAG responses
            ]}
        >
            {/* RAG Badge */}
            {msg.isRag && (
                <View style={styles.ragBadge}>
                    <Text style={styles.ragBadgeText}>📚 RAG</Text>
                </View>
            )}

            <Text style={styles.messageText}>{msg.content}</Text>

            {/* Sources for RAG */}
            {msg.isRag && msg.sources && msg.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                    <Text style={styles.sourcesTitle}>Sources:</Text>
                    {msg.sources.map((source, sIdx) => (
                        <Text key={sIdx} style={styles.sourceText}>
                            • {source.split('/').pop()}
                        </Text>
                    ))}
                </View>
            )}

            {/* Speak Button for Bot Messages */}
            {msg.role === 'bot' && (
                <TouchableOpacity
                    onPress={() => handleSpeak(msg.content, idx)}
                    style={[
                        styles.speakButton,
                        speakingIndex === idx && styles.speakButtonActive
                    ]}
                >
                    <Text style={styles.speakButtonText}>
                        {speakingIndex === idx ? '⏹ Stop' : '🔊 Speak'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🤖 EduQuest Chatbot</Text>

                {/* RAG Toggle */}
                <TouchableOpacity
                    style={[
                        styles.ragToggle,
                        ragMode && styles.ragToggleActive,
                        !ragStatus?.rag_available && styles.ragToggleDisabled
                    ]}
                    onPress={() => ragStatus?.rag_available && setRagMode(!ragMode)}
                    disabled={!ragStatus?.rag_available}
                >
                    <Text style={styles.ragToggleText}>
                        {ragMode ? '📚 ON' : '📄 OFF'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* RAG Status Bar */}
            {ragStatus?.rag_available && (
                <View style={styles.ragStatusBar}>
                    <Text style={styles.ragStatusText}>
                        {documents.length} documents in knowledge base
                    </Text>
                    <TouchableOpacity onPress={() => setShowDocModal(true)}>
                        <Text style={styles.viewDocsLink}>View Docs</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Messages Display */}
            <ScrollView
                style={styles.messagesBox}
                contentContainerStyle={styles.messagesContent}
            >
                {messages.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Start a conversation...</Text>
                        {ragStatus?.rag_available && (
                            <Text style={styles.ragHint}>
                                Toggle ON to query your uploaded documents
                            </Text>
                        )}
                    </View>
                ) : (
                    messages.map((msg, idx) => renderMessage(msg, idx))
                )}

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4dabf7" />
                        <Text style={styles.loadingText}>
                            {ragMode ? 'Searching knowledge base...' : 'Thinking...'}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
                {/* Upload Button (only when RAG available) */}
                {ragStatus?.rag_available && (
                    <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={pickAndUploadDocument}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.uploadButtonText}>📎 Upload Doc</Text>
                        )}
                    </TouchableOpacity>
                )}

                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder={ragMode ? "Ask about your documents..." : "Ask anything..."}
                        value={prompt}
                        onChangeText={setPrompt}
                        editable={!loading}
                        multiline
                    />
                    <TouchableOpacity
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        disabled={loading}
                        style={[
                            styles.mic,
                            { backgroundColor: recording ? '#ff4d4d' : '#4dabf7' }
                        ]}
                    >
                        <Text style={styles.micText}>{recording ? '🔴' : '🎤'}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        { opacity: loading || !prompt.trim() ? 0.5 : 1 }
                    ]}
                    onPress={() => sendMessage(prompt)}
                    disabled={loading || !prompt.trim()}
                >
                    <Text style={styles.sendButtonText}>
                        {ragMode ? 'Ask RAG ✓' : 'Send ✓'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Documents Modal */}
            <Modal
                visible={showDocModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDocModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>📚 Uploaded Documents</Text>

                        {documents.length === 0 ? (
                            <Text style={styles.emptyDocs}>No documents uploaded yet</Text>
                        ) : (
                            <FlatList
                                data={documents}
                                keyExtractor={(item, idx) => idx.toString()}
                                renderItem={({ item }) => (
                                    <View style={styles.docItem}>
                                        <Text style={styles.docName}>{item.name}</Text>
                                        <Text style={styles.docChunks}>{item.chunks} chunks</Text>
                                    </View>
                                )}
                            />
                        )}

                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setShowDocModal(false)}
                        >
                            <Text style={styles.closeModalText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    ragToggle: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#e9ecef',
    },
    ragToggleActive: {
        backgroundColor: '#40c057',
    },
    ragToggleDisabled: {
        backgroundColor: '#dee2e6',
        opacity: 0.5,
    },
    ragToggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#495057',
    },
    ragStatusBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#e7f5ff',
        borderBottomWidth: 1,
        borderBottomColor: '#a5d8ff',
    },
    ragStatusText: {
        fontSize: 12,
        color: '#1864ab',
    },
    viewDocsLink: {
        fontSize: 12,
        color: '#1971c2',
        fontWeight: '600',
    },
    messagesBox: {
        flex: 1,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    messagesContent: {
        paddingVertical: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 16,
    },
    ragHint: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        marginTop: 8,
        fontStyle: 'italic',
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
    ragMessage: {
        borderLeftWidth: 4,
        borderLeftColor: '#40c057',
    },
    ragBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#40c057',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 6,
    },
    ragBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
        color: '#1a1a1a',
    },
    sourcesContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    sourcesTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#495057',
        marginBottom: 4,
    },
    sourceText: {
        fontSize: 11,
        color: '#666',
        fontStyle: 'italic',
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
    uploadButton: {
        backgroundColor: '#7950f2',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
        maxHeight: 100,
    },
    mic: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micText: {
        color: '#fff',
        fontSize: 20,
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '80%',
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    emptyDocs: {
        textAlign: 'center',
        color: '#999',
        marginVertical: 20,
    },
    docItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    docName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    docChunks: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    closeModalButton: {
        marginTop: 16,
        backgroundColor: '#4dabf7',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeModalText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});