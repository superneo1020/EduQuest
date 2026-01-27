// science/HumanBodyGame.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';

// 檢測是否是網頁環境
const isWeb = Platform.OS === 'web';

const HumanBodyGame = () => {
    const { width, height } = useWindowDimensions();
    const [isPortrait, setIsPortrait] = useState(height > width);

    // 器官圖片引用
    const organImages = {
        heart: require('../../../assets/images/organs/heart.png'),
        largeIntestine: require('../../../assets/images/organs/large-intestine.png'),
        lung: require('../../../assets/images/organs/lung.png'),
        liver: require('../../../assets/images/organs/liver.png'),
        brain: require('../../../assets/images/organs/brain.png'),
        stomach: require('../../../assets/images/organs/stomach.png'),
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

            // 右側器官區域
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
                // 網格設置
                grid: {
                    rows: 10,    // 10行
                    cols: 8,     // 8列
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
            // 網頁豎屏：自適應佈局
            const bodyWidth = Math.min(screenWidth * 0.85, 400);
            const bodyHeight = Math.min(screenHeight * 0.35, 350);
            const bodyLeft = (screenWidth - bodyWidth) / 2;
            const bodyTop = screenHeight * 0.15;

            // 器官區域
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
                // 網格設置
                grid: {
                    rows: 8,    // 8行
                    cols: 6,    // 6列
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
            // 手機豎屏：上下佈局 - 人體圖在上，器官在下
            const bodyWidth = screenWidth * 0.85;
            const bodyHeight = screenHeight * 0.4;
            const bodyLeft = screenWidth * 0.075;
            const bodyTop = screenHeight * 0.12;

            // 底部器官區域
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
                // 網格設置
                grid: {
                    rows: 8,    // 8行
                    cols: 6,    // 6列
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

    // 器官數據 - 現在使用網格坐標
    const organs = useMemo(() => [
        {
            id: 1,
            name: 'Heart',
            image: organImages.heart,
            description: 'Responsible for pumping blood throughout the body',
            gridPosition: { row: 2, col: 4 }, // 網格坐標（行, 列）
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

    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [currentHint, setCurrentHint] = useState<string>('');

    // 將網格坐標轉換為實際坐標
    const gridToPosition = (row: number, col: number) => {
        const bodyLeft = layout.bodyOutline.left;
        const bodyTop = layout.bodyOutline.top;

        return {
            x: bodyLeft + (col - 2) * cellWidth + cellWidth,
            y: bodyTop + (row - 2) * cellHeight + cellHeight
        };
    };

    // 處理器官卡片點擊
    const handleOrganSelect = (organId: number) => {
        const organ = organs.find(o => o.id === organId);
        if (!organ || placedOrgans[organId]) return;

        setSelectedOrgan(organId);
        setCurrentHint(organ.hint);

        // 高亮顯示建議的網格單元
        const suggestedCells = getSuggestedCells(organ);
        setHighlightedCells(suggestedCells);

        // 播放選中動畫
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

    // 獲取建議放置的網格單元
    const getSuggestedCells = (organ: any) => {
        const cells = [];
        const targetRow = organ.gridPosition.row;
        const targetCol = organ.gridPosition.col;

        // 為不同器官定義不同的建議區域
        switch (organ.id) {
            case 1: // 心臟
                cells.push({ row: targetRow, col: targetCol });
                cells.push({ row: targetRow, col: targetCol + 1 });
                cells.push({ row: targetRow + 1, col: targetCol });
                break;
            case 2: // 大腸
                for (let r = targetRow - 1; r <= targetRow + 1; r++) {
                    for (let c = targetCol - 1; c <= targetCol + 1; c++) {
                        if (r >= 0 && r < rows && c >= 0 && c < cols) {
                            cells.push({ row: r, col: c });
                        }
                    }
                }
                break;
            case 3: // 肺
                cells.push({ row: targetRow, col: targetCol });
                cells.push({ row: targetRow, col: targetCol + 1 });
                break;
            default:
                cells.push({ row: targetRow, col: targetCol });
                break;
        }

        return cells;
    };

    // 處理網格點擊
    const handleGridClick = (row: number, col: number) => {
        if (!selectedOrgan) return;

        const organ = organs.find(o => o.id === selectedOrgan);
        if (!organ) return;

        // 檢查是否點擊在有效的網格範圍內
        if (row < 0 || row >= rows || col < 0 || col >= cols) return;

        // 檢查點擊的網格是否接近正確位置
        const targetRow = organ.gridPosition.row;
        const targetCol = organ.gridPosition.col;
        const rowDistance = Math.abs(row - targetRow);
        const colDistance = Math.abs(col - targetCol);

        // 判斷是否正確（允許1-2個單元的誤差）
        const isCorrect = (rowDistance <= 1 && colDistance <= 1);

        // 播放放置動畫
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

        // 更新放置器官
        setPlacedOrgans(prev => ({
            ...prev,
            [selectedOrgan]: {
                row,
                col,
                isCorrect,
                gridPosition: { row: targetRow, col: targetCol }
            }
        }));

        // 計分
        if (isCorrect) {
            setCorrectCount(prev => prev + 1);
            setScore(prev => prev + 10);
        } else {
            setWrongCount(prev => prev + 1);
            setScore(prev => Math.max(0, prev - 2));
        }

        // 取消選擇
        setSelectedOrgan(null);
        setCurrentHint('');
        setHighlightedCells([]);

        // 檢查遊戲是否完成
        const newPlacedCount = Object.keys(placedOrgans).length + 1;
        if (newPlacedCount === organs.length) {
            setGameCompleted(true);
            setTimeout(() => {
                setShowResultModal(true);
            }, 1000);
        }
    };

    // 當屏幕方向改變時重置遊戲
    useEffect(() => {
        resetGame();
    }, [isPortrait]);

    // 重來按鈕功能
    const resetGame = () => {
        setSelectedOrgan(null);
        setPlacedOrgans({});
        setScore(0);
        setCorrectCount(0);
        setWrongCount(0);
        setGameCompleted(false);
        setShowResultModal(false);
        setCurrentHint('');
        setHighlightedCells([]);

        // 重置動畫值
        Object.values(organAnimations).forEach(anim => {
            anim.setValue(0);
        });
    };

    // 計算器官卡片位置（網格佈局）
    const getOrganCardPosition = (index: number) => {
        const isWebLandscape = isWeb && !isPortrait;
        const cardSize = layout.organCardSize;

        if (isWebLandscape) {
            // 網頁橫屏：兩列佈局
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
            // 手機豎屏或網頁豎屏：三列佈局
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
                // 檢查這個單元是否被高亮（當前選擇的器官）
                const isHighlighted = highlightedCells.some(cell =>
                    cell.row === row && cell.col === col
                );

                // 檢查這個單元是否有正確放置的器官
                const hasOrgan = Object.entries(placedOrgans).some(([organId, pos]) =>
                    pos.row === row && pos.col === col
                );

                // 檢查這個單元是否是某個器官的正確位置
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
                                {/* 網格坐標標記（調試用） */}
                                {__DEV__ && (
                                    <Text style={styles.gridCoordinate}>
                                        {row},{col}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* 顯示正確位置標記 */}
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
            {/* 遊戲標題 */}
            <Text style={styles.title}>Understanding Human Organs - Grid Version</Text>

            {/* 控制欄 */}
            <View style={styles.controlBar}>
                <View style={styles.scoreBoard}>
                    <Text style={styles.scoreText}>Score: {score}</Text>
                    <Text style={styles.scoreText}>Correct: {correctCount}</Text>
                    <Text style={styles.scoreText}>Wrong: {wrongCount}</Text>
                    <Text style={styles.scoreText}>Remaining: {organs.length - Object.keys(placedOrgans).length}</Text>
                </View>

                <View style={styles.modeButtons}>
                    <TouchableOpacity
                        style={[styles.modeButton, showGrid && styles.activeModeButton]}
                        onPress={() => setShowGrid(!showGrid)}
                    >
                        <Text style={styles.modeButtonText}>
                            {showGrid ? 'Grid ✓' : 'Grid'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.modeButton, showCorrectPositions && styles.activeModeButton]}
                        onPress={() => setShowCorrectPositions(!showCorrectPositions)}
                    >
                        <Text style={styles.modeButtonText}>
                            {showCorrectPositions ? 'Show Correct Positions ✓' : 'Show Correct Positions'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 提示區域 */}
            {currentHint && (
                <View style={styles.selectionHint}>
                    <Text style={styles.selectionText}>Selected Organ</Text>
                    <Text style={styles.hintText}>Hint: {currentHint}</Text>
                    <Text style={styles.instructionText}>
                        Click on the grid to place the organ. Green cells are suggested positions.
                    </Text>
                </View>
            )}

            {/* 遊戲區域 */}
            <View style={styles.gameArea}>
                {/* 人體圖區域 */}
                <View style={[
                    styles.bodyArea,
                    {
                        width: layout.bodyOutline.width,
                        height: layout.bodyOutline.height,
                        left: layout.bodyOutline.left,
                        top: layout.bodyOutline.top,
                    }
                ]}>
                    {/* 人體輪廓 */}
                    <Image
                        source={require('../../../assets/images/organs/human-body-outline.png')}
                        style={styles.bodyOutlineImage}
                        resizeMode="contain"
                    />

                    {/* 網格 */}
                    {renderGrid()}

                    {/* 已放置的器官 */}
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

                                {/* 器官名稱標籤 */}
                                <Text style={[
                                    styles.organNameLabel,
                                    position.isCorrect ? styles.correctLabel : styles.wrongLabel
                                ]}>
                                    {organ.name}
                                </Text>

                                {/* 如果放置不正確，箭頭將指示正確位置 */}
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

                {/* 器官選擇區域 */}
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
                                            <Text style={styles.organCardHint}>
                                                Correct position: ({organ.gridPosition.row}, {organ.gridPosition.col})
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

            {/* 控制按鈕 */}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                    <Text style={styles.resetButtonText}>Reset Game</Text>
                </TouchableOpacity>
            </View>

            {/* 完成彈窗 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showResultModal}
                onRequestClose={() => setShowResultModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Game Completed!</Text>

                        <View style={styles.resultSummary}>
                            <View style={styles.resultItem}>
                                <Text style={styles.resultLabel}>Total Score</Text>
                                <Text style={styles.resultValue}>{score}</Text>
                            </View>
                            <View style={styles.resultItem}>
                                <Text style={styles.resultLabel}>Correct Count</Text>
                                <Text style={[styles.resultValue, styles.correctValue]}>{correctCount}</Text>
                            </View>
                            <View style={styles.resultItem}>
                                <Text style={styles.resultLabel}>Wrong Count</Text>
                                <Text style={[styles.resultValue, styles.wrongValue]}>{wrongCount}</Text>
                            </View>
                        </View>

                        {/* 網格放置結果顯示 */}
                        <View style={styles.gridResult}>
                            <Text style={styles.gridResultTitle}>Your placement results:</Text>
                            <View style={styles.miniGrid}>
                                {Array.from({ length: rows }).map((_, row) => (
                                    <View key={row} style={styles.miniGridRow}>
                                        {Array.from({ length: cols }).map((_, col) => {
                                            const organHere = Object.entries(placedOrgans).find(
                                                ([organId, pos]) => pos.row === row && pos.col === col
                                            );
                                            const isCorrectPosition = organs.some(organ =>
                                                organ.gridPosition.row === row && organ.gridPosition.col === col
                                            );

                                            return (
                                                <View
                                                    key={col}
                                                    style={[
                                                        styles.miniGridCell,
                                                        isCorrectPosition && styles.miniCorrectCell,
                                                        organHere && styles.miniOccupiedCell,
                                                        organHere && !placedOrgans[parseInt(organHere[0])].isCorrect && styles.miniWrongCell,
                                                    ]}
                                                >
                                                    {organHere && (
                                                        <Text style={styles.miniCellText}>
                                                            {organs.find(o => o.id === parseInt(organHere[0]))?.name.charAt(0)}
                                                        </Text>
                                                    )}
                                                    {isCorrectPosition && !organHere && (
                                                        <Text style={styles.miniTargetText}>✓</Text>
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}
                            </View>
                            <View style={styles.gridLegend}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendColor, styles.legendCorrect]} />
                                    <Text style={styles.legendText}>Correct Placement</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendColor, styles.legendWrong]} />
                                    <Text style={styles.legendText}>Wrong Placement</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendColor, styles.legendTarget]} />
                                    <Text style={styles.legendText}>Correct Position</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.playAgainButton]}
                                onPress={resetGame}
                            >
                                <Text style={styles.modalButtonText}>Play Again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.closeButton]}
                                onPress={() => setShowResultModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );

    // 在網頁環境中使用 ScrollView，在移動設備上保持原樣
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
    // 原始容器（用於移動設備）
    container: {
        flex: 1,
        backgroundColor: '#f0f7ff',
        padding: 12,
    },
    title: {
        fontSize: isWeb ? 28 : 26,
        fontWeight: 'bold',
        color: '#1a5276',
        textAlign: 'center',
        marginBottom: 15,
        marginTop: 8,
    },
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
    // 網格樣式
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
    organCardHint: {
        fontSize: isWeb ? 12 : 11,
        color: '#3498db',
        fontWeight: '600',
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        width: '90%',
        maxWidth: 450,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    modalTitle: {
        fontSize: isWeb ? 28 : 26,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 25,
        textAlign: 'center',
    },
    resultSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 25,
    },
    resultItem: {
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: isWeb ? 15 : 14,
        color: '#7f8c8d',
        marginBottom: 5,
    },
    resultValue: {
        fontSize: isWeb ? 34 : 32,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    correctValue: {
        color: '#27ae60',
    },
    wrongValue: {
        color: '#e74c3c',
    },
    gridResult: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 15,
        marginBottom: 25,
        width: '100%',
        alignItems: 'center',
    },
    gridResultTitle: {
        fontSize: isWeb ? 19 : 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
    },
    miniGrid: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        marginBottom: 15,
    },
    miniGridRow: {
        flexDirection: 'row',
    },
    miniGridCell: {
        width: isWeb ? 28 : 25,
        height: isWeb ? 28 : 25,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 1,
    },
    miniCorrectCell: {
        borderColor: '#2ecc71',
    },
    miniOccupiedCell: {
        backgroundColor: '#2ecc71',
    },
    miniWrongCell: {
        backgroundColor: '#e74c3c',
    },
    miniCellText: {
        fontSize: isWeb ? 11 : 10,
        fontWeight: 'bold',
        color: 'white',
    },
    miniTargetText: {
        fontSize: isWeb ? 13 : 12,
        color: '#2ecc71',
        fontWeight: 'bold',
    },
    gridLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        flexWrap: 'wrap',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    legendColor: {
        width: 15,
        height: 15,
        borderRadius: 3,
    },
    legendCorrect: {
        backgroundColor: '#2ecc71',
    },
    legendWrong: {
        backgroundColor: '#e74c3c',
    },
    legendTarget: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#2ecc71',
    },
    legendText: {
        fontSize: isWeb ? 13 : 12,
        color: '#7f8c8d',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    playAgainButton: {
        backgroundColor: '#27ae60',
    },
    closeButton: {
        backgroundColor: '#95a5a6',
    },
    modalButtonText: {
        color: 'white',
        fontSize: isWeb ? 17 : 16,
        fontWeight: 'bold',
    },

});

export default HumanBodyGame;