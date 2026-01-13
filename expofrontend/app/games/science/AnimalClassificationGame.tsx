import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Modal,
    Dimensions,
    ScrollView,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// 動物資料
const ANIMALS = [
    { id: 1, name: 'shark', type: 'fish', image: require('../assets/images/animals/shark.png') },
    { id: 2, name: 'trout', type: 'fish', image: require('../assets/images/animals/trout.png') },
    { id: 3, name: 'sparrow', type: 'bird', image: require('../assets/images/animals/sparrow.png') },
    { id: 4, name: 'pigeon', type: 'bird', image: require('../assets/images/animals/pigeon.png') },
    { id: 5, name: 'dog', type: 'mammal', image: require('../assets/images/animals/dog.png') },
    { id: 6, name: 'tiger', type: 'mammal', image: require('../assets/images/animals/tiger.png') },
    { id: 7, name: 'turtle', type: 'reptile', image: require('../assets/images/animals/turtle.png') },
    { id: 8, name: 'snake', type: 'reptile', image: require('../assets/images/animals/snake.png') },
];

// 分類區域
const CATEGORIES = [
    { id: 'fish', name: 'fish', color: '#4FC3F7' },
    { id: 'bird', name: 'bird', color: '#AED581' },
    { id: 'mammal', name: 'mammal', color: '#FFB74D' },
    { id: 'reptile', name: 'reptile', color: '#BA68C8' },
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
}

interface GameResult {
    correct: number;
    wrong: number;
    total: number;
    score: number;
}

interface PositionedAnimal extends Animal {
    position?: { top: number; left: number };
}

