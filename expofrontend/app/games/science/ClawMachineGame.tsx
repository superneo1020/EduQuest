// app/games/science/ClawMachineGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    Alert,
    Animated,
    Platform,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

// 像素風格配置
const MACHINE_WIDTH = Math.min(380, screenWidth - 40);
const GAME_WIDTH = MACHINE_WIDTH - 40;
const GAME_HEIGHT = 240;

// 動物類型定義（只有動物）
interface AnimalType {
    name: string;
    icon: string;
    width: number;
    height: number;
    isAnimal: boolean;
}

const ANIMAL_TYPES: AnimalType[] = [
    { name: 'Bear', icon: '🐻', width: 44, height: 52, isAnimal: true },
    { name: 'Bunny', icon: '🐰', width: 44, height: 56, isAnimal: true },
    { name: 'Penguin', icon: '🐧', width: 48, height: 46, isAnimal: true },
    { name: 'Dinosaur', icon: '🦕', width: 48, height: 52, isAnimal: true },
    { name: 'Fox', icon: '🦊', width: 44, height: 52, isAnimal: true },
    { name: 'Panda', icon: '🐼', width: 44, height: 52, isAnimal: true },
    { name: 'Koala', icon: '🐨', width: 44, height: 52, isAnimal: true },
    { name: 'Monkey', icon: '🐒', width: 44, height: 52, isAnimal: true },
    { name: 'Elephant', icon: '🐘', width: 48, height: 52, isAnimal: true },
    { name: 'Giraffe', icon: '🦒', width: 48, height: 56, isAnimal: true },
];

// 非動物物品（干擾物）
const NON_ANIMAL_TYPES: AnimalType[] = [
    { name: 'Rock', icon: '🪨', width: 40, height: 40, isAnimal: false },
    { name: 'Tree', icon: '🌲', width: 40, height: 48, isAnimal: false },
    { name: 'Flower', icon: '🌸', width: 38, height: 42, isAnimal: false },
    { name: 'Star', icon: '⭐', width: 40, height: 40, isAnimal: false },
    { name: 'Cloud', icon: '☁️', width: 48, height: 32, isAnimal: false },
];

interface Item {
    id: number;
    type: AnimalType;
    x: number;
    y: number;
    caught: boolean;
    isAnimal: boolean;
}

