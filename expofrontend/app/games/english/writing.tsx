// english/writing.tsx
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Modal,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { writingAIService, calculateOverallScore, WritingAnalysis } from '../../services/WritingAIService';

// 图片数据库
const imageScenes = [
    {
        id: '1',
        title: 'Mountain Sunrise',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop',
        description: 'A beautiful mountain landscape at sunrise with golden light',
        prompt: 'Describe this beautiful mountain sunrise scene.',
        category: 'Nature',
        wordLimit: 30,
        difficulty: 'Easy',
        keywords: ['mountain', 'sunrise', 'sky', 'light', 'nature']
    },
    {
        id: '2',
        title: 'City Street',
        image: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&auto=format&fit=crop',
        description: 'A busy city street with people walking and tall buildings',
        prompt: 'Describe the busy city street scene.',
        category: 'City',
        wordLimit: 30,
        difficulty: 'Medium',
        keywords: ['city', 'people', 'buildings', 'street', 'busy']
    },
    {
        id: '3',
        title: 'Beach Fun',
        image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop',
        description: 'Children playing happily at the beach with waves',
        prompt: 'Describe the children playing at the beach.',
        category: 'Beach',
        wordLimit: 30,
        difficulty: 'Easy',
        keywords: ['beach', 'children', 'playing', 'waves', 'sand']
    },
    {
        id: '4',
        title: 'Forest Path',
        image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop',
        description: 'A peaceful forest path with sunlight filtering through trees',
        prompt: 'Describe the peaceful forest path.',
        category: 'Forest',
        wordLimit: 30,
        difficulty: 'Medium',
        keywords: ['forest', 'trees', 'path', 'sunlight', 'peaceful']
    },
    {
        id: '5',
        title: 'Winter Wonderland',
        image: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&auto=format&fit=crop',
        description: 'A snowy winter landscape with snow-covered trees',
        prompt: 'Describe this winter wonderland scene.',
        category: 'Winter',
        wordLimit: 30,
        difficulty: 'Hard',
        keywords: ['snow', 'winter', 'trees', 'cold', 'white']
    },
    {
        id: '6',
        title: 'Market Day',
        image: 'https://images.unsplash.com/photo-1578916048243-32c0ae89b6c1?w=800&auto=format&fit=crop',
        description: 'A colorful market with fresh fruits and vegetables',
        prompt: 'Describe the busy market scene.',
        category: 'Market',
        wordLimit: 30,
        difficulty: 'Medium',
        keywords: ['market', 'fruits', 'vegetables', 'colorful', 'busy']
    }
];

type Scene = typeof imageScenes[0];