const AnimalClassificationGame: React.FC = () => {
    const [allAnimals] = useState<Animal[]>(ANIMALS);
    const [categories] = useState<Category[]>(CATEGORIES);
    const [availableAnimals, setAvailableAnimals] = useState<Animal[]>(ANIMALS);
    const [categoryAssignments, setCategoryAssignments] = useState<Record<number, string>>({});
    const [score, setScore] = useState(0);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [gameResult, setGameResult] = useState<GameResult>({
        correct: 0,
        wrong: 0,
        total: 0,
        score: 0,
    });
    const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
    const [showDropZones, setShowDropZones] = useState(false);
    const [positionedAnimals, setPositionedAnimals] = useState<PositionedAnimal[]>(ANIMALS);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    // 儲存動物卡片的位置
    const animalRefs = useRef<Record<number, { x: number; y: number; width: number; height: number }>>({});

    // 初始化動畫
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // 選擇動物
    const handleAnimalPress = (animal: Animal) => {
        if (!categoryAssignments[animal.id]) {
            setSelectedAnimal(animal);
            setShowDropZones(true);
        }
    };

    // 拖放動物到分類
    const handleDropOnCategory = (categoryId: string) => {
        if (selectedAnimal) {
            // 更新分類分配
            setCategoryAssignments(prev => ({
                ...prev,
                [selectedAnimal.id]: categoryId
            }));

            // 從可用動物列表中移除
            setAvailableAnimals(prev => prev.filter(a => a.id !== selectedAnimal.id));

            // 重置選擇
            setSelectedAnimal(null);
            setShowDropZones(false);

            // 檢查遊戲是否完成
            checkGameCompletion();
        }
    };

    // 從分類中移除動物
    const handleRemoveFromCategory = (animalId: number) => {
        // 移除分類分配
        setCategoryAssignments(prev => {
            const newAssignments = { ...prev };
            delete newAssignments[animalId];
            return newAssignments;
        });

        // 將動物加回可用列表
        const animal = allAnimals.find(a => a.id === animalId);
        if (animal) {
            setAvailableAnimals(prev => [...prev, animal]);
        }

        // 檢查遊戲完成狀態
        checkGameCompletion();
    };

    // 計算分數
    const calculateScore = () => {
        let correct = 0;
        let wrong = 0;

        allAnimals.forEach(animal => {
            const assignedCategory = categoryAssignments[animal.id];
            if (assignedCategory) {
                const categoryMap: Record<string, string> = {
                    'fish': 'fish',
                    'bird': 'bird',
                    'mammal': 'mammal',
                    'reptile': 'reptile'
                };

                if (categoryMap[animal.type] === assignedCategory) {
                    correct++;
                } else {
                    wrong++;
                }
            }
        });

        const total = allAnimals.length;
        const calculatedScore = Math.round((correct / total) * 100);

        const result: GameResult = {
            correct,
            wrong,
            total,
            score: calculatedScore,
        };

        setGameResult(result);
        setScore(calculatedScore);
        return result;
    };

    // 檢查遊戲是否完成
    const checkGameCompletion = () => {
        const assignedCount = Object.keys(categoryAssignments).length;
        if (assignedCount === allAnimals.length) {
            setTimeout(() => {
                const result = calculateScore();
                setGameResult(result);
                setGameCompleted(true);
                setShowResults(true);
                saveGameResult(result);
            }, 500);
        }
    };

    // 保存遊戲結果
    const saveGameResult = async (result: GameResult) => {
        try {
            const existingResults = await AsyncStorage.getItem('animalGameResults');
            const results = existingResults ? JSON.parse(existingResults) : [];
            results.push({
                ...result,
                date: new Date().toISOString(),
            });
            await AsyncStorage.setItem('animalGameResults', JSON.stringify(results));
        } catch (error) {
            console.error('The game failed to save:', error);
        }
    };

    // 重設遊戲
    const resetGame = () => {
        setCategoryAssignments({});
        setAvailableAnimals(allAnimals);
        setScore(0);
        setGameCompleted(false);
        setShowResults(false);
        setSelectedAnimal(null);
        setShowDropZones(false);

        // 重設動畫
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // 取消選擇
    const cancelSelection = () => {
        setSelectedAnimal(null);
        setShowDropZones(false);
    };

    // 保存動物卡片位置
    const saveAnimalLayout = (animalId: number, layout: any) => {
        animalRefs.current[animalId] = {
            x: layout.x,
            y: layout.y,
            width: layout.width,
            height: layout.height,
        };
    };

    // 渲染動物卡片（只顯示未分類的）
    const renderAnimalCard = (animal: Animal) => {
        const isSelected = selectedAnimal?.id === animal.id;
        const isClassified = categoryAssignments[animal.id];

        if (isClassified) {
            return null; // 已分類的動物不顯示在卡片區域
        }

        return (
            <Animated.View
                key={animal.id}
                style={[
                    styles.animalCard,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                    isSelected && styles.selectedAnimalCard,
                ]}
                onLayout={(event) => {
                    const layout = event.nativeEvent.layout;
                    saveAnimalLayout(animal.id, layout);
                }}
            >
                <TouchableOpacity
                    style={styles.animalCardInner}
                    onPress={() => handleAnimalPress(animal)}
                >
                    <View style={styles.animalImageContainer}>
                        <Image source={animal.image} style={styles.animalImage} />
                        <Text style={styles.animalName}>{animal.name}</Text>
                    </View>
                    <Text style={styles.tapToSelectText}>Click to select</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // 渲染分類區域中的動物
    const renderClassifiedAnimal = (animal: Animal) => {
        const assignedCategory = categoryAssignments[animal.id];
        const isCorrect = assignedCategory &&
            (assignedCategory === 'fish' && animal.type === 'fish' ||
                assignedCategory === 'bird' && animal.type === 'bird' ||
                assignedCategory === 'mammal' && animal.type === 'mammal' ||
                assignedCategory === 'reptile' && animal.type === 'reptile');

        const category = categories.find(c => c.id === assignedCategory);

        return (
            <TouchableOpacity
                key={animal.id}
                style={[
                    styles.classifiedAnimalCard,
                    { borderColor: isCorrect ? '#4CAF50' : '#F44336' }
                ]}
                onPress={() => handleRemoveFromCategory(animal.id)}
            >
                <Image source={animal.image} style={styles.classifiedAnimalImage} />
                <Text style={styles.classifiedAnimalName}>{animal.name}</Text>
                <Text style={styles.classifiedAnimalType}>
                    {category?.name}
                </Text>
                <View style={[
                    styles.correctnessIndicator,
                    { backgroundColor: isCorrect ? '#4CAF50' : '#F44336' }
                ]}>
                    <Text style={styles.correctnessText}>
                        {isCorrect ? '✓' : '✗'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // 渲染分類區域
    const renderCategoryArea = (category: Category) => {
        const assignedAnimals = allAnimals.filter(animal =>
            categoryAssignments[animal.id] === category.id
        );

        const isDropTarget = showDropZones && selectedAnimal;

        return (
            <TouchableOpacity
                key={category.id}
                style={[
                    styles.categoryArea,
                    { backgroundColor: `${category.color}20` },
                    isDropTarget && styles.dropTargetArea,
                ]}
                onPress={() => handleDropOnCategory(category.id)}
                disabled={!showDropZones}
            >
                <View style={[styles.categoryHeader, { backgroundColor: category.color }]}>
                    <Text style={styles.categoryTitle}>{category.name}</Text>
                    <Text style={styles.categoryCount}>
                        {assignedAnimals.length} animals
                    </Text>
                </View>

                <View style={styles.classifiedAnimalsContainer}>
                    {assignedAnimals.length > 0 ? (
                        assignedAnimals.map(animal => renderClassifiedAnimal(animal))
                    ) : (
                        <View style={styles.emptyCategoryMessage}>
                            <Text style={styles.emptyCategoryText}>
                                {showDropZones ? 'Click here to place animal' : 'No animals yet'}
                            </Text>
                        </View>
                    )}
                </View>

                {showDropZones && assignedAnimals.length === 0 && (
                    <View style={styles.dropZone}>
                        <Text style={styles.dropZoneText}>Click here to place</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // 獲取當前分類的動物
    const getAnimalsByCategory = (categoryId: string) => {
        return allAnimals.filter(animal => categoryAssignments[animal.id] === categoryId);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* 遊戲標題和分數 */}
                <View style={styles.header}>
                    <Text style={styles.title}>Animal Classification Game</Text>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreLabel}>Score:</Text>
                        <Text style={styles.scoreValue}>{score}</Text>
                        <Text style={styles.progressText}>
                            ({Object.keys(categoryAssignments).length}/{allAnimals.length})
                        </Text>
                    </View>
                </View>

                {/* 遊戲說明 */}
                <View style={styles.instructions}>
                    <Text style={styles.instructionsText}>
                        Click on the animal card, then click on the category area to categorize the animal.
                    </Text>
                    <Text style={styles.subInstructionsText}>
                        Fish: Shark, Trout | Bird: Sparrow, Pigeon | Mammal: Dog, Tiger | Reptile: Turtle, Snake
                    </Text>
                    <Text style={styles.hintText}>
                        Click on animals in the classification area to move them back
                    </Text>
                </View>

                {/* 已選擇的動物提示 */}
                {selectedAnimal && (
                    <View style={styles.selectionInfo}>
                        <View style={styles.selectedAnimalPreview}>
                            <Image source={selectedAnimal.image} style={styles.selectedAnimalImage} />
                            <View>
                                <Text style={styles.selectionText}>
                                    Selected: <Text style={styles.selectedAnimalName}>{selectedAnimal.name}</Text>
                                </Text>
                                <Text style={styles.instructionText}>
                                    Please click the classification area below to place the animal
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={cancelSelection}
                        >
                            <Text style={styles.cancelButtonText}>Cancel Selection</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* 動物卡片區域 */}
                <View style={styles.animalsContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Animal Cards</Text>
                        <Text style={styles.remainingCount}>
                            Remaining: {availableAnimals.length} / {allAnimals.length}
                        </Text>
                    </View>
                    {availableAnimals.length > 0 ? (
                        <View style={styles.animalsGrid}>
                            {availableAnimals.map(animal => renderAnimalCard(animal))}
                        </View>
                    ) : (
                        <View style={styles.emptyAnimalArea}>
                            <Text style={styles.emptyAnimalText}>All animals have been classified!</Text>
                            <Text style={styles.emptyAnimalSubtext}>Click "Check Answer" to view the results.</Text>
                        </View>
                    )}
                </View>

                {/* 分類區域 */}
                <View style={styles.categoriesContainer}>
                    <Text style={styles.sectionTitle}>Classification Area</Text>
                    <View style={styles.categoriesGrid}>
                        {categories.map(category => renderCategoryArea(category))}
                    </View>
                </View>

                {/* 控制按鈕 */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.button, styles.resetButton]}
                        onPress={resetGame}
                    >
                        <Text style={styles.buttonText}>Reset</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.checkButton]}
                        onPress={() => {
                            const result = calculateScore();
                            setGameResult(result);
                            setShowResults(true);
                        }}
                    >
                        <Text style={styles.buttonText}>Check Answer</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* 結果彈出視窗 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showResults}
                onRequestClose={() => setShowResults(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={[
                        styles.modalContent,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}>
                        <Text style={styles.modalTitle}>Game Completed!</Text>

                        <View style={styles.resultsContainer}>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Correct answers:</Text>
                                <Text style={[styles.resultValue, styles.correctText]}>
                                    {gameResult.correct}
                                </Text>
                            </View>

                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Number of questions answered incorrectly:</Text>
                                <Text style={[styles.resultValue, styles.wrongText]}>
                                    {gameResult.wrong}
                                </Text>
                            </View>

                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>Total number of questions:</Text>
                                <Text style={styles.resultValue}>{gameResult.total}</Text>
                            </View>

                            <View style={styles.scoreResultRow}>
                                <Text style={styles.finalScoreLabel}>Final Score:</Text>
                                <Text style={styles.finalScoreValue}>{gameResult.score}</Text>
                            </View>
                        </View>

                        {/* 顯示每個分類的結果 */}
                        <View style={styles.categoryResults}>
                            {categories.map(category => {
                                const animalsInCategory = getAnimalsByCategory(category.id);
                                const correctCount = animalsInCategory.filter(animal => {
                                    const categoryMap: Record<string, string> = {
                                        'fish': 'fish',
                                        'bird': 'bird',
                                        'mammal': 'mammal',
                                        'reptile': 'reptile'
                                    };
                                    return categoryMap[animal.type] === category.id;
                                }).length;

                                return (
                                    <View key={category.id} style={styles.categoryResultItem}>
                                        <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                                        <Text style={styles.categoryResultText}>
                                            {category.name}: {correctCount} / {animalsInCategory.length} correct
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.playAgainButton]}
                                onPress={() => {
                                    setShowResults(false);
                                    resetGame();
                                }}
                            >
                                <Text style={styles.modalButtonText}>Play Again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.closeButton]}
                                onPress={() => setShowResults(false)}
                            >
                                <Text style={styles.modalButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
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
        fontSize: 16,
        color: '#666',
        marginRight: 5,
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginRight: 8,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
    },
    instructions: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 2,
    },
    instructionsText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    subInstructionsText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 5,
    },
    hintText: {
        fontSize: 12,
        color: '#FF9800',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    selectionInfo: {
        backgroundColor: '#E3F2FD',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedAnimalPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    selectedAnimalImage: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
        marginRight: 10,
    },
    selectionText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 2,
    },
    selectedAnimalName: {
        fontWeight: 'bold',
        color: '#2196F3',
    },
    instructionText: {
        fontSize: 14,
        color: '#666',
    },
    cancelButton: {
        backgroundColor: '#FF9800',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    remainingCount: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    animalsContainer: {
        marginBottom: 30,
    },
    animalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    animalCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    selectedAnimalCard: {
        backgroundColor: '#E3F2FD',
        borderWidth: 2,
        borderColor: '#2196F3',
    },
    animalCardInner: {
        padding: 10,
        alignItems: 'center',
    },
    animalImageContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    animalImage: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    animalName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginTop: 5,
    },
    tapToSelectText: {
        fontSize: 12,
        color: '#2196F3',
        marginTop: 5,
        fontStyle: 'italic',
    },
    emptyAnimalArea: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 2,
    },
    emptyAnimalText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 5,
    },
    emptyAnimalSubtext: {
        fontSize: 14,
        color: '#666',
    },
    categoriesContainer: {
        marginBottom: 30,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryArea: {
        width: '48%',
        minHeight: 250,
        borderRadius: 10,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dropTargetArea: {
        borderWidth: 2,
        borderColor: '#2196F3',
        borderStyle: 'dashed',
    },
    categoryHeader: {
        padding: 10,
        alignItems: 'center',
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    categoryCount: {
        fontSize: 12,
        color: '#fff',
        opacity: 0.9,
        marginTop: 2,
    },
    classifiedAnimalsContainer: {
        padding: 10,
        flex: 1,
    },
    classifiedAnimalCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
        alignItems: 'center',
        borderWidth: 2,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    classifiedAnimalImage: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        marginBottom: 4,
    },
    classifiedAnimalName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    classifiedAnimalType: {
        fontSize: 10,
        color: '#666',
        fontStyle: 'italic',
    },
    correctnessIndicator: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    correctnessText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyCategoryMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyCategoryText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    dropZone: {
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        padding: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    dropZoneText: {
        fontSize: 14,
        color: '#2196F3',
        fontWeight: '600',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    button: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    resetButton: {
        backgroundColor: '#F44336',
    },
    checkButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 30,
        width: '90%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
    },
    resultsContainer: {
        marginBottom: 20,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    scoreResultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        marginTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#ddd',
    },
    resultLabel: {
        fontSize: 18,
        color: '#666',
    },
    resultValue: {
        fontSize: 20,
        fontWeight: '600',
    },
    finalScoreLabel: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    finalScoreValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    correctText: {
        color: '#4CAF50',
    },
    wrongText: {
        color: '#F44336',
    },
    categoryResults: {
        marginTop: 20,
        marginBottom: 30,
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
    },
    categoryResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    categoryResultText: {
        fontSize: 14,
        color: '#666',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    playAgainButton: {
        backgroundColor: '#4CAF50',
    },
    closeButton: {
        backgroundColor: '#757575',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AnimalClassificationGame;