const ClawMachineGame: React.FC = () => {
    const navigation = useNavigation();

    // 遊戲狀態
    const [items, setItems] = useState<Item[]>([]);
    const [collectedAnimals, setCollectedAnimals] = useState<Item[]>([]);
    const [score, setScore] = useState<number>(100);
    const [clawX, setClawX] = useState<number>((GAME_WIDTH - 36) / 2);
    const [isDropping, setIsDropping] = useState<boolean>(false);
    const [moveInterval, setMoveInterval] = useState<NodeJS.Timeout | null>(null);
    const [leftPressed, setLeftPressed] = useState<boolean>(false);
    const [rightPressed, setRightPressed] = useState<boolean>(false);
    const [isSuction, setIsSuction] = useState<boolean>(false);
    const [suctionItem, setSuctionItem] = useState<Item | null>(null);
    const [gameOver, setGameOver] = useState<boolean>(false);

    // 動畫值
    const dropAnim = useRef(new Animated.Value(0)).current;
    const clawScaleAnim = useRef(new Animated.Value(1)).current;
    const suctionAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scoreAnim = useRef(new Animated.Value(1)).current;

    // 計算正確動物總數
    const totalAnimals = items.filter(i => i.isAnimal).length;
    const remainingAnimals = items.filter(i => i.isAnimal && !i.caught).length;
    const correctCatches = collectedAnimals.filter(a => a.isAnimal).length;

    // 初始化物品（混合動物和非動物）
    useEffect(() => {
        initializeItems();
    }, []);

    const initializeItems = () => {
        const newItems: Item[] = [];
        const itemCount = 8; // 總共8個物品
        const startX = 12;
        const bottomY = GAME_HEIGHT - 70;
        const spacingX = (GAME_WIDTH - 24) / itemCount;

        // 隨機選擇4-5個動物
        const shuffledAnimals = [...ANIMAL_TYPES].sort(() => 0.5 - Math.random());
        const animalCount = 5; // 5個動物
        const nonAnimalCount = itemCount - animalCount; // 3個非動物

        // 添加動物
        for (let i = 0; i < animalCount; i++) {
            const animalType = shuffledAnimals[i % shuffledAnimals.length];
            newItems.push({
                id: i,
                type: animalType,
                x: startX + i * spacingX + (Math.random() - 0.5) * 8,
                y: bottomY + (Math.random() - 0.5) * 6,
                caught: false,
                isAnimal: true,
            });
        }

        // 添加非動物干擾物
        const shuffledNonAnimals = [...NON_ANIMAL_TYPES].sort(() => 0.5 - Math.random());
        for (let i = 0; i < nonAnimalCount; i++) {
            const nonAnimalType = shuffledNonAnimals[i % shuffledNonAnimals.length];
            newItems.push({
                id: animalCount + i,
                type: nonAnimalType,
                x: startX + (animalCount + i) * spacingX + (Math.random() - 0.5) * 8,
                y: bottomY + (Math.random() - 0.5) * 6,
                caught: false,
                isAnimal: false,
            });
        }

        // 隨機打亂順序
        setItems(newItems.sort(() => 0.5 - Math.random()));
        setScore(100);
        setCollectedAnimals([]);
        setGameOver(false);
    };

    // 脈衝動畫
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // 分數變化動畫
    const animateScore = () => {
        Animated.sequence([
            Animated.timing(scoreAnim, {
                toValue: 1.3,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scoreAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // 持續移動邏輯
    useEffect(() => {
        if (leftPressed && !isDropping && !gameOver) {
            const interval = setInterval(() => {
                setClawX(prev => Math.max(8, prev - 8));
            }, 50);
            setMoveInterval(interval);
            return () => clearInterval(interval);
        } else if (rightPressed && !isDropping && !gameOver) {
            const interval = setInterval(() => {
                setClawX(prev => Math.min(GAME_WIDTH - 44, prev + 8));
            }, 50);
            setMoveInterval(interval);
            return () => clearInterval(interval);
        } else if (moveInterval) {
            clearInterval(moveInterval);
            setMoveInterval(null);
        }
    }, [leftPressed, rightPressed, isDropping, gameOver]);

    // 清理定時器
    useEffect(() => {
        return () => {
            if (moveInterval) clearInterval(moveInterval);
        };
    }, [moveInterval]);

    // 吸附動畫
    useEffect(() => {
        if (isSuction && suctionItem) {
            Animated.sequence([
                Animated.timing(suctionAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(suctionAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isSuction]);

    // 檢查吸附
    const checkSuction = (): Item | null => {
        const clawCenterX = clawX + 18;
        const clawBottomY = GAME_HEIGHT - 20;

        for (const item of items) {
            if (item.caught) continue;

            const itemCenterX = item.x + item.type.width / 2;
            const itemCenterY = item.y + item.type.height / 2;
            const distance = Math.sqrt(
                Math.pow(clawCenterX - itemCenterX, 2) +
                Math.pow(clawBottomY - itemCenterY, 2)
            );

            if (distance < 42) {
                return item;
            }
        }
        return null;
    };

    // 處理抓取結果
    const handleCatch = (caughtItem: Item) => {
        let newScore = score;
        let message = '';
        let isCorrect = false;

        if (caughtItem.isAnimal) {
            // 抓到動物，加分
            newScore = Math.min(100, score + 10);
            message = `🎉 Correct! +10 points! You caught ${caughtItem.type.name}!`;
            isCorrect = true;
            animateScore();
        } else {
            // 抓到非動物，扣分
            newScore = Math.max(0, score - 10);
            message = `💔 Wrong! -10 points! ${caughtItem.type.name} is not an animal!`;
            isCorrect = false;
            animateScore();
        }

        setScore(newScore);

        // 收集物品
        setItems(prev => prev.map(i =>
            i.id === caughtItem.id ? { ...i, caught: true } : i
        ));

        if (caughtItem.isAnimal) {
            setCollectedAnimals(prev => [...prev, caughtItem]);
        }

        Alert.alert(isCorrect ? '✨ Correct! ✨' : '❌ Wrong! ❌', message);

        // 檢查遊戲結束條件
        const remainingAnimalsCount = items.filter(i => i.isAnimal && !i.caught && i.id !== caughtItem.id).length;
        const remainingNonAnimals = items.filter(i => !i.isAnimal && !i.caught && i.id !== caughtItem.id).length;

        if (newScore <= 0) {
            setGameOver(true);
            Alert.alert('💀 Game Over 💀', 'Your score reached 0! Try again!', [
                { text: 'Reset Game', onPress: resetGame }
            ]);
        } else if (remainingAnimalsCount === 0) {
            // 所有動物都抓完了
            const finalScore = newScore;
            setGameOver(true);
            Alert.alert(
                '🏆 Victory! 🏆',
                `You caught all animals!\nFinal Score: ${finalScore}/100`,
                [{ text: 'Play Again', onPress: resetGame }]
            );
        }
    };

    // 下降爪子
    const dropClaw = () => {
        if (isDropping || gameOver) return;

        setIsDropping(true);

        // 下降動畫
        Animated.timing(dropAnim, {
            toValue: 1,
            duration: 450,
            useNativeDriver: false,
        }).start();

        // 到達底部時檢查吸附
        setTimeout(() => {
            const caughtItem = checkSuction();

            if (caughtItem) {
                // 吸附效果
                setIsSuction(true);
                setSuctionItem(caughtItem);

                // 抓取動畫
                Animated.sequence([
                    Animated.timing(clawScaleAnim, {
                        toValue: 1.4,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(clawScaleAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ]).start();

                // 處理抓取結果
                setTimeout(() => {
                    handleCatch(caughtItem);
                    setIsSuction(false);
                    setSuctionItem(null);
                }, 200);
            } else {
                Alert.alert('💨 Missed!', 'Position the claw above an item!');
            }

            // 上升動畫
            setTimeout(() => {
                Animated.timing(dropAnim, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: false,
                }).start();

                setTimeout(() => {
                    setIsDropping(false);
                }, 350);
            }, 800);
        }, 450);
    };

    // 重置遊戲
    const resetGame = () => {
        initializeItems();
        setClawX((GAME_WIDTH - 36) / 2);
        setIsDropping(false);
        setIsSuction(false);
        setSuctionItem(null);
        setGameOver(false);
        dropAnim.setValue(0);
    };

    const dropHeight = dropAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, GAME_HEIGHT - 55],
    });

    const clawScale = clawScaleAnim;
    const suctionScale = suctionAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.2, 1],
    });

    const scoreScale = scoreAnim;

    return (
        <SafeAreaView style={styles.container}>
            {/* 標題和分數區域 */}
            <View style={styles.header}>
                <Text style={styles.title}>🐾 ANIMAL CATCHER 🐾</Text>
                <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scoreScale }] }]}>
                    <Text style={styles.scoreLabel}>SCORE</Text>
                    <Text style={[styles.scoreValue, score < 30 && styles.scoreLow, score === 100 && styles.scorePerfect]}>
                        {score}
                    </Text>
                    <Text style={styles.scoreMax}>/100</Text>
                </Animated.View>
            </View>

            {/* 收集盒 - 只顯示抓到的動物 */}
            <View style={styles.collectionBox}>
                <Text style={styles.collectionLabel}>
                    🎯 COLLECTED ANIMALS ({correctCatches}/{totalAnimals})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionContent}>
                    {collectedAnimals.map((animal, index) => (
                        <View key={index} style={styles.collectedAnimal}>
                            <Text style={styles.collectedAnimalIcon}>{animal.type.icon}</Text>
                            <Text style={styles.collectedAnimalName}>{animal.type.name}</Text>
                        </View>
                    ))}
                    {collectedAnimals.length === 0 && (
                        <Text style={styles.emptyCollection}>✨ CATCH THE ANIMALS ✨</Text>
                    )}
                </ScrollView>
            </View>

            {/* 夾公仔機主體 */}
            <View style={styles.machineContainer}>
                <View style={styles.machineBody}>
                    {/* 機器頂部軌道 */}
                    <View style={styles.machineTop}>
                        <View style={styles.railHorizontal} />
                        <View style={styles.railVertical} />
                        <Text style={styles.machineLabel}>ANIMAL CATCHER</Text>
                    </View>

                    {/* 遊戲區域 */}
                    <View style={styles.gameArea}>
                        {/* 背景 */}
                        <View style={styles.gameBackground}>
                            <View style={styles.gridPattern} />
                        </View>

                        {/* 物品 */}
                        {items.map(item => !item.caught && (
                            <Animated.View
                                key={item.id}
                                style={[
                                    styles.item,
                                    {
                                        left: item.x,
                                        top: item.y,
                                        width: item.type.width,
                                        height: item.type.height,
                                        transform: [{
                                            scale: suctionItem?.id === item.id && isSuction ? suctionScale : 1
                                        }],
                                        borderColor: item.isAnimal ? '#4caf50' : '#e74c3c',
                                        backgroundColor: item.isAnimal ? 'rgba(76, 175, 80, 0.15)' : 'rgba(231, 76, 60, 0.1)',
                                    }
                                ]}
                            >
                                <Text style={styles.itemIcon}>{item.type.icon}</Text>
                                <Text style={styles.itemName}>{item.type.name}</Text>
                                {!item.isAnimal && (
                                    <View style={styles.warningBadge}>
                                        <Text style={styles.warningText}>⚠️</Text>
                                    </View>
                                )}
                            </Animated.View>
                        ))}

                        {/* 繩子 */}
                        <Animated.View
                            style={[
                                styles.rope,
                                {
                                    left: clawX + 16,
                                    height: dropHeight,
                                }
                            ]}
                        />

                        {/* 爪子 */}
                        <Animated.View
                            style={[
                                styles.claw,
                                {
                                    left: clawX,
                                    top: Animated.add(dropHeight, 15),
                                    transform: [{ scale: clawScale }]
                                }
                            ]}
                        >
                            <View style={styles.clawTop}>
                                <Text style={styles.clawIcon}>🦾</Text>
                            </View>
                            <View style={styles.clawArms}>
                                <View style={styles.clawArm} />
                                <View style={styles.clawArm} />
                                <View style={styles.clawArm} />
                            </View>

                            {/* 吸附效果 */}
                            {isSuction && suctionItem && (
                                <Animated.View style={[styles.suctionEffect, { transform: [{ scale: suctionScale }] }]}>
                                    <Text style={styles.suctionText}>⚡</Text>
                                </Animated.View>
                            )}
                        </Animated.View>

                        {/* 底部吸力區域提示 */}
                        <View style={styles.suctionZone}>
                            <Text style={styles.suctionZoneText}>⬇️ CATCH ZONE ⬇️</Text>
                        </View>
                    </View>
                </View>

                {/* 控制面板 */}
                <View style={styles.controlPanel}>
                    <View style={styles.controlButtons}>
                        <TouchableOpacity
                            style={[styles.controlBtn, styles.leftBtn]}
                            onPressIn={() => setLeftPressed(true)}
                            onPressOut={() => setLeftPressed(false)}
                            disabled={isDropping || gameOver}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.btnText}>◀</Text>
                        </TouchableOpacity>

                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <TouchableOpacity
                                style={[styles.controlBtn, styles.grabBtn]}
                                onPress={dropClaw}
                                disabled={isDropping || gameOver}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.grabBtnText}>⚡ CATCH ⚡</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        <TouchableOpacity
                            style={[styles.controlBtn, styles.rightBtn]}
                            onPressIn={() => setRightPressed(true)}
                            onPressOut={() => setRightPressed(false)}
                            disabled={isDropping || gameOver}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.btnText}>▶</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.bottomBar}>
                        <TouchableOpacity style={styles.resetBtn} onPress={resetGame}>
                            <Text style={styles.resetBtnText}>⟳ RESET</Text>
                        </TouchableOpacity>

                        <View style={styles.hintBox}>
                            <Text style={styles.hintText}>🐾 CATCH ANIMALS ONLY!</Text>
                            <Text style={styles.hintSubtext}>⚡ +10 points | 🚫 -10 points</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* 遊戲結束畫面 */}
            {gameOver && (
                <View style={styles.gameOverlay}>
                    <View style={styles.gameOverCard}>
                        <Text style={styles.gameOverEmoji}>{score === 100 ? '🏆' : score <= 0 ? '💀' : '🎮'}</Text>
                        <Text style={styles.gameOverTitle}>
                            {score === 100 ? 'PERFECT SCORE!' : score <= 0 ? 'GAME OVER!' : 'GAME COMPLETE!'}
                        </Text>
                        <Text style={styles.gameOverScore}>Final Score: {score}/100</Text>
                        <Text style={styles.gameOverStats}>
                            Animals caught: {correctCatches}/{totalAnimals}
                        </Text>
                        <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
                            <Text style={styles.playAgainText}>PLAY AGAIN</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e3a2f',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: MACHINE_WIDTH,
        marginBottom: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffdd88',
        backgroundColor: '#3a2a1f',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
        letterSpacing: 1,
    },
    scoreContainer: {
        backgroundColor: '#2d2b1f',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'baseline',
        borderWidth: 2,
        borderColor: '#ffaa44',
    },
    scoreLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ffaa44',
        marginRight: 6,
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffdd88',
    },
    scoreMax: {
        fontSize: 12,
        color: '#c9a87b',
        marginLeft: 2,
    },
    scoreLow: {
        color: '#ff6666',
    },
    scorePerfect: {
        color: '#88ff88',
        textShadowColor: '#00aa00',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
    },
    collectionBox: {
        width: MACHINE_WIDTH,
        backgroundColor: '#2d2b1f',
        borderRadius: 12,
        marginBottom: 10,
        padding: 10,
        borderWidth: 2,
        borderColor: '#c9a87b',
    },
    collectionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#ffdd88',
        marginBottom: 8,
        textAlign: 'center',
    },
    collectionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 70,
    },
    collectedAnimal: {
        width: 60,
        height: 70,
        backgroundColor: '#f0e6d0',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        borderWidth: 2,
        borderColor: '#4caf50',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        padding: 4,
    },
    collectedAnimalIcon: {
        fontSize: 32,
    },
    collectedAnimalName: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
        color: '#57280f',
    },
    emptyCollection: {
        fontSize: 12,
        color: '#c9a87b',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
        textAlign: 'center',
        flex: 1,
    },
    machineContainer: {
        width: MACHINE_WIDTH,
        backgroundColor: '#2d2b1f',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#c9a87b',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    machineBody: {
        backgroundColor: '#7fcfed',
        height: 360,
        position: 'relative',
    },
    machineTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 70,
        backgroundColor: '#70f7f3',
        zIndex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    railHorizontal: {
        position: 'absolute',
        top: 25,
        left: 0,
        right: 0,
        height: 8,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#33a5da',
    },
    railVertical: {
        position: 'absolute',
        top: 0,
        left: (MACHINE_WIDTH - 8) / 2,
        width: 8,
        height: 70,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#33a5da',
    },
    machineLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#33a5da',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    gameArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 290,
        backgroundColor: '#def7f6',
        overflow: 'visible',
    },
    gameBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f9e5b3',
    },
    gridPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.3,
        backgroundColor: '#d4a373',
    },
    rope: {
        position: 'absolute',
        width: 4,
        backgroundColor: '#8B4513',
        borderRadius: 2,
        top: -45,
    },
    claw: {
        position: 'absolute',
        width: 36,
        height: 48,
        zIndex: 10,
    },
    clawTop: {
        width: 24,
        height: 14,
        backgroundColor: '#c0c0c0',
        borderRadius: 6,
        marginLeft: 6,
        borderWidth: 1,
        borderColor: '#8b6946',
        alignItems: 'center',
    },
    clawIcon: {
        fontSize: 12,
    },
    clawArms: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 2,
    },
    clawArm: {
        width: 10,
        height: 28,
        backgroundColor: '#a0a0a0',
        borderRadius: 4,
        marginHorizontal: 1,
        borderWidth: 1,
        borderColor: '#6b4c3b',
    },
    suctionEffect: {
        position: 'absolute',
        top: -15,
        left: 8,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    suctionText: {
        fontSize: 18,
        color: '#ff66aa',
    },
    item: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 248, 225, 0.95)',
        borderRadius: 10,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
        padding: 4,
    },
    itemIcon: {
        fontSize: 28,
    },
    itemName: {
        fontSize: 9,
        marginTop: 2,
        fontWeight: '500',
        color: '#57280f',
    },
    warningBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#e74c3c',
        borderRadius: 12,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    warningText: {
        fontSize: 10,
        color: '#fff',
    },
    suctionZone: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 35,
        backgroundColor: 'rgba(76, 175, 80, 0.25)',
        borderTopWidth: 2,
        borderTopColor: '#4caf50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    suctionZoneText: {
        fontSize: 10,
        color: '#2e7d32',
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    controlPanel: {
        backgroundColor: '#3a94b7',
        padding: 10,
        borderTopWidth: 2,
        borderTopColor: '#c9a87b',
    },
    controlButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    controlBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    leftBtn: {
        backgroundColor: '#3498db',
    },
    rightBtn: {
        backgroundColor: '#3498db',
    },
    grabBtn: {
        width: 100,
        backgroundColor: '#4caf50',
    },
    btnText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    grabBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    resetBtn: {
        backgroundColor: '#57280f',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ffaa44',
    },
    resetBtnText: {
        color: '#ffaa44',
        fontSize: 11,
        fontWeight: 'bold',
    },
    hintBox: {
        alignItems: 'flex-end',
    },
    hintText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    hintSubtext: {
        color: '#ffdd88',
        fontSize: 9,
        marginTop: 2,
    },
    gameOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    gameOverCard: {
        backgroundColor: '#2d2b1f',
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#ffaa44',
        minWidth: 260,
    },
    gameOverEmoji: {
        fontSize: 64,
        marginBottom: 12,
    },
    gameOverTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffaa44',
        marginBottom: 8,
        fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
        textAlign: 'center',
    },
    gameOverScore: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    gameOverStats: {
        fontSize: 12,
        color: '#c9a87b',
        marginBottom: 20,
    },
    playAgainBtn: {
        backgroundColor: '#ffaa44',
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 25,
    },
    playAgainText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#57280f',
    },
});

export default ClawMachineGame;