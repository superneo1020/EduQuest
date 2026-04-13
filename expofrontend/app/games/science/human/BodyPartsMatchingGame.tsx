// science/BodyPartsMatchingGame.tsx
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
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
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const [isPortrait, setIsPortrait] = useState(screenHeight > screenWidth);
    const startTimeRef = useRef<number>(Date.now());

    // ========== 🕒 新增：計時器相關狀態 ==========
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        timerIntervalRef.current = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
    }, [stopTimer]);

    // ⭐ 完全隐藏系统导航栏（包括返回按钮和标题）
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
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

    // ========== 💾 保存分數到伺服器 ==========
    const saveScore = async (finalScore: number) => {
        if (!token) return;

        setIsSaving(true);
        try {
            await axios.post('http://localhost:8080/api/user/game/score', {
                gameName: "Body Parts Matching",
                scores: finalScore,
                difficulty: "MATCHING",
                "metadata": {}

            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Score synced to server!");
        } catch (e) {
            console.error("Failed to sync score:", e);
        } finally {
            setIsSaving(false);
        }
    };

    // 計算完成時間並生成分數
    const calculateScoreAndReport = async () => {
        stopTimer(); // 遊戲結束時停止計時器
        const endTime = Date.now();
        const timeSpent = (endTime - startTimeRef.current) / 1000; // 秒數
        let finalScore = 0;
        let summary = '';

        if (timeSpent <= 50) {
            finalScore = 100;
            summary = `🎉 Awesome! You are in ${Math.round(timeSpent)} Finished the game in seconds and got a perfect score of 100! Super fast matching speed, amazing memory!`;
        } else if (timeSpent <= 60) {
            finalScore = 90;
            summary = `😊 Not bad! You are at ${Math.round(timeSpent)} Finished the game in seconds and scored 90 points! If I could be a little faster, I could get a perfect score!`;
        } else {
            const extraTime = Math.floor((timeSpent - 60) / 15);
            const deduction = Math.min(extraTime * 10, 80);
            finalScore = Math.max(0, 100 - deduction);
            summary = `⏱️ You spent ${Math.round(timeSpent)} Complete the game in seconds. After more than 1 minute, 10 points are deducted every 15 seconds. The final score is ${finalScore} Points. Next time, you can try to speed up the matching!`;
        }

        // 保存分數到伺服器
        await saveScore(finalScore);

        setFinalReport({ summary, finalScore, timeSpent });
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
        stopTimer(); // 重置時停止舊計時器
        setCards(generateCards());
        setSelectedIndex(null);
        setLockBoard(false);
        setScore(0);
        setMatches(0);
        setIsFinished(false);
        startTimeRef.current = Date.now();
        startTimer(); // 重新開始計時
    };

    // ⭐ 返回上一頁函數
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

    // 總結頁面 - 显示总时间
    if (isFinished) {
        const totalTimeFormatted = formatTime(Math.round(finalReport.timeSpent));
        return (
            <ScrollView style={styles.container}>
                {/* 簡化頂部欄 - 只保留標題 */}
                <View style={styles.headerBarSimplified}>
                    <Text style={styles.headerTitle}>Body Parts Matching</Text>
                </View>

                <View style={styles.reportContainer}>
                    <Text style={styles.reportTitle}>Session Report 🎓</Text>

                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreCircleNumber}>{finalReport.finalScore}</Text>
                        <Text style={styles.scoreCircleLabel}>/ 100</Text>
                    </View>

                    {/* 新增：顯示總花費時間 */}
                    <View style={styles.reportTimeBox}>
                        <Text style={styles.reportScoreLabel}>⏱️ Total Time</Text>
                        <Text style={styles.reportTimeValue}>{totalTimeFormatted}</Text>
                    </View>

                    {/* 保存中指示器 */}
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

    // 遊戲主頁面 - 右上角增加计时器
    const renderContent = () => (
        <>
            {/* 修改頂部欄 - 標題在左，計時器在右 */}
            <View style={styles.headerBarWithTimer}>
                <Text style={styles.headerTitle}>Body Parts Matching</Text>
                <View style={styles.timerContainer}>
                    <Text style={styles.timerIcon}>⏱️</Text>
                    <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 遊戲標題和計分板 */}
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

                {/* 遊戲說明 */}
                <View style={styles.instructions}>
                    <Text style={styles.instructionsText}>
                        Click on a card to flip it over, and find two matching parts to make a pair. Successfully matching gives 10 points, failing deducts 2 points.
                        The shorter the completion time, the higher the score! A full score of 100 points if completed within 50 seconds, 90 points if within 1 minute, and 10 points are deducted for every 15 seconds thereafter.
                    </Text>
                </View>

                {/* 卡片網格 */}
                <View style={styles.gridContainer}>
                    {renderCards()}
                </View>

                {/* 控制按鈕 */}
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
    // 簡化頂部欄樣式（只保留標題）
    headerBarSimplified: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    // 新增：帶計時器的頂部欄樣式
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
    // 計時器樣式
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
    // 遊戲主頁面樣式
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
    // 報告頁面樣式
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
    // 新增：總結頁面的時間顯示樣式
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