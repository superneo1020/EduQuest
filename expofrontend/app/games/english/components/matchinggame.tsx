// app/games/components/MatchingGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Dimensions,
    Animated,
    ScrollView,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 4;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

const vocabularyData = [
    { id: '1', english: "Apple", chinese: "苹果", emoji: "🍎" },
    { id: '2', english: "Banana", chinese: "香蕉", emoji: "🍌" },
    { id: '3', english: "Cat", chinese: "猫", emoji: "🐱" },
    { id: '4', english: "Dog", chinese: "狗", emoji: "🐶" },
    { id: '5', english: "Red", chinese: "红色", emoji: "🔴" },
    { id: '6', english: "Blue", chinese: "蓝色", emoji: "🔵" },
    { id: '7', english: "Sun", chinese: "太阳", emoji: "☀️" },
    { id: '8', english: "Moon", chinese: "月亮", emoji: "🌙" },
    { id: '9', english: "Book", chinese: "书", emoji: "📚" },
    { id: '10', english: "Pen", chinese: "笔", emoji: "✏️" },
    { id: '11', english: "Water", chinese: "水", emoji: "💧" },
    { id: '12', english: "Fire", chinese: "火", emoji: "🔥" }
];

type Card = {
    id: string;
    content: string;
    matchId: string;
    type: 'english' | 'chinese';
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
    pairContent: string;
};

type Difficulty = 'easy' | 'medium' | 'hard';

