// science/HumanBodyGame.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Modal,
    useWindowDimensions,
    Platform,
    Animated,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '@/src/auth/AuthContext';

// 檢測是否是網頁環境
const isWeb = Platform.OS === 'web';

const HumanBodyGame = () => {
    const navigation = useNavigation();
    const { token } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const { width, height } = useWindowDimensions();
    const [isPortrait, setIsPortrait] = useState(height > width);

    // ========== 🕒 新增：計時器相關狀態 ==========
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());

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
        startTimeRef.current = Date.now();
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

    // 開始遊戲時啟動計時器
    useEffect(() => {
        startTimer();
        return () => {
            stopTimer();
        };
    }, []);

    // 器官圖片引用
    const organImages = {
        heart: require('../../../../assets/images/organs/heart.png'),
        largeIntestine: require('../../../../assets/images/organs/large-intestine.png'),
        lung: require('../../../../assets/images/organs/lung.png'),
        liver: require('../../../../assets/images/organs/liver.png'),
        brain: require('../../../../assets/images/organs/brain.png'),
        stomach: require('../../../../assets/images/organs/stomach.png'),
    };

    // 監聽屏幕方向變化
    useEffect(() => {
        const updateLayout = () => {
            const { width: w, height: h } = Dimensions.get('window');
            setIsPortrait(h > w);
        };

        const dimensionsHandler = Dimensions.addEventListener('change', updateLayout);

        return () => {
            dimensionsHandler?.remove();
        };
    }, []);

    // 根據屏幕方向計算位置和尺寸
    const calculateLayout = () => {
        const screenWidth = width;
        const screenHeight = height;

        if (isWeb && !isPortrait) {
            // 網頁橫屏：左右佈局 - 人體圖在左，器官在右
            const bodyWidth = Math.min(screenWidth * 0.4, 500);
            const bodyHeight = Math.min(screenHeight * 0.75, 700);
            const bodyLeft = screenWidth * 0.05;
            const bodyTop = screenHeight * 0.1;

            const organAreaLeft = bodyLeft + bodyWidth + 20;
            const organAreaTop = bodyTop;
            const organAreaWidth = Math.min(screenWidth - organAreaLeft - 10, 500);

            return {
                bodyOutline: {
                    width: bodyWidth,
                    height: bodyHeight,
                    left: bodyLeft,
                    top: bodyTop,
                },
                organArea: {
                    left: organAreaLeft,
                    top: organAreaTop,
                    width: organAreaWidth,
                    height: bodyHeight * 0.8,
                },
                grid: {
                    rows: 10,
                    cols: 8,
                    cellWidth: bodyWidth / 8,
                    cellHeight: bodyHeight / 10
                },
                organSize: {
                    heart: { width: 70, height: 60 },
                    largeIntestine: { width: 110, height: 40 },
                    lung: { width: 90, height: 75 },
                    liver: { width: 80, height: 60 },
                    brain: { width: 90, height: 65 },
                    stomach: { width: 70, height: 50 },
                },
                organCardSize: {
                    width: organAreaWidth * 0.48,
                    height: 100,
                }
            };
        } else if (isWeb && isPortrait) {
            const bodyWidth = Math.min(screenWidth * 0.85, 400);
            const bodyHeight = Math.min(screenHeight * 0.35, 350);
            const bodyLeft = (screenWidth - bodyWidth) / 2;
            const bodyTop = screenHeight * 0.15;

            const organAreaTop = bodyTop + bodyHeight + 20;
            const organAreaHeight = 'auto' as const;

            return {
                bodyOutline: {
                    width: bodyWidth,
                    height: bodyHeight,
                    left: bodyLeft,
                    top: bodyTop,
                },
                organArea: {
                    left: bodyLeft,
                    top: organAreaTop,
                    width: bodyWidth,
                    height: organAreaHeight,
                },
                grid: {
                    rows: 8,
                    cols: 6,
                    cellWidth: bodyWidth / 6,
                    cellHeight: bodyHeight / 8
                },
                organSize: {
                    heart: { width: 60, height: 55 },
                    largeIntestine: { width: 95, height: 35 },
                    lung: { width: 80, height: 65 },
                    liver: { width: 70, height: 55 },
                    brain: { width: 80, height: 60 },
                    stomach: { width: 65, height: 45 },
                },
                organCardSize: {
                    width: bodyWidth / 3 - 12,
                    height: 95,
                }
            };
        } else {
            const bodyWidth = screenWidth * 0.85;
            const bodyHeight = screenHeight * 0.4;
            const bodyLeft = screenWidth * 0.075;
            const bodyTop = screenHeight * 0.12;

            const organAreaTop = bodyTop + bodyHeight + 15;
            const organAreaHeight = screenHeight - organAreaTop - 15;

            return {
                bodyOutline: {
                    width: bodyWidth,
                    height: bodyHeight,
                    left: bodyLeft,
                    top: bodyTop,
                },
                organArea: {
                    left: bodyLeft,
                    top: organAreaTop,
                    width: bodyWidth,
                    height: organAreaHeight,
                },
                grid: {
                    rows: 8,
                    cols: 6,
                    cellWidth: bodyWidth / 6,
                    cellHeight: bodyHeight / 8
                },
                organSize: {
                    heart: { width: 60, height: 55 },
                    largeIntestine: { width: 95, height: 35 },
                    lung: { width: 80, height: 65 },
                    liver: { width: 70, height: 55 },
                    brain: { width: 80, height: 60 },
                    stomach: { width: 65, height: 45 },
                },
                organCardSize: {
                    width: bodyWidth / 3 - 12,
                    height: 95,
                }
            };
        }
    };

    const layout = calculateLayout();
    const { rows, cols, cellWidth, cellHeight } = layout.grid;

    // 器官數據
    const organs = useMemo(() => [
        {
            id: 1,
            name: 'Heart',
            image: organImages.heart,
            description: 'Responsible for pumping blood throughout the body',
            gridPosition: { row: 2, col: 4 },
            ...layout.organSize.heart,
            hint: 'Located in the middle left of the chest cavity'
        },
        {
            id: 2,
            name: 'Large Intestine',
            image: organImages.largeIntestine,
            description: 'Absorbs water and forms feces',
            gridPosition: { row: 4, col: 3 },
            ...layout.organSize.largeIntestine,
            hint: 'Located in the abdomen, surrounding the small intestine'
        },
        {
            id: 3,
            name: 'Lung',
            image: organImages.lung,
            description: 'Perform gas exchange, breathing',
            gridPosition: { row: 2, col: 3 },
            ...layout.organSize.lung,
            hint: 'Located in the chest cavity on both sides'
        },
        {
            id: 4,
            name: 'Liver',
            image: organImages.liver,
            description: 'Detoxify, metabolize, and store nutrients',
            gridPosition: { row: 3, col: 4 },
            ...layout.organSize.liver,
            hint: 'Located in the right upper abdomen'
        },
        {
            id: 5,
            name: 'Brain',
            image: organImages.brain,
            description: 'Controls body activities and thinking',
            gridPosition: { row: 0, col: 3 },
            ...layout.organSize.brain,
            hint: 'Located in the head'
        },
        {
            id: 6,
            name: 'Stomach',
            image: organImages.stomach,
            description: 'Digests food and secretes stomach acid',
            gridPosition: { row: 3, col: 3 },
            ...layout.organSize.stomach,
            hint: 'Located in the upper left abdomen'
        },
    ], [layout, organImages]);

    // 遊戲狀態
    const [selectedOrgan, setSelectedOrgan] = useState<number | null>(null);
    const [placedOrgans, setPlacedOrgans] = useState<{
        [key: number]: {
            row: number,
            col: number,
            isCorrect: boolean,
            gridPosition: { row: number, col: number }
        }
    }>({});
    const [organAnimations] = useState(() =>
        organs.reduce((acc, organ) => {
            acc[organ.id] = new Animated.Value(0);
            return acc;
        }, {} as { [key: number]: Animated.Value })
    );
    const [showGrid, setShowGrid] = useState(true);
    const [showCorrectPositions, setShowCorrectPositions] = useState(false);
    const [highlightedCells, setHighlightedCells] = useState<Array<{ row: number, col: number }>>([]);

    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [currentHint, setCurrentHint] = useState<string>('');
    const [currentOrganInfo, setCurrentOrganInfo] = useState<{ name: string; description: string; hint: string } | null>(null);

    // ========== 💾 保存分數到伺服器 ==========
    const saveScore = async (finalScore: number) => {
        if (!token) return;

        setIsSaving(true);
        try {
            await axios.post('http://localhost:8080/api/user/game/score', {
                gameName: "Human organs",
                scores: finalScore,
                difficulty: "ORGANS"
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

    useEffect(() => {
        if (gameCompleted) {
            // 遊戲完成時保存分數
            const totalOrgans = organs.length;
            const finalScoreValue = Math.round((correctCount / totalOrgans) * 100);
            saveScore(finalScoreValue);
        }
    }, [gameCompleted, correctCount, organs.length]);

    // 計算最終分數 (滿分100)
    const finalScore = useMemo(() => {
        const totalOrgans = organs.length;
        if (totalOrgans === 0) return 0;
        const score = (correctCount / totalOrgans) * 100;
        return Math.round(score);
    }, [correctCount, organs.length]);

    // 將網格坐標轉換為實際坐標
    const gridToPosition = (row: number, col: number) => {
        const bodyLeft = layout.bodyOutline.left;
        const bodyTop = layout.bodyOutline.top;

        return {
            x: bodyLeft + (col - 2) * cellWidth + cellWidth,
            y: bodyTop + (row - 2) * cellHeight + cellHeight
        };
    };

    // 處理器官卡片點擊（修改：顯示器官介紹，取消綠色提示）
    const handleOrganSelect = (organId: number) => {
        const organ = organs.find(o => o.id === organId);
        if (!organ || placedOrgans[organId]) return;

        setSelectedOrgan(organId);
        // 顯示器官名稱、介紹和提示
        setCurrentOrganInfo({
            name: organ.name,
            description: organ.description,
            hint: organ.hint
        });
        setCurrentHint(organ.hint);

        // 取消綠色提示：不再調用 getSuggestedCells，清空高亮
        setHighlightedCells([]);

        Animated.spring(organAnimations[organId], {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 3,
        }).start(() => {
            Animated.spring(organAnimations[organId], {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 3,
            }).start();
        });
    };

    // 移除 getSuggestedCells 函數（不再需要）

    // 處理網格點擊
    const handleGridClick = (row: number, col: number) => {
        if (!selectedOrgan) return;

        const organ = organs.find(o => o.id === selectedOrgan);
        if (!organ) return;

        if (row < 0 || row >= rows || col < 0 || col >= cols) return;

        const targetRow = organ.gridPosition.row;
        const targetCol = organ.gridPosition.col;
        const rowDistance = Math.abs(row - targetRow);
        const colDistance = Math.abs(col - targetCol);

        const isCorrect = (rowDistance <= 1 && colDistance <= 1);

        Animated.sequence([
            Animated.timing(organAnimations[selectedOrgan], {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(organAnimations[selectedOrgan], {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();

        setPlacedOrgans(prev => ({
            ...prev,
            [selectedOrgan]: {
                row,
                col,
                isCorrect,
                gridPosition: { row: targetRow, col: targetCol }
            }
        }));

        if (isCorrect) {
            setCorrectCount(prev => prev + 1);
        } else {
            setWrongCount(prev => prev + 1);
        }

        setSelectedOrgan(null);
        setCurrentHint('');
        setCurrentOrganInfo(null);
        setHighlightedCells([]);

        const newPlacedCount = Object.keys(placedOrgans).length + 1;
        if (newPlacedCount === organs.length) {
            stopTimer(); // 遊戲完成時停止計時器
            setGameCompleted(true);
        }
    };

    // 當屏幕方向改變時重置遊戲
    useEffect(() => {
        resetGame();
    }, [isPortrait]);

    // 重來按鈕功能
    const resetGame = () => {
        stopTimer(); // 重置時停止舊計時器
        setSelectedOrgan(null);
        setPlacedOrgans({});
        setCorrectCount(0);
        setWrongCount(0);
        setGameCompleted(false);
        setCurrentHint('');
        setCurrentOrganInfo(null);
        setHighlightedCells([]);

        Object.values(organAnimations).forEach(anim => {
            anim.setValue(0);
        });
        startTimer(); // 重新開始計時
    };

    // 返回上一頁
    const handleGoBack = () => {
        stopTimer();
        navigation.goBack();
    };

    // 返回主頁
    const handleGoHome = () => {
        stopTimer();
        navigation.navigate('science/index' as never);
    };

    // 如果遊戲完成，顯示報告頁面
    if (gameCompleted) {
        const totalTimeFormatted = formatTime(elapsedSeconds);
        return (
            <ScrollView style={styles.container}>
                <View style={styles.headerBarSimplified}>
                    <Text style={styles.headerTitle}>Human Organs</Text>
                </View>
                <Text style={styles.reportTitle}>Session Report 🎓</Text>
                <View style={styles.scoreCircle}>
                    <Text style={styles.scoreCircleNumber}>{finalScore}</Text>
                    <Text style={styles.scoreCircleLabel}>/ 100</Text>
                </View>

                {/* 新增：顯示總花費時間 */}
                <View style={styles.reportTimeBox}>
                    <Text style={styles.reportScoreLabel}>⏱️ Total Time</Text>
                    <Text style={styles.reportTimeValue}>{totalTimeFormatted}</Text>
                </View>

                <View style={styles.reportBox}>
                    <Text style={styles.summaryText}>
                        You correctly placed {correctCount} out of {organs.length} organs.
                        {wrongCount > 0 && ` ${wrongCount} organs were placed incorrectly.`}
                    </Text>
                </View>

                {/* 保存中指示器 */}
                {isSaving && (
                    <View style={styles.savingIndicator}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                        <Text style={styles.savingText}>同步分數中...</Text>
                    </View>
                )}

                <View style={styles.reportButtons}>
                    <TouchableOpacity style={styles.reportButton} onPress={resetGame}>
                        <Text style={styles.reportButtonText}>Play Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.reportButton, styles.backButton]} onPress={handleGoBack}>
                        <Text style={styles.reportButtonText}>difficulty select</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.reportButton, styles.homeButton]} onPress={handleGoHome}>
                        <Text style={styles.reportButtonText}>Home</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    // 計算器官卡片位置（網格佈局）
    const getOrganCardPosition = (index: number) => {
        const isWebLandscape = isWeb && !isPortrait;
        const cardSize = layout.organCardSize;

        if (isWebLandscape) {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const margin = 8;

            return {
                left: col * (cardSize.width + margin),
                top: row * (cardSize.height + 12),
                width: cardSize.width,
                height: cardSize.height,
            };
        } else {
            const col = index % 3;
            const row = Math.floor(index / 3);
            const margin = 6;

            return {
                left: col * (cardSize.width + margin),
                top: row * (cardSize.height + 10),
                width: cardSize.width,
                height: cardSize.height,
            };
        }
    };

    // 渲染網格
    const renderGrid = () => {
        const gridCells = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const isHighlighted = highlightedCells.some(cell =>
                    cell.row === row && cell.col === col
                );

                const hasOrgan = Object.entries(placedOrgans).some(([organId, pos]) =>
                    pos.row === row && pos.col === col
                );

                const isCorrectPosition = organs.some(organ =>
                    organ.gridPosition.row === row && organ.gridPosition.col === col
                );

                const cellPosition = gridToPosition(row, col);

                gridCells.push(
                    <TouchableOpacity
                        key={`${row}-${col}`}
                        style={[
                            styles.gridCell,
                            {
                                left: cellPosition.x - cellWidth / 2,
                                top: cellPosition.y - cellHeight / 2,
                                width: cellWidth,
                                height: cellHeight,
                            },
                            isHighlighted && styles.highlightedCell,
                            hasOrgan && styles.occupiedCell,
                        ]}
                        onPress={() => handleGridClick(row, col)}
                        activeOpacity={0.7}
                    >
                        {showGrid && (
                            <View style={[
                                styles.cellBorder,
                                isCorrectPosition && showCorrectPositions && styles.correctPositionBorder
                            ]}>
                                {__DEV__ && (
                                    <Text style={styles.gridCoordinate}>
                                        {row},{col}
                                    </Text>
                                )}
                            </View>
                        )}

                        {isCorrectPosition && showCorrectPositions && (
                            <View style={styles.correctPositionMarker}>
                                <Text style={styles.correctMarkerText}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            }
        }

        return gridCells;
    };

    // 渲染主要內容
    const renderContent = () => (
        <>
            {/* 修改：頂部欄帶計時器 */}
            <View style={styles.headerBarWithTimer}>
                <Text style={styles.headerTitle}>Understanding Human Organs</Text>
                <View style={styles.timerContainer}>
                    <Text style={styles.timerIcon}>⏱️</Text>
                    <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
                </View>
            </View>

            <View style={styles.controlBar}>
                <View style={styles.scoreBoard}>
                    <Text style={styles.scoreText}>Correct: {correctCount}</Text>
                    <Text style={styles.scoreText}>Wrong: {wrongCount}</Text>
                    <Text style={styles.scoreText}>Remaining: {organs.length - Object.keys(placedOrgans).length}</Text>
                </View>

                <View style={styles.modeButtons}>
                    <TouchableOpacity
                        style={[styles.modeButton, showGrid && styles.activeModeButton]}
                        onPress={() => setShowGrid(!showGrid)}
                    >
                        <Text style={[styles.modeButtonText, showGrid && styles.activeModeButtonText]}>
                            {showGrid ? 'Grid ✓' : 'Grid'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.modeButton, showCorrectPositions && styles.activeModeButton]}
                        onPress={() => setShowCorrectPositions(!showCorrectPositions)}
                    >
                        <Text style={[styles.modeButtonText, showCorrectPositions && styles.activeModeButtonText]}>
                            {showCorrectPositions ? 'Show ✓' : 'Show Positions'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 修改：顯示器官介紹區塊 */}
            {currentOrganInfo && (
                <View style={styles.selectionHint}>
                    <Text style={styles.selectionText}>Selected Organ: {currentOrganInfo.name}</Text>
                    <Text style={styles.descriptionText}>{currentOrganInfo.description}</Text>
                    <Text style={styles.hintText}>Hint: {currentOrganInfo.hint}</Text>
                    <Text style={styles.instructionText}>
                        Click on the grid to place the organ.
                    </Text>
                </View>
            )}

            <View style={styles.gameArea}>
                <View style={[
                    styles.bodyArea,
                    {
                        width: layout.bodyOutline.width,
                        height: layout.bodyOutline.height,
                        left: layout.bodyOutline.left,
                        top: layout.bodyOutline.top,
                    }
                ]}>
                    <Image
                        source={require('../../../../assets/images/organs/human-body-outline.png')}
                        style={styles.bodyOutlineImage}
                        resizeMode="contain"
                    />

                    {renderGrid()}

                    {Object.entries(placedOrgans).map(([organIdStr, position]) => {
                        const organId = parseInt(organIdStr);
                        const organ = organs.find(o => o.id === organId);
                        if (!organ) return null;

                        const pos = gridToPosition(position.row, position.col);

                        return (
                            <Animated.View
                                key={organId}
                                style={[
                                    styles.placedOrgan,
                                    {
                                        left: pos.x - organ.width / 2,
                                        top: pos.y - organ.height / 2,
                                        width: organ.width,
                                        height: organ.height,
                                        opacity: organAnimations[organId].interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 0.8]
                                        }),
                                        transform: [{
                                            scale: organAnimations[organId].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 1.15]
                                            })
                                        }]
                                    },
                                    position.isCorrect && styles.correctOrgan,
                                    !position.isCorrect && styles.wrongOrgan,
                                ]}
                            >
                                <Image
                                    source={organ.image}
                                    style={styles.placedOrganImage}
                                    resizeMode="contain"
                                />

                                <Text style={[
                                    styles.organNameLabel,
                                    position.isCorrect ? styles.correctLabel : styles.wrongLabel
                                ]}>
                                    {organ.name}
                                </Text>

                                {!position.isCorrect && showCorrectPositions && (
                                    <View style={[
                                        styles.correctArrow,
                                        {
                                            transform: [{
                                                rotate: Math.atan2(
                                                    organ.gridPosition.row - position.row,
                                                    organ.gridPosition.col - position.col
                                                ) + 'rad'
                                            }]
                                        }
                                    ]}>
                                        <Text style={styles.arrowText}>→</Text>
                                    </View>
                                )}
                            </Animated.View>
                        );
                    })}
                </View>

                <View style={[
                    styles.organSelectionArea,
                    {
                        left: layout.organArea.left,
                        top: layout.organArea.top,
                        width: layout.organArea.width,
                        height: layout.organArea.height === 'auto' ? undefined : layout.organArea.height,
                    }
                ]}>
                    <Text style={styles.organAreaTitle}>Click to select organ:</Text>

                    <View style={styles.organGrid}>
                        {organs.map((organ, index) => {
                            const isSelected = selectedOrgan === organ.id;
                            const isPlaced = placedOrgans[organ.id];
                            const cardPosition = getOrganCardPosition(index);

                            return (
                                <TouchableOpacity
                                    key={organ.id}
                                    style={[
                                        styles.organCard,
                                        cardPosition,
                                        isSelected && styles.selectedOrganCard,
                                        isPlaced && styles.placedOrganCard,
                                    ]}
                                    onPress={() => handleOrganSelect(organ.id)}
                                    disabled={!!isPlaced}
                                >
                                    <View style={styles.organCardContent}>
                                        <Animated.Image
                                            source={organ.image}
                                            style={[
                                                styles.organCardImage,
                                                {
                                                    opacity: isPlaced ? 0.5 : 1,
                                                    transform: [{
                                                        scale: organAnimations[organ.id].interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [1, 1.2]
                                                        })
                                                    }]
                                                }
                                            ]}
                                            resizeMode="contain"
                                        />
                                        <View style={styles.organCardInfo}>
                                            <Text style={[
                                                styles.organCardName,
                                                isPlaced && styles.placedOrganText
                                            ]}>
                                                {organ.name}
                                            </Text>
                                            <Text style={styles.organCardDescription}>
                                                {organ.description}
                                            </Text>
                                        </View>
                                    </View>
                                    {isPlaced && (
                                        <View style={[
                                            styles.placedBadge,
                                            isPlaced.isCorrect ? styles.correctBadge : styles.wrongBadge
                                        ]}>
                                            <Text style={styles.placedBadgeText}>
                                                {isPlaced.isCorrect ? '✓ Correct' : '✗ Wrong'}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                    <Text style={styles.resetButtonText}>Reset Game</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    if (isWeb) {
        return (
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
            >
                {renderContent()}
            </ScrollView>
        );
    }

    return (
        <View style={styles.container}>
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({
    // 網頁滾動容器
    scrollContainer: {
        flex: 1,
        backgroundColor: '#f0f7ff',
    },
    scrollContent: {
        padding: 12,
        minHeight: '100%',
        paddingBottom: 30,
    },
    // 原始容器
    container: {
        flex: 1,
        backgroundColor: '#f0f7ff',
        padding: 12,
    },
    // 簡化頂部欄（用於報告頁面）
    headerBarSimplified: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
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
    // 帶計時器的頂部欄
    headerBarWithTimer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 15,
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
    // 原有樣式繼續...
    controlBar: {
        flexDirection: isWeb ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        gap: isWeb ? 0 : 10,
    },
    scoreBoard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flexWrap: isWeb ? 'wrap' : 'nowrap',
    },
    scoreText: {
        fontSize: isWeb ? 15 : 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginHorizontal: isWeb ? 6 : 8,
        marginVertical: isWeb ? 2 : 0,
    },
    modeButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: isWeb ? 0 : 10,
    },
    modeButton: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#3498db',
    },
    activeModeButton: {
        backgroundColor: '#3498db',
    },
    modeButtonText: {
        fontSize: isWeb ? 15 : 14,
        fontWeight: '600',
        color: '#3498db',
    },
    activeModeButtonText: {
        color: 'white',
    },
    selectionHint: {
        backgroundColor: '#e8f4fc',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#3498db',
    },
    selectionText: {
        fontSize: isWeb ? 19 : 18,
        fontWeight: 'bold',
        color: '#1565c0',
        marginBottom: 5,
    },
    descriptionText: {
        fontSize: isWeb ? 16 : 15,
        color: '#2c3e50',
        marginBottom: 8,
        textAlign: 'center',
    },
    hintText: {
        fontSize: isWeb ? 16 : 15,
        color: '#e74c3c',
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: isWeb ? 15 : 14,
        color: '#546e7a',
        textAlign: 'center',
    },
    gameArea: {
        flex: isWeb ? 0 : 1,
        position: 'relative',
        marginBottom: 15,
        minHeight: isWeb ? 600 : undefined,
    },
    bodyArea: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 3,
        borderColor: '#3498db',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        overflow: 'visible',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyOutlineImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
        position: 'absolute',
        zIndex: 1,
    },
    gridCell: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: 'rgba(52, 152, 219, 0.3)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        zIndex: 2,
    },
    highlightedCell: {
        backgroundColor: 'rgba(46, 204, 113, 0.3)',
        borderColor: '#2ecc71',
        borderWidth: 2,
    },
    occupiedCell: {
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
    },
    cellBorder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    correctPositionBorder: {
        borderColor: '#2ecc71',
        borderWidth: 2,
    },
    gridCoordinate: {
        fontSize: 8,
        color: 'rgba(0,0,0,0.3)',
        fontWeight: 'bold',
    },
    correctPositionMarker: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#2ecc71',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
    },
    correctMarkerText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    organSelectionArea: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    organAreaTitle: {
        fontSize: isWeb ? 19 : 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    organGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        position: 'relative',
        minHeight: isWeb ? 250 : 350,
    },
    organCard: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    selectedOrganCard: {
        borderColor: '#3498db',
        backgroundColor: '#e8f4fc',
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    placedOrganCard: {
        borderColor: '#bdc3c7',
        backgroundColor: '#f8f9fa',
    },
    organCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    organCardImage: {
        width: isWeb ? 60 : 55,
        height: isWeb ? 60 : 55,
        marginRight: 12,
    },
    organCardInfo: {
        flex: 1,
    },
    organCardName: {
        fontSize: isWeb ? 17 : 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 4,
    },
    organCardDescription: {
        fontSize: isWeb ? 13 : 12,
        color: '#7f8c8d',
        marginBottom: 4,
    },
    placedOrganText: {
        color: '#95a5a6',
    },
    placedBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        minWidth: 70,
    },
    correctBadge: {
        backgroundColor: '#2ecc71',
    },
    wrongBadge: {
        backgroundColor: '#e74c3c',
    },
    placedBadgeText: {
        color: 'white',
        fontSize: isWeb ? 13 : 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    placedOrgan: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    placedOrganImage: {
        width: '100%',
        height: '100%',
    },
    correctOrgan: {
        borderWidth: 3,
        borderColor: '#2ecc71',
        borderRadius: 8,
    },
    wrongOrgan: {
        borderWidth: 3,
        borderColor: '#e74c3c',
        borderRadius: 8,
    },
    organNameLabel: {
        position: 'absolute',
        bottom: -25,
        fontSize: isWeb ? 14 : 13,
        fontWeight: 'bold',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 60,
        textAlign: 'center',
    },
    correctLabel: {
        color: '#27ae60',
        borderWidth: 1,
        borderColor: '#2ecc71',
    },
    wrongLabel: {
        color: '#e74c3c',
        borderWidth: 1,
        borderColor: '#e74c3c',
    },
    correctArrow: {
        position: 'absolute',
        top: -30,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        fontSize: 20,
        color: '#e74c3c',
        fontWeight: 'bold',
    },
    controls: {
        alignItems: 'center',
        marginBottom: 15,
        marginTop: isWeb ? 20 : 0,
    },
    resetButton: {
        backgroundColor: '#3498db',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    resetButtonText: {
        color: 'white',
        fontSize: isWeb ? 18 : 17,
        fontWeight: 'bold',
    },
    // 報告頁面樣式
    reportBox: {
        backgroundColor: '#fff9c4',
        padding: 20,
        borderRadius: 12,
        marginBottom: 30,
    },
    summaryText: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
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
    reportButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 15,
        flexWrap: 'wrap',
    },
    reportButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        minWidth: 120,
        alignItems: 'center',
    },
    backButton: {
        backgroundColor: '#FF9800',
    },
    homeButton: {
        backgroundColor: '#2196F3',
    },
    reportButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default HumanBodyGame;