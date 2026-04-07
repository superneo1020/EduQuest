// science/BodyPartsMatchingGame.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
    { id: 'hand', name: '手', emoji: '🖐️' },
    { id: 'head', name: '頭', emoji: '👤' },
    { id: 'mouth', name: '口', emoji: '👄' },
    { id: 'eye', name: '眼', emoji: '👁️' },
    { id: 'ear', name: '耳', emoji: '👂' },
    { id: 'nose', name: '鼻', emoji: '👃' },
    { id: 'foot', name: '腳', emoji: '🦶' },
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

    // ========== 💾 保存分數到伺服器 ==========
    const saveScore = async (finalScore: number) => {
        if (!token) return;

        setIsSaving(true);
        try {
            await axios.post('http://localhost:8080/api/user/game/score', {
                gameName: "Body Parts Matching",
                scores: finalScore,
                difficulty: "MATCHING"
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
        const endTime = Date.now();
        const timeSpent = (endTime - startTimeRef.current) / 1000; // 秒數
        let finalScore = 0;
        let summary = '';

        if (timeSpent <= 50) {
            finalScore = 100;
            summary = `🎉 太棒了！你在 ${Math.round(timeSpent)} 秒內完成了遊戲，獲得滿分100分！配對速度超快，記憶力驚人！`;
        } else if (timeSpent <= 60) {
            finalScore = 90;
            summary = `😊 不錯喔！你在 ${Math.round(timeSpent)} 秒內完成了遊戲，獲得90分！如果能再快一點就能拿到滿分了！`;
        } else {
            const extraTime = Math.floor((timeSpent - 60) / 15);
            const deduction = Math.min(extraTime * 10, 80);
            finalScore = Math.max(0, 100 - deduction);
            summary = `⏱️ 你花了 ${Math.round(timeSpent)} 秒完成遊戲，超過1分鐘後每15秒扣10分，最終得分為 ${finalScore} 分。下次可以試著加快配對速度喔！`;
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
        setCards(generateCards());
        setSelectedIndex(null);
        setLockBoard(false);
        setScore(0);
        setMatches(0);
        setIsFinished(false);
        startTimeRef.current = Date.now();
    };

    // ⭐ 返回上一頁函數
    const handleGoBack = () => {
        navigation.goBack();
    };

    // 返回遊戲列表頁面
    const handleGoToGameList = () => {
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

    // 總結頁面 - 简化顶部栏，移除返回按钮
    if (isFinished) {
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

                    {/* 保存中指示器 */}
                    {isSaving && (
                        <View style={styles.savingIndicator}>
                            <ActivityIndicator size="small" color="#4CAF50" />
                            <Text style={styles.savingText}>同步分數中...</Text>
                        </View>
                    )}

                    <View style={styles.resultsContainer}>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>完成時間:</Text>
                            <Text style={styles.resultValue}>
                                {Math.round(finalReport.timeSpent)} 秒
                            </Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>配對成功:</Text>
                            <Text style={[styles.resultValue, styles.correctText]}>
                                {matches} / {totalPairs}
                            </Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>遊戲得分:</Text>
                            <Text style={styles.resultValue}>
                                {score} 分
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

    // 遊戲主頁面 - 简化顶部栏，移除返回按钮
    const renderContent = () => (
        <>
            {/* 簡化頂部欄 - 只保留標題 */}
            <View style={styles.headerBarSimplified}>
                <Text style={styles.headerTitle}>Body Parts Matching</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 遊戲標題和計分板 */}
                <View style={styles.header}>
                    <Text style={styles.title}>🧩 身體部位配對遊戲</Text>
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
                        點擊卡片翻開，找到兩個相同的部位即可配對。配對成功加10分，失敗扣2分。
                        完成時間越短分數越高！50秒內滿分100分，1分鐘內90分，超過後每15秒扣10分。
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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
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