const MatchingGame = () => {
    const [cards, setCards] = useState<Card[]>([]);
    const [firstCard, setFirstCard] = useState<Card | null>(null);
    const [secondCard, setSecondCard] = useState<Card | null>(null);
    const [lockBoard, setLockBoard] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [timer, setTimer] = useState(0);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);
    const [totalPairs, setTotalPairs] = useState(4);
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    const flipAnimations = useRef<{ [key: string]: Animated.Value }>({});
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        loadHighScore();
        initializeCards();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [difficulty]);

    const loadHighScore = async () => {
        try {
            const saved = await AsyncStorage.getItem(`matching_game_high_score_${difficulty}`);
            if (saved) setHighScore(parseInt(saved));
        } catch (error) {
            console.error('Failed to load highest score:', error);
        }
    };

    const saveHighScore = async (newScore: number) => {
        try {
            if (newScore > highScore) {
                setHighScore(newScore);
                await AsyncStorage.setItem(`matching_game_high_score_${difficulty}`, newScore.toString());
            }
        } catch (error) {
            console.error('Failed to save highest score:', error);
        }
    };

    const initializeCards = () => {
        let pairCount = 4;
        switch (difficulty) {
            case 'easy': pairCount = 4; break;
            case 'medium': pairCount = 5; break;
            case 'hard': pairCount = 6; break;
        }
        setTotalPairs(pairCount);

        const selectedWords = [...vocabularyData]
            .sort(() => Math.random() - 0.5)
            .slice(0, pairCount);

        const newCards: Card[] = [];
        selectedWords.forEach((word) => {
            newCards.push({
                id: `english-${word.id}`,
                content: word.english,
                matchId: word.id,
                type: 'english',
                emoji: word.emoji,
                isFlipped: false,
                isMatched: false,
                pairContent: word.chinese
            });
            newCards.push({
                id: `chinese-${word.id}`,
                content: word.chinese,
                matchId: word.id,
                type: 'chinese',
                emoji: word.emoji,
                isFlipped: false,
                isMatched: false,
                pairContent: word.english
            });
        });

        const shuffledCards = [...newCards].sort(() => Math.random() - 0.5);
        shuffledCards.forEach(card => {
            flipAnimations.current[card.id] = new Animated.Value(0);
        });

        setCards(shuffledCards);
        setFirstCard(null);
        setSecondCard(null);
        setLockBoard(false);
        setGameStarted(false);
        setTimer(0);
        setMoves(0);
        setMatches(0);
        setScore(0);
        setShowResult(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startGame = () => {
        if (gameStarted) return;
        setGameStarted(true);
        timerRef.current = setInterval(() => {
            setTimer(prev => prev + 1);
        }, 1000);
    };

    const handleCardPress = (card: Card) => {
        if (!gameStarted) {
            Alert.alert('hint', 'Please click the "Start Game" button first!');
            return;
        }
        if (lockBoard || card.isFlipped || card.isMatched) return;

        flipCard(card, true);

        if (!firstCard) {
            setFirstCard(card);
            return;
        }

        setSecondCard(card);
        setLockBoard(true);
        setMoves(prev => prev + 1);

        setTimeout(() => {
            if (firstCard.matchId === card.matchId) {
                handleMatchSuccess(firstCard, card);
            } else {
                handleMatchFailure(firstCard, card);
            }
        }, 600);
    };

    const flipCard = (card: Card, show: boolean) => {
        const flipAnim = flipAnimations.current[card.id];
        if (!flipAnim) return;

        Animated.timing(flipAnim, {
            toValue: show ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setCards(prevCards =>
                prevCards.map(c =>
                    c.id === card.id ? { ...c, isFlipped: show } : c
                )
            );
        });
    };

    const handleMatchSuccess = (card1: Card, card2: Card) => {
        setCards(prevCards =>
            prevCards.map(c =>
                c.id === card1.id || c.id === card2.id ? { ...c, isMatched: true } : c
            )
        );
        const newMatches = matches + 1;
        setMatches(newMatches);
        const newScore = calculateScore();
        setScore(newScore);
        if (newMatches === totalPairs) {
            endGame(newScore);
        }
        resetBoard();
    };

    const handleMatchFailure = (card1: Card, card2: Card) => {
        setTimeout(() => {
            flipCard(card1, false);
            flipCard(card2, false);
            resetBoard();
        }, 1000);
    };

    const resetBoard = () => {
        setTimeout(() => {
            setFirstCard(null);
            setSecondCard(null);
            setLockBoard(false);
        }, 300);
    };

    const calculateScore = () => {
        const timeBonus = Math.max(500 - timer * 5, 100);
        const movesBonus = Math.max(300 - moves * 3, 50);
        const matchesBonus = matches * 100;
        return timeBonus + movesBonus + matchesBonus;
    };

    const endGame = (finalScore: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        saveHighScore(finalScore);
        setShowResult(true);
    };

    const showHint = () => {
        if (!gameStarted) {
            Alert.alert('hint', 'Please click the "Start Game" button first!');
            return;
        }
        const unmatchedCards = cards.filter(card => !card.isMatched && !card.isFlipped);
        unmatchedCards.forEach(card => flipCard(card, true));
        setTimeout(() => {
            unmatchedCards.forEach(card => {
                if (!card.isMatched) flipCard(card, false);
            });
        }, 1500);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
    };

    const renderCard = (card: Card) => {
        const flipAnim = flipAnimations.current[card.id] || new Animated.Value(0);

        const frontAnimatedStyle = {
            transform: [{
                rotateY: flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                })
            }]
        };

        const backAnimatedStyle = {
            transform: [{
                rotateY: flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['180deg', '360deg']
                })
            }]
        };

        return (
            <TouchableOpacity
                key={card.id}
                style={[styles.cardContainer, card.isMatched && styles.matchedCard]}
                onPress={() => handleCardPress(card)}
                disabled={card.isMatched || lockBoard}
            >
                <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
                    <Text style={styles.questionMark}>?</Text>
                </Animated.View>
                <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
                    <Text style={styles.emoji}>{card.emoji}</Text>
                    <Text style={styles.cardText}>{card.content}</Text>
                    <Text style={styles.pairText}>{card.pairContent}</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🔤 Word Matching Game</Text>
            </View>

            <View style={styles.gameInfo}>
                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Time</Text>
                    <Text style={styles.infoValue}>{formatTime(timer)}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Moves</Text>
                    <Text style={styles.infoValue}>{moves}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Pairs</Text>
                    <Text style={styles.infoValue}>{matches}/{totalPairs}</Text>
                </View>
            </View>

            <View style={styles.difficultyContainer}>
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                    <TouchableOpacity
                        key={level}
                        style={[styles.difficultyButton, difficulty === level && styles.difficultyButtonActive]}
                        onPress={() => setDifficulty(level)}
                        disabled={gameStarted}
                    >
                        <Text style={[styles.difficultyButtonText, difficulty === level && styles.difficultyButtonTextActive]}>
                            {level === 'easy' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.gameBoard} contentContainerStyle={styles.gameBoardContent}>
                <View style={styles.cardsGrid}>
                    {cards.map(card => renderCard(card))}
                </View>
            </ScrollView>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.controlButton, !gameStarted ? styles.startButton : styles.resetButton]}
                    onPress={gameStarted ? initializeCards : startGame}
                >
                    <Ionicons name={gameStarted ? "refresh" : "play"} size={20} color="white" />
                    <Text style={styles.controlButtonText}>{gameStarted ? "Restart" : "Start Game"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, styles.hintButton]}
                    onPress={showHint}
                    disabled={!gameStarted}
                >
                    <Ionicons name="bulb" size={20} color="#666" />
                    <Text style={[styles.controlButtonText, styles.hintButtonText]}>Hint</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.highScoreContainer}>
                <Ionicons name="trophy" size={16} color="#FFD700" />
                <Text style={styles.highScoreText}>High Score: {highScore}</Text>
            </View>

            <Modal visible={showResult} transparent animationType="slide">
                <View style={styles.resultModal}>
                    <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>🎉 Congratulations!</Text>
                        <Text style={styles.resultScore}>Score: {score}</Text>
                        <Text style={styles.resultTime}>Time: {formatTime(timer)}</Text>
                        <Text style={styles.resultMoves}>Moves: {moves}</Text>
                        <View style={styles.resultButtons}>
                            <TouchableOpacity
                                style={[styles.resultButton, styles.playAgainButton]}
                                onPress={() => {
                                    setShowResult(false);
                                    initializeCards();
                                }}
                            >
                                <Text style={styles.playAgainButtonText}>Play Again</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        padding: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    gameInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    infoBox: {
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2575fc',
    },
    difficultyContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 10,
    },
    difficultyButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
    },
    difficultyButtonActive: {
        backgroundColor: '#2575fc',
    },
    difficultyButtonText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    difficultyButtonTextActive: {
        color: 'white',
    },
    gameBoard: {
        flex: 1,
        marginBottom: 20,
    },
    gameBoardContent: {
        flexGrow: 1,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 8,
        overflow: 'hidden',
    },
    card: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        backfaceVisibility: 'hidden',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    cardFront: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#ddd',
    },
    cardBack: {
        backgroundColor: '#2575fc',
    },
    matchedCard: {
        opacity: 0.5,
    },
    questionMark: {
        fontSize: 32,
        color: '#666',
    },
    emoji: {
        fontSize: 28,
        marginBottom: 8,
    },
    cardText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 4,
    },
    pairText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20,
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        minWidth: 120,
    },
    startButton: {
        backgroundColor: '#2575fc',
    },
    resetButton: {
        backgroundColor: '#ff6b6b',
    },
    hintButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#ddd',
    },
    controlButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginLeft: 8,
    },
    hintButtonText: {
        color: '#666',
    },
    highScoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    highScoreText: {
        fontSize: 14,
        color: '#666',
    },
    resultModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    resultContent: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 30,
        width: '90%',
        alignItems: 'center',
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2575fc',
        marginBottom: 20,
    },
    resultScore: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    resultTime: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    resultMoves: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    resultButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    resultButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    playAgainButton: {
        backgroundColor: '#2575fc',
    },
    playAgainButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});

export default MatchingGame;