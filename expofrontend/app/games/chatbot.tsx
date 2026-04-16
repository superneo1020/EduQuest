import React, { useState, useEffect, useCallback } from 'react';
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
    isRag?: boolean;
    sources?: string[];
    documentIds?: number[];
}

interface Document {
    id: number;
    name: string;
    sourceUri: string;
    fileType: string;
    totalPages: number;
    chunks: number;
    createdAt: string;
}

export default function Chatbot() {
    // Chat states
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

    // Recording states
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    // RAG states
    const [ragMode, setRagMode] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<number | null>(null); // For filtering queries
    const [uploading, setUploading] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);
    const [ragStatus, setRagStatus] = useState<any>(null);
    const [refreshingDocs, setRefreshingDocs] = useState(false);

    // Check RAG status and load documents on mount
    useEffect(() => {
        checkRagStatus();
        fetchDocuments();
    }, []);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            Speech.stop();
            if (recording) {
                recording.stopAndUnloadAsync().catch(() => {});
            }
        };
    }, [recording]);

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

    const fetchDocuments = useCallback(async () => {
        try {
            setRefreshingDocs(true);
            const { data } = await axios.get(`${BACKEND}/rag/documents`);
            // Map backend response to frontend format
            const mappedDocs = data.documents.map((doc: any) => ({
                id: doc.id,
                name: doc.display_name || doc.source_uri,
                sourceUri: doc.source_uri,
                fileType: doc.file_type,
                totalPages: doc.total_pages,
                chunks: doc.total_chunks,
                createdAt: doc.created_at
            }));
            setDocuments(mappedDocs);
        } catch (err) {
            console.log('Failed to fetch documents', err);
        } finally {
            setRefreshingDocs(false);
        }
    }, []);

    const deleteDocument = async (sourceUri: string) => {
        Alert.alert(
            'Delete Document',
            'Are you sure you want to remove this document and all its chunks?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await axios.post(`${BACKEND}/rag/delete`, { source_uri: sourceUri });

                            // Remove from local state
                            setDocuments(prev => prev.filter(d => d.sourceUri !== sourceUri));

                            // If we deleted the selected doc, clear selection
                            const deletedDoc = documents.find(d => d.sourceUri === sourceUri);
                            if (deletedDoc && selectedDocId === deletedDoc.id) {
                                setSelectedDocId(null);
                            }

                            Alert.alert('Deleted', 'Document removed successfully');
                        } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.detail || 'Failed to delete document');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const pickAndUploadDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'text/plain', 'application/json', 'text/markdown'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.[0]) return;

            const file = result.assets[0];
            setUploading(true);

            // React Native FormData handling
            const formData = new FormData();

            // Handle file attachment differently for web vs native
            if (Platform.OS === 'web') {
                // Web: fetch blob
                const response = await fetch(file.uri);
                const blob = await response.blob();
                formData.append('file', blob, file.name);
            } else {
                // Native: use uri directly
                // @ts-ignore - React Native FormData supports uri
                formData.append('file', {
                    uri: file.uri,
                    type: file.mimeType || 'application/octet-stream',
                    name: file.name,
                });
            }

            formData.append('display_name', file.name);

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

            // Add to documents list
            const newDoc: Document = {
                id: data.document_id,
                name: data.document_name,
                sourceUri: data.source_uri,
                fileType: data.file_type,
                totalPages: data.total_pages,
                chunks: data.chunks_uploaded,
                createdAt: new Date().toISOString()
            };

            setDocuments(prev => [newDoc, ...prev]);
            Alert.alert('Upload Successful', `${data.document_name} (${data.chunks_uploaded} chunks, ${data.total_pages} pages)`);

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
            const payload: any = {
                question: text,
                top_k: 5
            };

            // If specific document selected, filter by it
            if (selectedDocId) {
                payload.document_id = selectedDocId;
            }

            const { data } = await axios.post(`${BACKEND}/rag/query`, payload);

            const botMessage: Message = {
                role: 'bot',
                content: data.answer,
                isRag: true,
                sources: data.sources,
                documentIds: data.document_ids
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (err: any) {
            console.error('RAG query failed', err);
            Alert.alert('Query Failed', err.response?.data?.detail || 'Could not query knowledge base');

            // Fallback to regular chat
            await sendRegularMessage(text);
        } finally {
            setLoading(false);
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
            // Stop any existing recording first
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
                    outputFormat: 2, // AndroidOutputFormat.MPEG_4
                    audioEncoder: 3, // AndroidAudioEncoder.AAC
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.wav',
                    outputFormat: 1, // IOSOutputFormat.LINEARPCM
                    audioQuality: 2, // IOSAudioQuality.HIGH
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
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Could not start recording');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        const currentRecording = recording;
        setRecording(null);

        try {
            await currentRecording.stopAndUnloadAsync();
            const uri = currentRecording.getURI();

            if (!uri) {
                Alert.alert('Error', 'Failed to get recording URI');
                return;
            }

            setLoading(true);

            // Create FormData for audio upload
            const audioFormData = new FormData();

            if (Platform.OS === 'web') {
                const blob = await uriToBlob(uri);
                audioFormData.append('file', blob, 'speech.wav');
            } else {
                // @ts-ignore
                audioFormData.append('file', {
                    uri: uri,
                    type: 'audio/wav',
                    name: 'speech.wav',
                });
            }

            const { data } = await axios.post(`${BACKEND}/stt`, audioFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const recognizedText = data.text;
            if (recognizedText && recognizedText.trim()) {
                setPrompt(recognizedText);
                await sendMessage(recognizedText);
            } else {
                Alert.alert('No speech detected', 'Please try speaking again');
                setLoading(false);
            }
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
                    onError: () => setSpeakingIndex(null),
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
                msg.isRag && styles.ragMessage
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

    const renderDocumentItem = ({ item }: { item: Document }) => (
        <TouchableOpacity
            style={[
                styles.docItem,
                selectedDocId === item.id && styles.docItemSelected
            ]}
            onPress={() => setSelectedDocId(selectedDocId === item.id ? null : item.id)}
        >
            <View style={styles.docInfo}>
                <Text style={styles.docName}>{item.name}</Text>
                <Text style={styles.docMeta}>
                    {item.fileType.toUpperCase()} • {item.totalPages} pages • {item.chunks} chunks
                </Text>
            </View>

            <View style={styles.docActions}>
                {selectedDocId === item.id && (
                    <View style={styles.selectedBadge}>
                        <Text style={styles.selectedText}>Selected</Text>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteDocument(item.sourceUri)}
                >
                    <Text style={styles.deleteButtonText}>🗑</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
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
                        {documents.length} docs • Ollama: {ragStatus.ollama_model} • Gemini: {ragStatus.gemini_model}
                    </Text>
                    <TouchableOpacity onPress={() => {
                        setShowDocModal(true);
                        fetchDocuments();
                    }}>
                        <Text style={styles.viewDocsLink}>Manage Docs</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Selected Document Indicator */}
            {ragMode && selectedDocId && (
                <View style={styles.selectedDocBar}>
                    <Text style={styles.selectedDocText}>
                        Querying: {documents.find(d => d.id === selectedDocId)?.name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedDocId(null)}>
                        <Text style={styles.clearSelection}>✕</Text>
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
                            {ragMode ? (selectedDocId ? 'Searching selected doc...' : 'Searching knowledge base...') : 'Thinking...'}
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
                        placeholder={
                            ragMode
                                ? (selectedDocId ? "Ask about selected document..." : "Ask about your documents...")
                                : "Ask anything..."
                        }
                        value={prompt}
                        onChangeText={setPrompt}
                        editable={!loading}
                        multiline
                    />
                    <TouchableOpacity
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        disabled={loading || isRecording}
                        style={[
                            styles.mic,
                            { backgroundColor: isRecording ? '#ff4d4d' : '#4dabf7' }
                        ]}
                    >
                        <Text style={styles.micText}>{isRecording ? '🔴' : '🎤'}</Text>
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
                        <Text style={styles.modalTitle}>📚 Document Library</Text>

                        <Text style={styles.modalSubtitle}>
                            Tap to select for specific queries • Swipe items for options
                        </Text>

                        {documents.length === 0 ? (
                            <View style={styles.emptyDocsContainer}>
                                <Text style={styles.emptyDocs}>No documents uploaded yet</Text>
                                <TouchableOpacity
                                    style={styles.uploadPromptButton}
                                    onPress={() => {
                                        setShowDocModal(false);
                                        pickAndUploadDocument();
                                    }}
                                >
                                    <Text style={styles.uploadPromptText}>Upload First Document</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={documents}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderDocumentItem}
                                refreshing={refreshingDocs}
                                onRefresh={fetchDocuments}
                                style={styles.docList}
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
        fontSize: 11,
        color: '#1864ab',
    },
    viewDocsLink: {
        fontSize: 12,
        color: '#1971c2',
        fontWeight: '600',
    },
    selectedDocBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: '#d3f9d8',
        borderBottomWidth: 1,
        borderBottomColor: '#8ce99a',
    },
    selectedDocText: {
        fontSize: 12,
        color: '#2b8a3e',
        fontWeight: '500',
        flex: 1,
    },
    clearSelection: {
        fontSize: 14,
        color: '#c92a2a',
        fontWeight: 'bold',
        paddingHorizontal: 8,
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
        width: '90%',
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    docList: {
        maxHeight: 300,
    },
    emptyDocsContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    emptyDocs: {
        textAlign: 'center',
        color: '#999',
        marginBottom: 16,
    },
    uploadPromptButton: {
        backgroundColor: '#7950f2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    uploadPromptText: {
        color: '#fff',
        fontWeight: '600',
    },
    docItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        borderRadius: 8,
    },
    docItemSelected: {
        backgroundColor: '#e7f5ff',
        borderColor: '#4dabf7',
        borderWidth: 1,
    },
    docInfo: {
        flex: 1,
    },
    docName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    docMeta: {
        fontSize: 11,
        color: '#666',
    },
    docActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectedBadge: {
        backgroundColor: '#40c057',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    selectedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: 6,
        backgroundColor: '#ffebee',
        borderRadius: 6,
    },
    deleteButtonText: {
        fontSize: 14,
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