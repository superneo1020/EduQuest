import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView, TextInput, Text, ScrollView, StyleSheet, View,
    TouchableOpacity, ActivityIndicator, Modal, FlatList, Alert, Platform,
    Image, Dimensions
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

interface GeneratedImage {
    url: string;
    prompt: string;
    timestamp: number;
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
    const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);
    const [ragStatus, setRagStatus] = useState<any>(null);
    const [refreshingDocs, setRefreshingDocs] = useState(false);
    const [deletingDoc, setDeletingDoc] = useState<string | null>(null); // Track which doc is being deleted

    // Delete confirmation modal state
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
        visible: boolean;
        doc: Document | null;
    }>({ visible: false, doc: null });

    // Image generation states
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

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

    const handleDeleteDocument = useCallback((doc: Document) => {
        console.log('[FRONTEND] Delete button clicked for:', doc.name);
        console.log('[FRONTEND] Document sourceUri:', doc.sourceUri);

        // Prevent multiple simultaneous deletes
        if (deletingDoc) {
            console.log('[FRONTEND] Delete already in progress, skipping');
            return;
        }

        // Show custom delete confirmation modal
        setDeleteConfirmModal({ visible: true, doc });
    }, [deletingDoc]);

    const confirmDelete = async () => {
        const doc = deleteConfirmModal.doc;
        if (!doc) return;

        console.log('[FRONTEND] User confirmed delete');
        setDeleteConfirmModal({ visible: false, doc: null });

        try {
            setDeletingDoc(doc.sourceUri);
            console.log('[FRONTEND] Sending delete request to backend...');
            console.log('[FRONTEND] Request payload:', { source_uri: doc.sourceUri });

            const response = await axios.post(`${BACKEND}/rag/delete`, {
                source_uri: doc.sourceUri
            });

            console.log('[FRONTEND] Delete response received:', response.data);

            // Remove from local state immediately for responsive UI
            setDocuments(prev => prev.filter(d => d.sourceUri !== doc.sourceUri));

            // If we deleted the selected doc, clear selection
            if (selectedDocId === doc.id) {
                setSelectedDocId(null);
            }

            // Show success alert (using Alert for success is usually fine)
            if (Platform.OS !== 'web') {
                Alert.alert('Success', `"${doc.name}" has been deleted successfully`);
            }

            // Refresh the list to ensure sync with backend
            await fetchDocuments();

        } catch (err: any) {
            console.error('[FRONTEND] Delete error:', err);
            console.error('[FRONTEND] Error response:', err.response?.data);
            console.error('[FRONTEND] Error status:', err.response?.status);
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete document';

            if (Platform.OS !== 'web') {
                Alert.alert('Delete Failed', errorMsg);
            }
        } finally {
            setDeletingDoc(null);
        }
    };

    const cancelDelete = () => {
        console.log('[FRONTEND] User cancelled delete');
        setDeleteConfirmModal({ visible: false, doc: null });
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

            const formData = new FormData();

            if (Platform.OS === 'web') {
                const response = await fetch(file.uri);
                const blob = await response.blob();
                formData.append('file', blob, file.name);
            } else {
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

        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setPrompt('');
        setLoading(true);

        try {
            const payload: any = {
                question: text,
                top_k: 5
            };

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

    /*  ---------- Image Generation  ----------  */

    const generateExplanationImage = async (contextText: string) => {
        if (generatingImage) return;

        setGeneratingImage(true);
        try {
            const { data } = await axios.post(`${BACKEND}/generate-image`, {
                prompt: contextText,
                style: "animated",
                width: 1024,
                height: 1024
            });

            const newImage: GeneratedImage = {
                url: `${BACKEND}${data.image_url}`,
                prompt: data.prompt_used,
                timestamp: Date.now()
            };

            setGeneratedImages(prev => [newImage, ...prev]);

            // Auto-show the new image
            setSelectedImage(newImage);
            setShowImageModal(true);

        } catch (err: any) {
            console.error('Image generation failed', err);
            Alert.alert(
                'Image Generation Failed',
                err.response?.data?.detail || 'Could not generate image'
            );
        } finally {
            setGeneratingImage(false);
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
                } catch (e) {}
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
            {msg.isRag && (
                <View style={styles.ragBadge}>
                    <Text style={styles.ragBadgeText}>📚 RAG</Text>
                </View>
            )}

            <Text style={styles.messageText}>{msg.content}</Text>

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

            {/* Image generation button for bot responses */}
            {msg.role === 'bot' && (
                <TouchableOpacity
                    style={styles.imageGenButton}
                    onPress={() => generateExplanationImage(msg.content)}
                    disabled={generatingImage}
                >
                    {generatingImage ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.imageGenButtonText}>🎨 Visualize</Text>
                    )}
                </TouchableOpacity>
            )}

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

    const renderDocumentItem = ({ item }: { item: Document }) => {
        const isDeleting = deletingDoc === item.sourceUri;
        const isSelected = selectedDocId === item.id;

        return (
            <View style={[
                styles.docItem,
                isSelected && styles.docItemSelected,
                isDeleting && styles.docItemDeleting
            ]}>
                <TouchableOpacity
                    style={styles.docMainContent}
                    onPress={() => {
                        if (!isDeleting) {
                            setSelectedDocId(isSelected ? null : item.id);
                        }
                    }}
                    disabled={isDeleting}
                >
                    <View style={styles.docInfo}>
                        <Text style={styles.docName} numberOfLines={1}>
                            {isDeleting ? 'Deleting...' : item.name}
                        </Text>
                        <Text style={styles.docMeta}>
                            {item.fileType.toUpperCase()} • {item.totalPages} pages • {item.chunks} chunks
                        </Text>
                        {isSelected && (
                            <View style={styles.selectedIndicator}>
                                <Text style={styles.selectedIndicatorText}>✓ Selected for queries</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                <View style={styles.docActions}>
                    {isDeleting ? (
                        <ActivityIndicator size="small" color="#ff6b6b" />
                    ) : (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => {
                                console.log('[FRONTEND] Delete button pressed for:', item.name);
                                handleDeleteDocument(item);
                            }}
                            disabled={!!deletingDoc}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.deleteButtonText}>🗑</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🤖 EduQuest Chatbot</Text>

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
                    <Text style={styles.selectedDocText} numberOfLines={1}>
                        Querying: {documents.find(d => d.id === selectedDocId)?.name || 'Unknown'}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedDocId(null)}>
                        <Text style={styles.clearSelection}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Generated Images Gallery */}
            {generatedImages.length > 0 && (
                <View style={styles.imageGallery}>
                    <Text style={styles.imageGalleryTitle}>🎨 Generated Images</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {generatedImages.map((img, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => {
                                    setSelectedImage(img);
                                    setShowImageModal(true);
                                }}
                            >
                                <Image
                                    source={{ uri: img.url }}
                                    style={styles.thumbnail}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
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
                            Tap document to select for specific queries • Press 🗑 to delete
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
                                ItemSeparatorComponent={() => <View style={styles.docSeparator} />}
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

            {/* Image Viewer Modal */}
            <Modal
                visible={showImageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageModal(false)}
            >
                <View style={styles.imageModalOverlay}>
                    <View style={styles.imageModalContent}>
                        <TouchableOpacity
                            style={styles.closeImageButton}
                            onPress={() => setShowImageModal(false)}
                        >
                            <Text style={styles.closeImageText}>✕</Text>
                        </TouchableOpacity>

                        {selectedImage && (
                            <>
                                <Image
                                    source={{ uri: selectedImage.url }}
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />
                                <View style={styles.imageInfo}>
                                    <Text style={styles.imagePrompt} numberOfLines={3}>
                                        {selectedImage.prompt}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={deleteConfirmModal.visible}
                transparent={true}
                animationType="fade"
                onRequestClose={cancelDelete}
            >
                <View style={styles.confirmModalOverlay}>
                    <View style={styles.confirmModalContent}>
                        <Text style={styles.confirmModalTitle}>🗑️ Delete Document</Text>

                        {deleteConfirmModal.doc && (
                            <>
                                <Text style={styles.confirmModalText}>
                                    Are you sure you want to delete:
                                </Text>
                                <Text style={styles.confirmModalDocName}>
                                    "{deleteConfirmModal.doc.name}"
                                </Text>
                                <Text style={styles.confirmModalWarning}>
                                    This will remove the document and all {deleteConfirmModal.doc.chunks} chunks permanently.
                                </Text>
                            </>
                        )}

                        <View style={styles.confirmModalButtons}>
                            <TouchableOpacity
                                style={[styles.confirmModalButton, styles.cancelButton]}
                                onPress={cancelDelete}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.confirmModalButton, styles.deleteConfirmButton]}
                                onPress={confirmDelete}
                            >
                                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

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
        marginRight: 8,
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
    docSeparator: {
        height: 1,
        backgroundColor: '#eee',
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
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    docItemSelected: {
        backgroundColor: '#e7f5ff',
        borderWidth: 1,
        borderColor: '#4dabf7',
    },
    docItemDeleting: {
        opacity: 0.6,
        backgroundColor: '#ffe3e3',
    },
    docMainContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
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
    selectedIndicator: {
        marginTop: 4,
        backgroundColor: '#40c057',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    selectedIndicatorText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    docActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    deleteButton: {
        padding: 8,
        backgroundColor: '#ffebee',
        borderRadius: 6,
        minWidth: 36,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
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
    // Delete confirmation modal styles
    confirmModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmModalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
    },
    confirmModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1a1a1a',
    },
    confirmModalText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    confirmModalDocName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    confirmModalWarning: {
        fontSize: 13,
        color: '#c92a2a',
        textAlign: 'center',
        marginBottom: 24,
    },
    confirmModalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmModalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#e9ecef',
    },
    cancelButtonText: {
        color: '#495057',
        fontSize: 16,
        fontWeight: '600',
    },
    deleteConfirmButton: {
        backgroundColor: '#c92a2a',
    },
    deleteConfirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Image generation styles
    imageGenButton: {
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: '#9c36b5',
        borderRadius: 8,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageGenButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    imageGallery: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#f3f0ff',
        borderTopWidth: 1,
        borderTopColor: '#d0bfff',
    },
    imageGalleryTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#5f3dc4',
        marginBottom: 8,
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 2,
        borderColor: '#d0bfff',
    },
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    imageModalContent: {
        width: '100%',
        maxHeight: '90%',
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center',
    },
    fullImage: {
        width: Dimensions.get('window').width - 40,
        height: Dimensions.get('window').width - 40,
        maxHeight: 500,
    },
    imageInfo: {
        padding: 16,
        width: '100%',
    },
    imagePrompt: {
        color: '#ccc',
        fontSize: 12,
        fontStyle: 'italic',
    },
    closeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeImageText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});