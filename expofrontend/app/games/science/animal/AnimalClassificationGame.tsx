import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

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

const AnimalClassificationGame: React.FC = () => {
    const navigation = useNavigation();
    const [allAnimals] = useState<Animal[]>(ANIMALS);
    const [categories] = useState<Category[]>(CATEGORIES);
    const [availableAnimals, setAvailableAnimals] = useState<Animal[]>(ANIMALS);
    const [categoryAssignments, setCategoryAssignments] = useState<Record<number, string>>({});
    const [score, setScore] = useState(0);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [gameResult, setGameResult] = useState<GameResult>({
        correct: 0,
        wrong: 0,
        total: 0,
        score: 0,
    });
    const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
    const [showDropZones, setShowDropZones] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [finalReport, setFinalReport] = useState({ summary: '', accuracy: 0 });

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
            setCategoryAssignments(prev => ({
                ...prev,
                [selectedAnimal.id]: categoryId
            }));

            setAvailableAnimals(prev => prev.filter(a => a.id !== selectedAnimal.id));
            setSelectedAnimal(null);
            setShowDropZones(false);
            checkGameCompletion();
        }
    };

    // 從分類中移除動物
    const handleRemoveFromCategory = (animalId: number) => {
        setCategoryAssignments(prev => {
            const newAssignments = { ...prev };
            delete newAssignments[animalId];
            return newAssignments;
        });

        const animal = allAnimals.find(a => a.id === animalId);
        if (animal) {
            setAvailableAnimals(prev => [...prev, animal]);
        }

        checkGameCompletion();
    };

    // 計算分數
    const calculateScore = () => {
        let correct = 0;
        let wrong = 0;

        allAnimals.forEach(animal => {
            const assignedCategory = categoryAssignments[animal.id];
            if (assignedCategory) {
                if (animal.type === assignedCategory) {
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
            const result = calculateScore();
            saveGameResult(result);
            setGameCompleted(true);
            showFinalReport();
        }
    };

    // 顯示最終報告
    const showFinalReport = () => {
        const result = calculateScore();
        setGameResult(result);
        const summary = generateSummary(result);
        setFinalReport({
            summary,
            accuracy: result.score
        });
        setIsFinished(true);
    };

    // 生成總結文字
    const generateSummary = (result: GameResult): string => {
        let summary = '';
        if (result.score === 100) {
            summary = 'Excellent! You classified all animals correctly! 🎉';
        } else if (result.score >= 70) {
            summary = `Good job! You got ${result.correct} out of ${result.total} correct. Keep practicing to improve your classification skills!`;
        } else {
            summary = `You got ${result.correct} out of ${result.total} correct. Let's review the animal classifications and try again!`;
        }

        // 添加錯誤分類的詳細信息
        const wrongAnimals = allAnimals.filter(animal => {
            const assigned = categoryAssignments[animal.id];
            return assigned && assigned !== animal.type;
        });

        if (wrongAnimals.length > 0) {
            summary += '\n\nAnimals to review:\n';
            wrongAnimals.forEach(animal => {
                const assigned = categoryAssignments[animal.id];
                summary += `• ${animal.name} was placed in ${assigned}, but should be in ${animal.type}\n`;
            });
        }

        return summary;
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
        setSelectedAnimal(null);
        setShowDropZones(false);
        setIsFinished(false);
        setFinalReport({ summary: '', accuracy: 0 });
    };

    // 取消選擇
    const cancelSelection = () => {
        setSelectedAnimal(null);
        setShowDropZones(false);
    };

    // 返回上一頁
    const handleGoBack = () => {
        navigation.goBack();
    };

    // 返回遊戲列表頁面
    const handleGoToGameList = () => {
        navigation.navigate('science/index' as never);
    };

    // 渲染動物卡片（只顯示未分類的）
    const renderAnimalCard = (animal: Animal) => {
        const isSelected = selectedAnimal?.id === animal.id;
        const isClassified = categoryAssignments[animal.id];

        if (isClassified) return null;

        return (
            <TouchableOpacity
                key={animal.id}
                style={[
                    styles.animalCard,
                    isSelected && styles.selectedAnimalCard,
                ]}
                onPress={() => handleAnimalPress(animal)}
            >
                <View style={styles.animalImageContainer}>
                    <Image source={animal.image} style={styles.animalImage} />
                    <Text style={styles.animalName}>{animal.name}</Text>
                </View>
                <Text style={styles.tapToSelectText}>Click to select</Text>
            </TouchableOpacity>
        );
    };

    // 渲染分類區域中的動物
    const renderClassifiedAnimal = (animal: Animal) => {
        const assignedCategory = categoryAssignments[animal.id];
        const isCorrect = assignedCategory === animal.type;

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
                    {assignedCategory}
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
            </TouchableOpacity>
        );
    };

    // 完成頁面
    if (isFinished) {
        return (
            <ScrollView style={styles.container}>
                {/* 頂部導航欄 */}
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButtonHeader}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Game Result</Text>
                    <TouchableOpacity onPress={handleGoToGameList} style={styles.gameListButtonHeader}>
                        <Text style={styles.gameListButtonText}>Game List</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.reportContainer}>
                    <Text style={styles.reportTitle}>Session Report 🎓</Text>

                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreCircleNumber}>{finalReport.accuracy}</Text>
                        <Text style={styles.scoreCircleLabel}>/ 100</Text>
                    </View>

                    <View style={styles.resultsContainer}>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Correct Answers:</Text>
                            <Text style={[styles.resultValue, styles.correctText]}>
                                {gameResult.correct} / {gameResult.total}
                            </Text>
                        </View>
                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Wrong Answers:</Text>
                            <Text style={[styles.resultValue, styles.wrongText]}>
                                {gameResult.wrong} / {gameResult.total}
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
                            style={[styles.modalButton, styles.backButton]}
                            onPress={handleGoBack}
                        >
                            <Text style={styles.modalButtonText}>Back</Text>
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

    return (
        <View style={styles.container}>
            {/* 頂部導航欄 */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButtonHeader}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Animal Classification</Text>
                <TouchableOpacity onPress={handleGoToGameList} style={styles.gameListButtonHeader}>
                    <Text style={styles.gameListButtonText}>Game List</Text>
                </TouchableOpacity>
            </View>

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
                            <Text style={styles.cancelButtonText}>Cancel</Text>
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
                        onPress={showFinalReport}
                    >
                        <Text style={styles.buttonText}>Check Answer</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    headerBar: {
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
    backButtonHeader: {
        paddingVertical: 8,
        paddingRight: 12,
    },
    backButtonText: {
        fontSize: 16,
        color: '#2196F3',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    gameListButtonHeader: {
        paddingVertical: 8,
        paddingLeft: 12,
    },
    gameListButtonText: {
        fontSize: 16,
        color: '#2196F3',
        fontWeight: '600',
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
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
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 2,
    },
    instructionsText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    subInstructionsText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 5,
    },
    hintText: {
        fontSize: 11,
        color: '#FF9800',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    selectionInfo: {
        backgroundColor: '#E3F2FD',
        padding: 12,
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
        width: 40,
        height: 40,
        resizeMode: 'contain',
        marginRight: 10,
    },
    selectionText: {
        fontSize: 14,
        color: '#333',
    },
    selectedAnimalName: {
        fontWeight: 'bold',
        color: '#2196F3',
    },
    instructionText: {
        fontSize: 12,
        color: '#666',
    },
    cancelButton: {
        backgroundColor: '#FF9800',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    remainingCount: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    animalsContainer: {
        marginBottom: 25,
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
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        overflow: 'hidden',
    },
    selectedAnimalCard: {
        backgroundColor: '#E3F2FD',
        borderWidth: 2,
        borderColor: '#2196F3',
    },
    animalImageContainer: {
        padding: 10,
        alignItems: 'center',
    },
    animalImage: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    animalName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginTop: 5,
    },
    tapToSelectText: {
        fontSize: 10,
        color: '#2196F3',
        marginBottom: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    emptyAnimalArea: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 2,
    },
    emptyAnimalText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CAF50',
    },
    emptyAnimalSubtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    categoriesContainer: {
        marginBottom: 25,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryArea: {
        width: '48%',
        minHeight: 220,
        borderRadius: 10,
        marginBottom: 12,
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
        padding: 8,
        alignItems: 'center',
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    categoryCount: {
        fontSize: 10,
        color: '#fff',
        opacity: 0.9,
        marginTop: 2,
    },
    classifiedAnimalsContainer: {
        padding: 8,
        flex: 1,
    },
    classifiedAnimalCard: {
        backgroundColor: '#fff',
        borderRadius: 6,
        padding: 6,
        marginBottom: 6,
        alignItems: 'center',
        borderWidth: 1,
        position: 'relative',
        elevation: 1,
    },
    classifiedAnimalImage: {
        width: 35,
        height: 35,
        resizeMode: 'contain',
    },
    classifiedAnimalName: {
        fontSize: 11,
        fontWeight: '500',
        color: '#333',
    },
    classifiedAnimalType: {
        fontSize: 9,
        color: '#666',
        fontStyle: 'italic',
    },
    correctnessIndicator: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    correctnessText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    emptyCategoryMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
    },
    emptyCategoryText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
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
    },
    checkButton: {
        backgroundColor: '#4CAF50',
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
    },
    correctText: {
        color: '#4CAF50',
    },
    wrongText: {
        color: '#F44336',
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
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 30,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    playAgainButton: {
        backgroundColor: '#4CAF50',
    },
    backButton: {
        backgroundColor: '#FF9800',
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

export default AnimalClassificationGame;