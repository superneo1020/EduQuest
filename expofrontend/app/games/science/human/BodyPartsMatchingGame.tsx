// science/BodyPartsMatchingGame.tsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createGameMetadata, GameMetadata } from '../../../../types/GameMetadata';
import { convertToBackendMetadata } from '../../../utils/metadataConverter';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    useWindowDimensions,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '@/src/auth/AuthContext';

const isWeb = Platform.OS === 'web';

// 身體部位數據（名稱 + Emoji）
const BODY_PARTS = [
    { id: 'hand', name: 'hand', emoji: '🖐️' },
    { id: 'head', name: 'head', emoji: '👤' },
    { id: 'mouth', name: 'mouth', emoji: '👄' },
    { id: 'eye', name: 'eye', emoji: '👁️' },
    { id: 'ear', name: 'ear', emoji: '👂' },
    { id: 'nose', name: 'nose', emoji: '👃' },
    { id: 'foot', name: 'foot', emoji: '🦶' },
];

// 生成卡片數組（每種部位兩張，並隨機打亂）
const generateCards = () => {
    const cards: Card[] = [];
    BODY_PARTS.forEach((part) => {
        cards.push({
            id: `${part.id}-0`,
            partId: part.id,
            name: part.name,
            emoji: part.emoji,
            isMatched: false,
            isFlipped: false,
        });
        cards.push({
            id: `${part.id}-1`,
            partId: part.id,
            name: part.name,
            emoji: part.emoji,
            isMatched: false,
            isFlipped: false,
        });
    });
    // Fisher-Yates 洗牌
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
};

interface Card {
    id: string;
    partId: string;
    name: string;
    emoji: string;
    isMatched: boolean;
    isFlipped: boolean;
}

