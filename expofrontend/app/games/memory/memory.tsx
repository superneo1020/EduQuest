import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ScrollView, // 加入 ScrollView
    useWindowDimensions, // 加入動態寬高 Hook
} from 'react-native';
import { ArrowLeft, Trophy, Clock, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function MemoryGameScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions(); // 獲取動態寬高
    const isLandscape = width > height; // 判斷是否為橫屏

    // 根據螢幕方向計算卡片大小
    // 橫屏時參考高度(height)，直屏時參考寬度(width)
    const cardSize = isLandscape ? (height * 0.18) : (width * 0.2);

    const [cards, setCards] = useState<any[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [moves, setMoves] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameActive, setGameActive] = useState(true);

    const symbols = ['🍎', '🐶', '🚀', '⚽', '🎨', '🎸', '🍦', '💡'];

    const initializeGame = useCallback(() => {
        const cardPairs = [...symbols, ...symbols]
            .sort(() => Math.random() - 0.5)
            .map((symbol, index) => ({
                id: index,
                symbol,
                isFlipped: false,
                isMatched: false,
            }));
        setCards(cardPairs);
        setFlippedCards([]);
        setScore(0);
        setMoves(0);
        setTimeLeft(60);
        setGameActive(true);
    }, []);

    useEffect(() => { initializeGame(); }, [initializeGame]);

    // 處理計時器
    useEffect(() => {
        let timer: any;
        if (gameActive && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && gameActive) {
            setGameActive(false);
            Alert.alert('Time\'s Up!', `Final Score: ${score}`, [{ text: 'Retry', onPress: initializeGame }]);
        }
        return () => clearInterval(timer);
    }, [gameActive, timeLeft]);

    const handleCardPress = (index: number) => {
        if (!gameActive || cards[index].isFlipped || cards[index].isMatched || flippedCards.length === 2) return;

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedCards, index];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(prev => prev + 1);
            const [first, second] = newFlipped;
            if (newCards[first].symbol === newCards[second].symbol) {
                newCards[first].isMatched = true;
                newCards[second].isMatched = true;
                setScore(prev => prev + 20);
                setFlippedCards([]);
            } else {
                setTimeout(() => {
                    newCards[first].isFlipped = false;
                    newCards[second].isFlipped = false;
                    setCards(newCards);
                    setFlippedCards([]);
                }, 800);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header 固定在頂部 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.stats}>
                    <View style={styles.stat}><Trophy size={18} color="#FFD700" /><Text style={styles.statText}>{score}</Text></View>
                    <View style={styles.stat}><Clock size={18} color="#FF6B6B" /><Text style={styles.statText}>{timeLeft}s</Text></View>
                </View>
            </View>

            {/* 使用 ScrollView 包裹遊戲區域，防止溢出 */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.gameTitle}>Memory Match</Text>

                <View style={[styles.grid, { width: isLandscape ? '80%' : '100%' }]}>
                    {cards.map((card, index) => (
                        <TouchableOpacity
                            key={card.id}
                            style={[
                                styles.card,
                                { width: cardSize, height: cardSize }, // 動態設定寬高
                                card.isFlipped || card.isMatched ? styles.cardFlipped : styles.cardBack,
                                card.isMatched && styles.cardMatched
                            ]}
                            onPress={() => handleCardPress(index)}
                        >
                            <Text style={[styles.cardText, { fontSize: cardSize * 0.5 }]}>
                                {(card.isFlipped || card.isMatched) ? card.symbol : '?'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.resetButton} onPress={initializeGame}>
                    <RefreshCw size={20} color="white" />
                    <Text style={styles.resetText}>Restart</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3E5F5' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: 'white',
        elevation: 4,
    },
    backButton: { padding: 5 },
    stats: { flexDirection: 'row', gap: 10 },
    stat: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, borderRadius: 15 },
    statText: { fontWeight: 'bold', marginLeft: 5 },
    scrollContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    gameTitle: { fontSize: 24, fontWeight: 'bold', color: '#6A1B9A', marginBottom: 10 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    card: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        elevation: 2,
    },
    cardBack: { backgroundColor: '#9C27B0' },
    cardFlipped: { backgroundColor: 'white', borderWidth: 2, borderColor: '#9C27B0' },
    cardMatched: { backgroundColor: '#E1BEE7', opacity: 0.5 },
    cardText: { fontWeight: 'bold' },
    resetButton: {
        flexDirection: 'row',
        backgroundColor: '#6A1B9A',
        padding: 12,
        borderRadius: 25,
        marginTop: 20,
        alignItems: 'center',
        gap: 10,
    },
    resetText: { color: 'white', fontWeight: 'bold' },
});