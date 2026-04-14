import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createGameMetadata, GameMetadata } from '../../../../types/GameMetadata';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    Animated,
    Platform,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useAuth } from '@/src/auth/AuthContext';

const { width } = Dimensions.get('window');

// 動物資料
const ANIMALS = [
    { id: 1, name: 'shark', type: 'fish', image: require('../../../../assets/images/animals/shark.png') },
    { id: 2, name: 'trout', type: 'fish', image: require('../../../../assets/images/animals/trout.png') },
    { id: 3, name: 'sparrow', type: 'bird', image: require('../../../../assets/images/animals/sparrow.png') },
    { id: 4, name: 'pigeon', type: 'bird', image: require('../../../../assets/images/animals/pigeon.png') },
    { id: 5, name: 'dog', type: 'mammal', image: require('../../../../assets/images/animals/dog.png') },
    { id: 6, name: 'tiger', type: 'mammal', image: require('../../../../assets/images/animals/tiger.png') },
    { id: 7, name: 'turtle', type: 'reptile', image: require('../../../../assets/images/animals/turtle.png') },
    { id: 8, name: 'snake', type: 'reptile', image: require('../../../../assets/images/animals/snake.png') },
];

// 分類區域
const CATEGORIES = [
    { id: 'fish', name: 'fish', color: '#4FC3F7', emoji: '🐟' },
    { id: 'bird', name: 'bird', color: '#AED581', emoji: '🐦' },
    { id: 'mammal', name: 'mammal', color: '#FFB74D', emoji: '🐕' },
    { id: 'reptile', name: 'reptile', color: '#BA68C8', emoji: '🦎' },
];

interface Animal {
    id: number;
    name: string;
    type: string;
    image: any;
}

interface Category {
    id: string;
    name: string;
    color: string;
    emoji: string;
}

interface GameResult {
    correct: number;
    wrong: number;
    total: number;
    score: number;
}

// 浮動文字元件
interface FloatingTextProps {
    text: string;
    color: string;
    onComplete: () => void;
}

const FloatingText: React.FC<FloatingTextProps> = ({ text, color, onComplete }) => {
    const opacity = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: -80, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start(() => onComplete());
    }, []);

    return (
        <Animated.View style={[styles.floatingContainer, { opacity, transform: [{ translateY }] }]}>
            <Text style={[styles.floatingText, { color }]}>{text}</Text>
        </Animated.View>
    );
};