export default function WritingScreen() {
    const [currentScene, setCurrentScene] = useState<Scene>(imageScenes[0]);
    const [writing, setWriting] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [history, setHistory] = useState<Array<{
        sceneTitle: string;
        writing: string;
        score: number;
        date: string;
    }>>([]);
    const [showSceneSelector, setShowSceneSelector] = useState(false);

    const textInputRef = useRef<TextInput>(null);

    // 处理文字输入
    const handleTextChange = (text: string) => {
        setWriting(text);
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
    };

    // 选择场景
    const selectScene = (scene: Scene) => {
        setCurrentScene(scene);
        setWriting('');
        setWordCount(0);
        setAnalysis(null);
        setShowAnalysis(false);
        setShowSceneSelector(false);
        textInputRef.current?.focus();
    };

    // AI 分析作文
    const handleAnalyze = async () => {
        if (writing.trim().length === 0) {
            Alert.alert('Empty Writing', 'Please write something before analyzing.');
            return;
        }

        if (wordCount < 5) {
            Alert.alert('Too Short', 'Please write at least 5 words for meaningful analysis.');
            return;
        }

        if (wordCount > currentScene.wordLimit) {
            Alert.alert(
                'Exceeded Limit',
                `You wrote ${wordCount} words, but the limit is ${currentScene.wordLimit}. Try to make it shorter.`
            );
            return;
        }

        setIsAnalyzing(true);
        try {
            const result = await writingAIService.analyzeWriting(
                writing,
                currentScene.prompt,
                {
                    imageDescription: currentScene.description,
                    category: currentScene.category,
                    wordLimit: currentScene.wordLimit
                }
            );

            setAnalysis(result);
            const overallScore = calculateOverallScore(result);
            setShowAnalysis(true);

            // 保存到历史记录
            const newHistory = {
                sceneTitle: currentScene.title,
                writing: writing,
                score: overallScore,
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setHistory(prev => [newHistory, ...prev.slice(0, 4)]);

        } catch (error) {
            Alert.alert('Analysis Failed', 'Unable to analyze your writing. Please try again.');
            console.error('Analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 清除作文
    const handleClear = () => {
        setWriting('');
        setWordCount(0);
        setShowAnalysis(false);
        textInputRef.current?.focus();
    };

    // 取得分数颜色
    const getScoreColor = (score: number) => {
        if (score >= 90) return '#4CAF50';
        if (score >= 70) return '#2196F3';
        if (score >= 50) return '#FF9800';
        return '#F44336';
    };

    // 取得分数评语
    const getScoreFeedback = (score: number) => {
        if (score >= 90) return 'Excellent! 🌟';
        if (score >= 70) return 'Good job! 👍';
        if (score >= 50) return 'Not bad! 😊';
        return 'Keep practicing! 💪';
    };

    // 渲染单词计数
    const renderWordCount = () => {
        const isWithinLimit = wordCount <= currentScene.wordLimit;
        const percentage = Math.min((wordCount / currentScene.wordLimit) * 100, 100);

        return (
            <View style={styles.wordCountContainer}>
                <View style={styles.wordCountHeader}>
                    <Text style={styles.wordCountLabel}>Word Count</Text>
                    <Text style={[
                        styles.wordCountText,
                        { color: isWithinLimit ? '#4CAF50' : '#F44336' }
                    ]}>
                        {wordCount}/{currentScene.wordLimit}
                    </Text>
                </View>

                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${percentage}%`,
                                backgroundColor: isWithinLimit ? '#4CAF50' : '#F44336'
                            }
                        ]}
                    />
                </View>

                {!isWithinLimit && (
                    <Text style={styles.limitWarning}>Exceeded word limit</Text>
                )}
            </View>
        );
    };

    // 渲染分析结果
    const renderAnalysis = () => {
        if (!analysis || !showAnalysis) return null;

        return (
            <View style={styles.analysisContainer}>
                <View style={styles.scoreCard}>
                    <Text style={styles.scoreTitle}>Your Score</Text>
                    <View style={[
                        styles.scoreCircle,
                        { borderColor: getScoreColor(analysis.score) }
                    ]}>
                        <Text style={[
                            styles.scoreNumber,
                            { color: getScoreColor(analysis.score) }
                        ]}>
                            {analysis.score}
                        </Text>
                    </View>
                    <Text style={[
                        styles.scoreFeedback,
                        { color: getScoreColor(analysis.score) }
                    ]}>
                        {getScoreFeedback(analysis.score)}
                    </Text>
                </View>

                <View style={styles.feedbackSection}>
                    <Text style={styles.sectionTitle}>Feedback</Text>
                    <View style={styles.feedbackBox}>
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#4CAF50" />
                        <Text style={styles.feedbackText}>{analysis.feedback}</Text>
                    </View>
                </View>

                {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <View style={styles.suggestionsSection}>
                        <Text style={styles.sectionTitle}>Suggestions for Improvement</Text>
                        {analysis.suggestions.map((suggestion, index) => (
                            <View key={index} style={styles.suggestionItem}>
                                <Ionicons name="bulb-outline" size={18} color="#FFC107" />
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {analysis.correctedSentence && analysis.correctedSentence !== writing && (
                    <View style={styles.correctionSection}>
                        <Text style={styles.sectionTitle}>Improved Version</Text>
                        <View style={styles.correctionBox}>
                            <Ionicons name="create-outline" size={20} color="#2196F3" />
                            <Text style={styles.correctedText}>{analysis.correctedSentence}</Text>
                        </View>
                    </View>
                )}

                {analysis.grammarErrors && analysis.grammarErrors.length > 0 && (
                    <View style={styles.grammarSection}>
                        <Text style={styles.sectionTitle}>Grammar Corrections</Text>
                        {analysis.grammarErrors.map((error, index) => (
                            <View key={index} style={styles.grammarItem}>
                                <Ionicons name="alert-circle-outline" size={18} color="#F44336" />
                                <View style={styles.grammarDetails}>
                                    <Text style={styles.errorType}>{error.type}</Text>
                                    <Text style={styles.errorText}>
                                        <Text style={styles.originalText}>"{error.original}"</Text>
                                        <Text> → </Text>
                                        <Text style={styles.correctedText}>"{error.corrected}"</Text>
                                    </Text>
                                    <Text style={styles.errorExplanation}>{error.explanation}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    // 场景选择器 Modal
    const renderSceneSelector = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showSceneSelector}
            onRequestClose={() => setShowSceneSelector(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Choose a Scene</Text>
                        <TouchableOpacity onPress={() => setShowSceneSelector(false)}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.sceneGrid}>
                        {imageScenes.map((scene) => (
                            <TouchableOpacity
                                key={scene.id}
                                style={[
                                    styles.sceneCard,
                                    currentScene.id === scene.id && styles.sceneCardActive
                                ]}
                                onPress={() => selectScene(scene)}
                            >
                                <Image
                                    source={{ uri: scene.image }}
                                    style={styles.sceneImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.sceneInfo}>
                                    <Text style={styles.sceneTitle}>{scene.title}</Text>
                                    <Text style={styles.sceneCategory}>{scene.category}</Text>
                                    <View style={styles.sceneMeta}>
                                        <Text style={styles.sceneDifficulty}>{scene.difficulty}</Text>
                                        <Text style={styles.sceneWords}>{scene.wordLimit} words</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Writing Game',
                    headerStyle: { backgroundColor: '#4b6cb7' },
                    headerTintColor: '#fff',
                }}
            />

            <StatusBar barStyle="light-content" backgroundColor="#4b6cb7" />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={100}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 标题区 */}
                    <LinearGradient
                        colors={['#4b6cb7', '#182848']}
                        style={styles.header}
                    >
                        <Text style={styles.headerTitle}>📝 Writing Game</Text>
                        <Text style={styles.headerSubtitle}>Describe the scene and get AI feedback</Text>
                    </LinearGradient>

                    {/* 当前场景 */}
                    <View style={styles.currentScene}>
                        <Image
                            source={{ uri: currentScene.image }}
                            style={styles.mainImage}
                            resizeMode="cover"
                        />
                        <View style={styles.imageOverlay}>
                            <Text style={styles.sceneTitle}>{currentScene.title}</Text>
                            <Text style={styles.sceneDescription}>{currentScene.description}</Text>
                            <TouchableOpacity
                                style={styles.changeSceneButton}
                                onPress={() => setShowSceneSelector(true)}
                            >
                                <Ionicons name="swap-horizontal" size={16} color="white" />
                                <Text style={styles.changeSceneText}>Change Scene</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 写作提示 */}
                    <View style={styles.promptContainer}>
                        <View style={styles.promptHeader}>
                            <Ionicons name="megaphone-outline" size={20} color="#4b6cb7" />
                            <Text style={styles.promptLabel}>Writing Prompt</Text>
                        </View>
                        <Text style={styles.promptText}>{currentScene.prompt}</Text>
                        <View style={styles.keywordsContainer}>
                            {currentScene.keywords.map((keyword, index) => (
                                <View key={index} style={styles.keywordTag}>
                                    <Text style={styles.keywordText}>{keyword}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 写作区 */}
                    <View style={styles.writingContainer}>
                        <View style={styles.writingHeader}>
                            <Text style={styles.writingTitle}>Your Writing</Text>
                            {renderWordCount()}
                        </View>

                        <TextInput
                            ref={textInputRef}
                            style={styles.textInput}
                            multiline
                            numberOfLines={6}
                            placeholder="Start writing your description here..."
                            placeholderTextColor="#999"
                            value={writing}
                            onChangeText={handleTextChange}
                            textAlignVertical="top"
                            autoFocus={true}
                        />
                    </View>

                    {/* 分析结果 */}
                    {renderAnalysis()}

                    {/* 操作按钮 */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.analyzeButton,
                                (writing.trim().length === 0 || isAnalyzing) && styles.analyzeButtonDisabled
                            ]}
                            onPress={handleAnalyze}
                            disabled={writing.trim().length === 0 || isAnalyzing}
                        >
                            {isAnalyzing ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="sparkles" size={22} color="white" />
                                    <Text style={styles.analyzeButtonText}>AI Analysis</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={handleClear}
                        >
                            <Ionicons name="trash-outline" size={22} color="#666" />
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 历史记录 */}
                    {history.length > 0 && (
                        <View style={styles.historyContainer}>
                            <View style={styles.historyHeader}>
                                <Ionicons name="time-outline" size={20} color="#666" />
                                <Text style={styles.historyTitle}>Recent Attempts</Text>
                            </View>
                            {history.map((item, index) => (
                                <View key={index} style={styles.historyItem}>
                                    <View style={styles.historyItemHeader}>
                                        <Text style={styles.historyScene} numberOfLines={1}>
                                            {item.sceneTitle}
                                        </Text>
                                        <Text style={[
                                            styles.historyScore,
                                            { color: getScoreColor(item.score) }
                                        ]}>
                                            {item.score}
                                        </Text>
                                    </View>
                                    <Text style={styles.historyWriting} numberOfLines={2}>
                                        "{item.writing}"
                                    </Text>
                                    <View style={styles.historyFooter}>
                                        <Text style={styles.historyDate}>{item.date}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* 提示信息 */}
                    <View style={styles.tipsContainer}>
                        <Ionicons name="information-circle-outline" size={18} color="#4b6cb7" />
                        <Text style={styles.tipsText}>
                            Tip: Write in complete sentences and use descriptive words!
                        </Text>
                    </View>
                </ScrollView>

                {/* 场景选择器 Modal */}
                {renderSceneSelector()}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        paddingTop: 40,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
    },
    currentScene: {
        position: 'relative',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    mainImage: {
        width: '100%',
        height: 200,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 16,
    },
    sceneTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    sceneDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
    },
    changeSceneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    changeSceneText: {
        fontSize: 12,
        color: 'white',
        marginLeft: 4,
        fontWeight: '500',
    },
    promptContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    promptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    promptLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    promptText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 16,
    },
    keywordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    keywordTag: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    keywordText: {
        fontSize: 12,
        color: '#0369a1',
        fontWeight: '500',
    },
    writingContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    writingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    writingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    wordCountContainer: {
        flex: 1,
        marginLeft: 16,
    },
    wordCountHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    wordCountLabel: {
        fontSize: 12,
        color: '#999',
    },
    wordCountText: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    limitWarning: {
        fontSize: 11,
        color: '#F44336',
        marginTop: 4,
        textAlign: 'right',
    },
    textInput: {
        fontSize: 16,
        color: '#333',
        minHeight: 120,
        textAlignVertical: 'top',
        lineHeight: 24,
    },
    analysisContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    scoreCard: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    scoreTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
    },
    scoreCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    scoreNumber: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    scoreFeedback: {
        fontSize: 18,
        fontWeight: '600',
    },
    feedbackSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    feedbackBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f0f9ff',
        padding: 16,
        borderRadius: 12,
    },
    feedbackText: {
        flex: 1,
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
        marginLeft: 12,
    },
    suggestionsSection: {
        marginBottom: 20,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: '#fffbeb',
        padding: 12,
        borderRadius: 8,
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: '#92400e',
        lineHeight: 20,
        marginLeft: 8,
    },
    correctionSection: {
        marginBottom: 20,
    },
    correctionBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#eff6ff',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4b6cb7',
    },
    correctedText: {
        flex: 1,
        fontSize: 15,
        color: '#1d4ed8',
        lineHeight: 22,
        marginLeft: 12,
        fontWeight: '500',
    },
    grammarSection: {
        marginBottom: 10,
    },
    grammarItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
    },
    grammarDetails: {
        flex: 1,
        marginLeft: 8,
    },
    errorType: {
        fontSize: 12,
        color: '#dc2626',
        fontWeight: '600',
        marginBottom: 4,
    },
    errorText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    originalText: {
        color: '#dc2626',
        textDecorationLine: 'line-through',
    },
    errorExplanation: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginHorizontal: 20,
        marginBottom: 30,
    },
    analyzeButton: {
        flex: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4b6cb7',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        elevation: 2,
        shadowColor: '#4b6cb7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    analyzeButtonDisabled: {
        backgroundColor: '#93c5fd',
        opacity: 0.7,
    },
    analyzeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    clearButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        gap: 8,
    },
    clearButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    historyContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    historyItem: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    historyItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyScene: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
    },
    historyScore: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    historyWriting: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    historyFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    historyDate: {
        fontSize: 12,
        color: '#999',
    },
    tipsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#f0f9ff',
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    tipsText: {
        flex: 1,
        fontSize: 14,
        color: '#0369a1',
        lineHeight: 20,
        marginLeft: 8,
    },
    // Modal 样式
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    sceneGrid: {
        padding: 20,
    },
    sceneCard: {
        marginBottom: 16,
        borderRadius: 12,
        backgroundColor: 'white',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sceneCardActive: {
        borderColor: '#4b6cb7',
    },
    sceneImage: {
        width: '100%',
        height: 120,
    },
    sceneInfo: {
        padding: 12,
    },
    sceneTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    sceneCategory: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    sceneMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    sceneDifficulty: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '500',
        backgroundColor: '#d1fae5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sceneWords: {
        fontSize: 12,
        color: '#999',
    },
});