const BodyPartsMatchingGame = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    // 防重複提交鎖
    const isCompletingRef = useRef(false);
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [isPortrait, setIsPortrait] = useState(screenHeight > screenWidth);

    // ========== 🕒 計時器相關狀態 ==========
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const elapsedSecondsRef = useRef<number>(0);   // ✅ 同步最新秒數，避免閉包陷阱
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ✅ 記錄每個身體部位完成匹配時的秒數
    const matchTimesRef = useRef<{ [partId: string]: number }>({});

    // 格式化時間 (MM:SS)
    const formatTime = (totalSeconds: number): string => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // 停止計時器
    const stopTimer = useCallback(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    }, []);

    // 開始計時器
    const startTimer = useCallback(() => {
        stopTimer();
        setElapsedSeconds(0);
        elapsedSecondsRef.current = 0;
        timerIntervalRef.current = setInterval(() => {
            setElapsedSeconds(prev => {
                const newVal = prev + 1;
                elapsedSecondsRef.current = newVal;   // ✅ 同步 ref
                return newVal;
            });
        }, 1000);
    }, [stopTimer]);

    // 完全隐藏系统导航栏
    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    // 監聽屏幕方向變化
    useEffect(() => {
        const updateLayout = () => {
            const { width: w, height: h } = Dimensions.get('window');
            setIsPortrait(h > w);
        };
        const dimensionsHandler = Dimensions.addEventListener('change', updateLayout);
        return () => dimensionsHandler?.remove();
    }, []);

    // 遊戲狀態
    const [cards, setCards] = useState<Card[]>(() => generateCards());
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [lockBoard, setLockBoard] = useState(false);
    const [score, setScore] = useState(0);
    const [matches, setMatches] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [finalReport, setFinalReport] = useState({ summary: '', finalScore: 0, timeSpent: 0 });

    // 計算總對數
    const totalPairs = BODY_PARTS.length;

    // 開始遊戲時啟動計時器
    useEffect(() => {
        startTimer();
        return () => {
            stopTimer();
        };
    }, []);

    // ========== 💾 保存分數到伺服器（加入每題真實用時） ==========
    const saveScore = async (
        finalScore: number,
        totalSeconds: number,
        matchTimes: { [partId: string]: number }
    ) => {
        if (!token) return;
        if (isCompletingRef.current) {
            console.log("saveScore already in progress, skip");
            return;
        }
        isCompletingRef.current = true;
        setIsSaving(true);
        try {
            const gameData = {
                gameName: "Body Parts Matching",
                scores: finalScore,
                gameType: "SCIENCE",
                gameDifficulty: "MEDIUM"
            };

            // ✅ 根據 matchTimes 填入每題的實際耗時（秒）
            const questionsData = BODY_PARTS.map((part, index) => ({
                id: index + 1,
                question: `Match ${part.name}`,
                correctAnswer: part.name,
                userAnswer: 'User matched correctly',
                isCorrect: true,
                questionType: 'matching',
                timeSpent: matchTimes[part.id] ?? totalSeconds, // 若有記錄則用，否則用總時間（理論上都會有記錄）
            }));

            const totalTimeSeconds = totalSeconds;
            const totalTimeFormatted = formatTime(totalTimeSeconds);

            const metadata: GameMetadata = createGameMetadata(
                gameData.gameType,
                gameData.gameDifficulty,
                finalScore,
                {
                    totalParts: BODY_PARTS.length,
                    correctMatches: score,
                    totalTimeSeconds: totalTimeSeconds,
                    totalTimeFormatted: totalTimeFormatted,
                },
                questionsData
            );

            const backendRequest = {
                gameName: gameData.gameName,
                scores: gameData.scores,
                metadata: convertToBackendMetadata(metadata)
            };

            await axios.post('http://localhost:8080/api/user/game/score', backendRequest, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Score synced to server!");
        } catch (e) {
            console.error("Failed to sync score:", e);
        } finally {
            setIsSaving(false);
            setTimeout(() => {
                isCompletingRef.current = false;
            }, 500);
        }
    };

    // 計算完成時間並生成分數
    const calculateScoreAndReport = async () => {
        stopTimer();
        const totalSeconds = elapsedSecondsRef.current; // 使用 ref 中最新秒數
        let finalScore = 0;
        let summary = '';

        if (totalSeconds <= 50) {
            finalScore = 100;
            summary = `🎉 Awesome! You are in ${Math.round(totalSeconds)} Finished the game in seconds and got a perfect score of 100! Super fast matching speed, amazing memory!`;
        } else if (totalSeconds <= 60) {
            finalScore = 90;
            summary = `😊 Not bad! You are at ${Math.round(totalSeconds)} Finished the game in seconds and scored 90 points! If I could be a little faster, I could get a perfect score!`;
        } else {
            const extraTime = Math.floor((totalSeconds - 60) / 15);
            const deduction = Math.min(extraTime * 10, 80);
            finalScore = Math.max(0, 100 - deduction);
            summary = `⏱️ You spent ${Math.round(totalSeconds)} Complete the game in seconds. After more than 1 minute, 10 points are deducted every 15 seconds. The final score is ${finalScore} Points. Next time, you can try to speed up the matching!`;
        }

        // ✅ 傳入 matchTimesRef.current
        await saveScore(finalScore, totalSeconds, { ...matchTimesRef.current });

        setFinalReport({ summary, finalScore, timeSpent: totalSeconds });
        setIsFinished(true);
    };

    // 檢查遊戲是否完成
    useEffect(() => {
        if (matches === totalPairs && !isFinished) {
            calculateScoreAndReport();
        }
    }, [matches, totalPairs, isFinished]);

    // 重置遊戲
    const resetGame = () => {
        stopTimer();
        setCards(generateCards());
        setSelectedIndex(null);
        setLockBoard(false);
        setScore(0);
        setMatches(0);
        setIsFinished(false);
        matchTimesRef.current = {};   // ✅ 清空匹配時間記錄
        startTimer();
    };

    // 返回上一頁函數
    const handleGoBack = () => {
        stopTimer();
        navigation.goBack();
    };

    // 返回遊戲列表頁面
    const handleGoToGameList = () => {
        stopTimer();
        navigation.navigate('science/index' as never);
    };

    // 處理卡片點擊
    const handleCardPress = (index: number) => {
        if (lockBoard) return;
        const card = cards[index];
        if (card.isMatched || card.isFlipped) return;

        if (selectedIndex === null) {
            flipCard(index);
            setSelectedIndex(index);
            return;
        }

        const firstCard = cards[selectedIndex];
        const secondCard = card;

        if (selectedIndex === index) return;

        flipCard(index);

        const isMatch = firstCard.partId === secondCard.partId;
        if (isMatch) {
            // ✅ 記錄該身體部位匹配成功時的時間
            const matchTime = elapsedSecondsRef.current;
            matchTimesRef.current[firstCard.partId] = matchTime;

            setCards(prev => {
                const newCards = [...prev];
                newCards[selectedIndex!].isMatched = true;
                newCards[index].isMatched = true;
                return newCards;
            });
            setMatches(prev => prev + 1);
            setScore(prev => prev + 10);
            setSelectedIndex(null);
        } else {
            setLockBoard(true);
            setTimeout(() => {
                setCards(prev => {
                    const newCards = [...prev];
                    newCards[selectedIndex!].isFlipped = false;
                    newCards[index].isFlipped = false;
                    return newCards;
                });
                setSelectedIndex(null);
                setLockBoard(false);
            }, 800);
            setScore(prev => Math.max(0, prev - 2));
        }
    };

    // 翻轉卡片
    const flipCard = (index: number) => {
        setCards(prev => {
            const newCards = [...prev];
            newCards[index].isFlipped = true;
            return newCards;
        });
    };

    // 根據屏幕寬度動態計算卡片尺寸
    const getCardSize = () => {
        const isLandscape = !isPortrait;
        const cols = isLandscape ? 5 : 4;
        const gap = 12;
        const availableWidth = screenWidth - 40;
        const cardWidth = (availableWidth - (cols - 1) * gap) / cols;
        const cardHeight = cardWidth * 1.2;
        return { width: cardWidth, height: cardHeight, gap };
    };

    const cardSize = getCardSize();

    // 渲染卡片網格
    const renderCards = () => {
        const { width: cardW, height: cardH, gap } = cardSize;
        const cols = !isPortrait ? 5 : 4;

        const rows = [];
        for (let i = 0; i < cards.length; i += cols) {
            const rowCards = cards.slice(i, i + cols);
            rows.push(
                <View key={i} style={[styles.cardRow, { marginBottom: gap }]}>
                    {rowCards.map((card, idx) => {
                        const globalIndex = i + idx;
                        return (
                            <TouchableOpacity
                                key={card.id}
                                style={[
                                    styles.card,
                                    {
                                        width: cardW,
                                        height: cardH,
                                        marginHorizontal: gap / 2,
                                    },
                                    card.isMatched && styles.matchedCard,
                                ]}
                                onPress={() => handleCardPress(globalIndex)}
                                activeOpacity={0.8}
                                disabled={card.isMatched || lockBoard}
                            >
                                <View style={styles.cardInner}>
                                    {card.isFlipped || card.isMatched ? (
                                        <View style={styles.cardFront}>
                                            <Text style={styles.cardEmoji}>{card.emoji}</Text>
                                            <Text style={styles.cardName}>{card.name}</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.cardBack}>
                                            <Text style={styles.questionMark}>?</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            );
        }
        return rows;
    };

    // 总结页面
    if (isFinished) {
        const totalTimeFormatted = formatTime(Math.round(finalReport.timeSpent));
        return (
            <ScrollView style={styles.container}>
                <View style={styles.headerBarSimplified}>
                    <Text style={styles.headerTitle}>Body Parts Matching</Text>
                </View>

                <View style={styles.reportContainer}>
                    <Text style={styles.reportTitle}>Session Report 🎓</Text>

                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreCircleNumber}>{finalReport.finalScore}</Text>
                        <Text style={styles.scoreCircleLabel}>/ 100</Text>
                    </View>

                    <View style={styles.reportTimeBox}>
                        <Text style={styles.reportScoreLabel}>⏱️ Total Time</Text>
                        <Text style={styles.reportTimeValue}>{totalTimeFormatted}</Text>
                    </View>

                    {isSaving && (
                        <View style={styles.savingIndicator}>
                            <ActivityIndicator size="small" color="#4CAF50" />
                            <Text style={styles.savingText}>Synchronizing scores...</Text>
                        </View>
                    )}

                    <View style={styles.resultsContainer}>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Completion time:</Text>
                            <Text style={styles.resultValue}>
                                {Math.round(finalReport.timeSpent)} second
                            </Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Match successful:</Text>
                            <Text style={[styles.resultValue, styles.correctText]}>
                                {matches} / {totalPairs}
                            </Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Game Score:</Text>
                            <Text style={styles.resultValue}>
                                {score} points
                            </Text>
                        </View>
                    </View>

                    <View style={styles.reportBox}>
                        <Text style={styles.summaryText}>{finalReport.summary}</Text>
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.playAgainButton]}
                            onPress={resetGame}
                        >
                            <Text style={styles.modalButtonText}>Play Again</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.gameListButton]}
                            onPress={handleGoBack}
                        >
                            <Text style={styles.modalButtonText}>select level</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.gameListButton]}
                            onPress={handleGoToGameList}
                        >
                            <Text style={styles.modalButtonText}>Game List</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    }

    // 遊戲主頁面
    const renderContent = () => (
        <>
            <View style={styles.headerBarWithTimer}>
                <Text style={styles.headerTitle}>Body Parts Matching</Text>
                <View style={styles.timerContainer}>
                    <Text style={styles.timerIcon}>⏱️</Text>
                    <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>🧩 Body Parts Matching Game</Text>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>Score:</Text>
                        <Text style={styles.scoreValue}>{score}</Text>
                        <Text style={styles.progressText}>
                            ({matches}/{totalPairs})
                        </Text>
                    </View>
                </View>

                <View style={styles.instructions}>
                    <Text style={styles.instructionsText}>
                        Click on a card to flip it over, and find two matching parts to make a pair. Successfully matching gives 10 points, failing deducts 2 points.
                        The shorter the completion time, the higher the score! A full score of 100 points if completed within 50 seconds, 90 points if within 1 minute, and 10 points are deducted for every 15 seconds thereafter.
                    </Text>
                </View>

                <View style={styles.gridContainer}>
                    {renderCards()}
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.button, styles.resetButton]}
                        onPress={resetGame}
                    >
                        <Text style={styles.buttonText}>Reset Game</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </>
    );

    if (isWeb) {
        return (
            <ScrollView style={styles.scrollContainer}>
                {renderContent()}
            </ScrollView>
        );
    }

    return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f7ff',
    },
    scrollContainer: {
        flex: 1,
        backgroundColor: '#f0f7ff',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    headerBarSimplified: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerBarWithTimer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    timerIcon: {
        fontSize: 14,
        marginRight: 4,
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    scoreLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 5,
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginRight: 5,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
    },
    instructions: {
        backgroundColor: '#e8f4fc',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    instructionsText: {
        fontSize: 14,
        color: '#2c3e50',
        textAlign: 'center',
        lineHeight: 20,
    },
    gridContainer: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    cardInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardFront: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
    },
    cardBack: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3498db',
        borderRadius: 12,
    },
    cardEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    cardName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
    },
    questionMark: {
        fontSize: 48,
        color: 'white',
        fontWeight: 'bold',
    },
    matchedCard: {
        opacity: 0.6,
        backgroundColor: '#d4e6f1',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
        marginBottom: 20,
    },
    button: {
        paddingHorizontal: 25,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 2,
    },
    resetButton: {
        backgroundColor: '#F44336',
        minWidth: 120,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    reportContainer: {
        padding: 20,
    },
    reportTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
        color: '#333',
    },
    scoreCircle: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
    },
    scoreCircleNumber: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    scoreCircleLabel: {
        fontSize: 20,
        color: '#666',
        marginTop: -5,
    },
    reportTimeBox: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        width: '90%',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        alignSelf: 'center',
    },
    reportScoreLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    reportTimeValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
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
    resultsContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        elevation: 2,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    resultLabel: {
        fontSize: 16,
        color: '#666',
    },
    resultValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    correctText: {
        color: '#4CAF50',
    },
    reportBox: {
        backgroundColor: '#fff9c4',
        padding: 20,
        borderRadius: 12,
        marginBottom: 30,
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#333',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 30,
        flexWrap: 'wrap',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        marginHorizontal: 5,
        alignItems: 'center',
        minWidth: 120,
    },
    playAgainButton: {
        backgroundColor: '#4CAF50',
    },
    gameListButton: {
        backgroundColor: '#2196F3',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default BodyPartsMatchingGame;