const AnimalClassificationGame: React.FC = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    // ⭐ 关键：隐藏系统导航栏（包括返回按钮和标题）
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const [allAnimals] = useState<Animal[]>(ANIMALS);
    const [categories] = useState<Category[]>(CATEGORIES);
    const [availableAnimals, setAvailableAnimals] = useState<Animal[]>(ANIMALS);
    const [categoryAssignments, setCategoryAssignments] = useState<Record<number, string>>({});
    const [score, setScore] = useState(0);
    const [gameResult, setGameResult] = useState<GameResult>({ correct: 0, wrong: 0, total: 0, score: 0 });
    const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
    const [showDropZones, setShowDropZones] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [finalReport, setFinalReport] = useState({ summary: '', accuracy: 0 });

    // 特效狀態
    const [floatingText, setFloatingText] = useState<{ id: number; text: string; color: string } | null>(null);
    const screenShake = useRef(new Animated.Value(0)).current;
    const [prepText, setPrepText] = useState<string | null>(null);
    const prepScale = useRef(new Animated.Value(0)).current;
    const categoryScale = useRef(new Animated.Value(1)).current;
    const scoreAnim = useRef(new Animated.Value(1)).current;

    // ========== 💾 保存分數到伺服器 ==========
    const saveScore = async (finalScore: number) => {
        if (!token) return;

        setIsSaving(true);
        try {
            const gameData = {
                gameName: "Animal Catcher",
                scores: finalScore,
                gameType: "SCIENCE",
                gameDifficulty: "EASY"
            };
            
            const questionsData = ANIMALS.map((animal, index) => ({
                id: index + 1,
                question: `Classify ${animal.name}`,
                correctAnswer: animal.type,
                userAnswer: categoryAssignments[animal.id] || undefined,
                isCorrect: categoryAssignments[animal.id] === animal.type,
                questionType: 'classification'
            }));

            const metadata: GameMetadata = createGameMetadata(
                gameData.gameType,
                gameData.gameDifficulty,
                finalScore,
                {
                    totalAnimals: ANIMALS.length,
                    correctClassifications: score
                },
                questionsData
            );

            const backendRequest = {
                gameName: gameData.gameName,
                scores: gameData.scores,
                metadata: metadata
            };
            
            await axios.post('http://localhost:8080/api/user/game/score', backendRequest, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Score synced to server!");
        } catch (e) {
            console.error("Failed to sync score:", e);
        } finally {
            setIsSaving(false);
        }
    };

    const triggerScreenShake = () => {
        Animated.sequence([
            Animated.timing(screenShake, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 5, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: -5, duration: 50, useNativeDriver: true }),
            Animated.timing(screenShake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const showHitFeedback = (isCorrect: boolean) => {
        if (isCorrect) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            triggerScreenShake();
        }
        setFloatingText({ id: Date.now(), text: isCorrect ? '✨ PERFECT! ✨' : '💥 OOPS! 💥', color: isCorrect ? '#FFD700' : '#FF4757' });
        animateScore();
    };

    const animateScore = () => {
        Animated.sequence([
            Animated.timing(scoreAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
            Animated.timing(scoreAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
    };

    const startPrepSequence = () => {
        setTimeout(() => {
            setPrepText('READY?');
            prepScale.setValue(0);
            Animated.spring(prepScale, { toValue: 1.2, friction: 3, tension: 100, useNativeDriver: true }).start();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 100);
        setTimeout(() => {
            setPrepText('START!');
            prepScale.setValue(0);
            Animated.spring(prepScale, { toValue: 1.5, friction: 2, tension: 120, useNativeDriver: true }).start();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1000);
        setTimeout(() => {
            Animated.timing(prepScale, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setPrepText(null));
        }, 1600);
    };

    useEffect(() => { startPrepSequence(); }, []);

    const handleAnimalPress = (animal: Animal) => {
        if (!categoryAssignments[animal.id]) {
            setSelectedAnimal(animal);
            setShowDropZones(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Animated.sequence([
                Animated.timing(categoryScale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
                Animated.timing(categoryScale, { toValue: 1, duration: 100, useNativeDriver: true }),
            ]).start();
        }
    };

    const handleDropOnCategory = (categoryId: string) => {
        if (selectedAnimal) {
            const isCorrect = selectedAnimal.type === categoryId;
            showHitFeedback(isCorrect);

            // 更新分數（即時更新，满分120）
            const newCorrectCount = isCorrect ? gameResult.correct + 1 : gameResult.correct;
            const newWrongCount = !isCorrect ? gameResult.wrong + 1 : gameResult.wrong;
            const newScore = Math.round((newCorrectCount / allAnimals.length) * 120);
            setScore(newScore);
            setGameResult(prev => ({
                ...prev,
                correct: newCorrectCount,
                wrong: newWrongCount,
                score: newScore
            }));

            setCategoryAssignments(prev => ({ ...prev, [selectedAnimal.id]: categoryId }));
            setAvailableAnimals(prev => prev.filter(a => a.id !== selectedAnimal.id));
            setSelectedAnimal(null);
            setShowDropZones(false);
            checkGameCompletion();
        }
    };

    const handleRemoveFromCategory = (animalId: number) => {
        const animal = allAnimals.find(a => a.id === animalId);
        if (animal) {
            // 移除時重新計算分數（满分120）
            const wasCorrect = categoryAssignments[animalId] === animal.type;
            const newCorrectCount = wasCorrect ? gameResult.correct - 1 : gameResult.correct;
            const newWrongCount = !wasCorrect ? gameResult.wrong - 1 : gameResult.wrong;
            const newScore = Math.round((newCorrectCount / allAnimals.length) * 120);
            setScore(newScore);
            setGameResult(prev => ({
                ...prev,
                correct: newCorrectCount,
                wrong: newWrongCount,
                score: newScore
            }));

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCategoryAssignments(prev => { const newAssignments = { ...prev }; delete newAssignments[animalId]; return newAssignments; });
            setAvailableAnimals(prev => [...prev, animal]);
        }
        checkGameCompletion();
    };

    const calculateScore = () => {
        let correct = 0, wrong = 0;
        allAnimals.forEach(animal => {
            const assigned = categoryAssignments[animal.id];
            if (assigned) assigned === animal.type ? correct++ : wrong++;
        });
        const total = allAnimals.length;
        const calculatedScore = Math.round((correct / total) * 120);
        setGameResult({ correct, wrong, total, score: calculatedScore });
        setScore(calculatedScore);
        return { correct, wrong, total, score: calculatedScore };
    };

    const checkGameCompletion = () => {
        if (Object.keys(categoryAssignments).length === allAnimals.length) {
            const result = calculateScore();
            saveGameResult(result);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showFinalReport();
        }
    };

    const showFinalReport = async () => {
        const result = calculateScore();
        // 保存分數到伺服器
        await saveScore(result.score);
        setFinalReport({ summary: generateSummary(result), accuracy: result.score });
        setIsFinished(true);
    };

    const generateSummary = (result: GameResult): string => {
        let summary = '';
        // 满分120分，阈值调整：满分120 → 优秀；≥84分（相当于原70%正确率）→ 良好
        if (result.score === 120) summary = '🌟 EXCELLENT! You classified all animals correctly! 🌟';
        else if (result.score >= 84) summary = `🎉 Good job! You got ${result.correct} out of ${result.total} correct. Keep practicing! 🎉`;
        else summary = `📚 You got ${result.correct} out of ${result.total} correct. Let's review and try again! 💪`;

        const wrongAnimals = allAnimals.filter(animal => {
            const assigned = categoryAssignments[animal.id];
            return assigned && assigned !== animal.type;
        });
        if (wrongAnimals.length > 0) {
            summary += '\n\n📖 Animals to review:\n';
            wrongAnimals.forEach(animal => {
                const assigned = categoryAssignments[animal.id];
                summary += `• ${animal.name} was placed in ${assigned}, but should be in ${animal.type}\n`;
            });
        }
        return summary;
    };

    const saveGameResult = async (result: GameResult) => {
        try {
            const existing = await AsyncStorage.getItem('animalGameResults');
            const results = existing ? JSON.parse(existing) : [];
            results.push({ ...result, date: new Date().toISOString() });
            await AsyncStorage.setItem('animalGameResults', JSON.stringify(results));
        } catch (error) { console.error('Save failed:', error); }
    };

    const resetGame = () => {
        setCategoryAssignments({});
        setAvailableAnimals(allAnimals);
        setScore(0);
        setGameResult({ correct: 0, wrong: 0, total: allAnimals.length, score: 0 });
        setSelectedAnimal(null);
        setShowDropZones(false);
        setIsFinished(false);
        setFinalReport({ summary: '', accuracy: 0 });
        setFloatingText(null);
        startPrepSequence();
    };

    const cancelSelection = () => {
        setSelectedAnimal(null);
        setShowDropZones(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const screenShakeStyle = { transform: [{ translateX: screenShake }] };
    const prepAnimatedStyle = { transform: [{ scale: prepScale }], opacity: prepScale.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] }) };
    const categoryAnimatedStyle = { transform: [{ scale: categoryScale }] };
    const scoreAnimatedStyle = { transform: [{ scale: scoreAnim }] };

    const renderAnimalCard = (animal: Animal) => {
        if (categoryAssignments[animal.id]) return null;
        const isSelected = selectedAnimal?.id === animal.id;
        return (
            <TouchableOpacity key={animal.id} style={[styles.animalCard, isSelected && styles.selectedAnimalCard]} onPress={() => handleAnimalPress(animal)} activeOpacity={0.7}>
                <View style={styles.animalImageContainer}>
                    <Image source={animal.image} style={styles.animalImage} />
                    <Text style={styles.animalName}>{animal.name}</Text>
                </View>
                <Text style={styles.tapToSelectText}>✨ Click to select ✨</Text>
            </TouchableOpacity>
        );
    };

    const renderClassifiedAnimal = (animal: Animal) => {
        const assignedCategory = categoryAssignments[animal.id];
        const isCorrect = assignedCategory === animal.type;
        return (
            <TouchableOpacity key={animal.id} style={[styles.classifiedAnimalCard, { borderColor: isCorrect ? '#4CAF50' : '#F44336' }]} onPress={() => handleRemoveFromCategory(animal.id)} activeOpacity={0.7}>
                <Image source={animal.image} style={styles.classifiedAnimalImage} />
                <Text style={styles.classifiedAnimalName}>{animal.name}</Text>
                <Text style={styles.classifiedAnimalType}>{assignedCategory}</Text>
                <View style={[styles.correctnessIndicator, { backgroundColor: isCorrect ? '#4CAF50' : '#F44336' }]}>
                    <Text style={styles.correctnessText}>{isCorrect ? '✓' : '✗'}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderCategoryArea = (category: Category) => {
        const assignedAnimals = allAnimals.filter(animal => categoryAssignments[animal.id] === category.id);
        const isDropTarget = showDropZones && selectedAnimal;
        return (
            <Animated.View style={[styles.categoryAreaWrapper, categoryAnimatedStyle]}>
                <TouchableOpacity style={[styles.categoryArea, { backgroundColor: `${category.color}20` }, isDropTarget && styles.dropTargetArea]} onPress={() => handleDropOnCategory(category.id)} disabled={!showDropZones} activeOpacity={0.8}>
                    <View style={[styles.categoryHeader, { backgroundColor: category.color }]}>
                        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                        <Text style={styles.categoryTitle}>{category.name}</Text>
                        <Text style={styles.categoryCount}>{assignedAnimals.length}</Text>
                    </View>
                    <View style={styles.classifiedAnimalsContainer}>
                        {assignedAnimals.length > 0 ? assignedAnimals.map(animal => renderClassifiedAnimal(animal)) : (
                            <View style={styles.emptyCategoryMessage}>
                                <Text style={styles.emptyCategoryText}>{showDropZones ? '👇 Drop here! 👇' : '✨ Empty ✨'}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    // 返回遊戲列表頁面
    const handleGoToGameList = () => {
        navigation.navigate('science/index' as never);
    };

    // 完成页面 - 同样隐藏系统导航栏
    if (isFinished) {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.headerBarSimplified}>
                    <Text style={styles.headerTitle}>Animal Classification</Text>
                </View>
                <View style={styles.reportContainer}>
                    <Text style={styles.reportTitle}>📊 Session Report 📊</Text>
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreCircleNumber}>{finalReport.accuracy}</Text>
                        <Text style={styles.scoreCircleLabel}>/ 120</Text>
                    </View>

                    {/* 保存中指示器 */}
                    {isSaving && (
                        <View style={styles.savingIndicator}>
                            <ActivityIndicator size="small" color="#4CAF50" />
                            <Text style={styles.savingText}>同步分數中...</Text>
                        </View>
                    )}

                    <View style={styles.resultsContainer}>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>✅ Correct:</Text>
                            <Text style={[styles.resultValue, styles.correctText]}>{gameResult.correct} / {gameResult.total}</Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>❌ Wrong:</Text>
                            <Text style={[styles.resultValue, styles.wrongText]}>{gameResult.wrong} / {gameResult.total}</Text>
                        </View>
                    </View>
                    <View style={styles.reportBox}>
                        <Text style={styles.summaryText}>{finalReport.summary}</Text>
                    </View>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={[styles.modalButton, styles.playAgainButton]} onPress={resetGame}>
                            <Text style={styles.modalButtonText}>🔄 Play Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.playAgainButton]} onPress={handleGoBack}>
                            <Text style={styles.modalButtonText}>🔄 select level</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.playAgainButton]} onPress={handleGoToGameList}>
                            <Text style={styles.modalButtonText}>🔄 go to game list</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <Animated.View style={[styles.container, screenShakeStyle]}>
            {prepText && (
                <Animated.View style={[styles.prepOverlay, prepAnimatedStyle]}>
                    <View style={styles.prepCard}>
                        <Text style={styles.prepEmoji}>{prepText === 'READY?' ? '🎪' : '🎯'}</Text>
                        <Text style={styles.prepText}>{prepText}</Text>
                        <Text style={styles.prepSubtext}>{prepText === 'READY?' ? 'Get ready to classify!' : 'Match animals to their groups!'}</Text>
                    </View>
                </Animated.View>
            )}
            {floatingText && <FloatingText key={floatingText.id} text={floatingText.text} color={floatingText.color} onComplete={() => setFloatingText(null)} />}

            <View style={styles.headerBarSimplified}>
                <Text style={styles.headerTitle}>Animal Classification</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Classify the Animals!</Text>
                    <Animated.View style={[styles.scoreContainer, scoreAnimatedStyle]}>
                        <Text style={styles.scoreLabel}>⭐ Score:</Text>
                        <Text style={styles.scoreValue}>{score}</Text>
                        <Text style={styles.scoreMax}>/120</Text>
                        <Text style={styles.progressText}>({Object.keys(categoryAssignments).length}/{allAnimals.length})</Text>
                    </Animated.View>
                </View>

                {selectedAnimal && (
                    <View style={styles.selectionInfo}>
                        <View style={styles.selectedAnimalPreview}>
                            <Image source={selectedAnimal.image} style={styles.selectedAnimalImage} />
                            <View>
                                <Text style={styles.selectionText}>📌 Selected: <Text style={styles.selectedAnimalName}>{selectedAnimal.name}</Text></Text>
                                <Text style={styles.instructionText}>👇 Click on a colored category below to place the animal! 👇</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.cancelButton} onPress={cancelSelection}>
                            <Text style={styles.cancelButtonText}>❌ Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.animalsContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🎴 Animal Cards</Text>
                        <Text style={styles.remainingCount}>Remaining: {availableAnimals.length} / {allAnimals.length}</Text>
                    </View>
                    {availableAnimals.length > 0 ? (
                        <View style={styles.animalsGrid}>{availableAnimals.map(animal => renderAnimalCard(animal))}</View>
                    ) : (
                        <View style={styles.emptyAnimalArea}>
                            <Text style={styles.emptyAnimalText}>🎉 All animals classified! 🎉</Text>
                            <Text style={styles.emptyAnimalSubtext}>Click "Check Answer" to see your results!</Text>
                        </View>
                    )}
                </View>

                <View style={styles.categoriesContainer}>
                    <Text style={styles.sectionTitle}>🎯 Classification Area</Text>
                    <View style={styles.categoriesGrid}>{categories.map(category => renderCategoryArea(category))}</View>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetGame}>
                        <Text style={styles.buttonText}>🔄 Reset Game</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.checkButton]} onPress={showFinalReport}>
                        <Text style={styles.buttonText}>✅ Check Answer</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    headerBarSimplified: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContainer: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#333', flex: 1 },
    scoreContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    scoreLabel: { fontSize: 14, color: '#666', marginRight: 5 },
    scoreValue: { fontSize: 20, fontWeight: 'bold', color: '#4CAF50', marginRight: 2 },
    scoreMax: { fontSize: 12, color: '#999', marginRight: 5 },
    progressText: { fontSize: 12, color: '#666' },
    selectionInfo: { backgroundColor: '#E3F2FD', padding: 12, borderRadius: 10, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    selectedAnimalPreview: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    selectedAnimalImage: { width: 40, height: 40, resizeMode: 'contain', marginRight: 10 },
    selectionText: { fontSize: 14, color: '#333' },
    selectedAnimalName: { fontWeight: 'bold', color: '#2196F3' },
    instructionText: { fontSize: 12, color: '#666' },
    cancelButton: { backgroundColor: '#FF9800', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginLeft: 10 },
    cancelButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
    remainingCount: { fontSize: 12, color: '#666', fontStyle: 'italic' },
    animalsContainer: { marginBottom: 25 },
    animalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    animalCard: { width: '48%', backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, overflow: 'hidden' },
    selectedAnimalCard: { backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#2196F3', transform: [{ scale: 1.02 }] },
    animalImageContainer: { padding: 10, alignItems: 'center' },
    animalImage: { width: 60, height: 60, resizeMode: 'contain' },
    animalName: { fontSize: 14, fontWeight: '500', color: '#333', marginTop: 5 },
    tapToSelectText: { fontSize: 10, color: '#2196F3', marginBottom: 8, textAlign: 'center', fontStyle: 'italic' },
    emptyAnimalArea: { backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center', elevation: 2 },
    emptyAnimalText: { fontSize: 16, fontWeight: '600', color: '#4CAF50' },
    emptyAnimalSubtext: { fontSize: 12, color: '#666', marginTop: 5 },
    categoriesContainer: { marginBottom: 25 },
    categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    categoryAreaWrapper: { width: '48%', marginBottom: 12 },
    categoryArea: { minHeight: 220, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' },
    dropTargetArea: { borderWidth: 3, borderColor: '#2196F3', borderStyle: 'dashed', transform: [{ scale: 1.02 }] },
    categoryHeader: { padding: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    categoryEmoji: { fontSize: 18 },
    categoryTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    categoryCount: { fontSize: 12, color: '#fff', opacity: 0.9, marginLeft: 4 },
    classifiedAnimalsContainer: { padding: 8, flex: 1 },
    classifiedAnimalCard: { backgroundColor: '#fff', borderRadius: 6, padding: 6, marginBottom: 6, alignItems: 'center', borderWidth: 1, position: 'relative', elevation: 1 },
    classifiedAnimalImage: { width: 35, height: 35, resizeMode: 'contain' },
    classifiedAnimalName: { fontSize: 11, fontWeight: '500', color: '#333' },
    classifiedAnimalType: { fontSize: 9, color: '#666', fontStyle: 'italic' },
    correctnessIndicator: { position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    correctnessText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
    emptyCategoryMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
    emptyCategoryText: { fontSize: 12, color: '#999', textAlign: 'center', fontStyle: 'italic' },
    controls: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15, marginBottom: 20, gap: 12 },
    button: { flex: 1, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, elevation: 2, alignItems: 'center' },
    resetButton: { backgroundColor: '#F44336' },
    checkButton: { backgroundColor: '#4CAF50' },
    buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    reportContainer: { padding: 20 },
    reportTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#333' },
    scoreCircle: { alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
    scoreCircleNumber: { fontSize: 64, fontWeight: 'bold', color: '#4CAF50' },
    scoreCircleLabel: { fontSize: 20, color: '#666', marginTop: -5 },
    savingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E8F5E9',
        borderRadius: 20,
        alignSelf: 'center',
    },
    savingText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
    },
    resultsContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, elevation: 2 },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    resultLabel: { fontSize: 16, color: '#666' },
    resultValue: { fontSize: 18, fontWeight: '600' },
    correctText: { color: '#4CAF50' },
    wrongText: { color: '#F44336' },
    reportBox: { backgroundColor: '#fff9c4', padding: 20, borderRadius: 12, marginBottom: 30 },
    summaryText: { fontSize: 14, lineHeight: 22, color: '#333' },
    modalButtons: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 30, flexWrap: 'wrap' },
    modalButton: { paddingVertical: 12, borderRadius: 12, marginHorizontal: 5, alignItems: 'center', minWidth: 140 },
    playAgainButton: { backgroundColor: '#4CAF50' },
    modalButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    floatingContainer: { position: 'absolute', top: '35%', left: 0, right: 0, alignItems: 'center', zIndex: 300 },
    floatingText: { fontSize: 42, fontWeight: '900', textAlign: 'center', fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
    prepOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 400, alignItems: 'center', justifyContent: 'center' },
    prepCard: { backgroundColor: '#fff', paddingHorizontal: 40, paddingVertical: 30, borderRadius: 30, borderWidth: 4, borderColor: '#FF9800', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
    prepEmoji: { fontSize: 60, marginBottom: 20 },
    prepText: { fontSize: 56, fontWeight: '900', color: '#FF9800', fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier', textShadowColor: '#FFC107', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
    prepSubtext: { fontSize: 14, color: '#666', marginTop: 15, fontWeight: '500' },
});

export default AnimalClassificationGame;