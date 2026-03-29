// app/games/science/HumanBodyGamesIndex.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Heart, Star, Trophy, Target, Brain } from 'lucide-react-native';

interface DifficultyOption {
    id: string;
    title: string;
    level: 'beginner' | 'advanced';
    description: string;
    gameComponent: string;
    icon: string;
    color: string;
    bgColor: string;
    features: string[];
}

const difficultyOptions: DifficultyOption[] = [
    {
        id: 'beginner',
        title: 'Beginner',
        level: 'beginner',
        description: 'Body Parts Matching Game - Match the body parts and learn their names!',
        gameComponent: 'BodyPartsMatchingGame',
        icon: '🧩',
        color: '#4CAF50',
        bgColor: '#E8F5E9',
        features: [
        ]
    },
    {
        id: 'advanced',
        title: 'Advanced',
        level: 'advanced',
        description: 'Human Organ System - Place organs in correct positions on the body',
        gameComponent: 'HumanBodyGame',
        icon: '❤️',
        color: '#FF9800',
        bgColor: '#FFF3E0',
        features: [
        ]
    }
];

const HumanBodyGamesIndex: React.FC = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

    const handleSelectDifficulty = async (gameComponent: string, difficultyId: string) => {
        setLoading(true);
        setSelectedDifficulty(difficultyId);

        // 模拟加载延迟，让用户看到加载效果
        setTimeout(() => {
            if (gameComponent === 'BodyPartsMatchingGame') {
                navigation.navigate('science/human/BodyPartsMatchingGame' as never);
            } else if (gameComponent === 'HumanBodyGame') {
                navigation.navigate('science/human/HumanBodyGame' as never);
            }
            setLoading(false);
        }, 500);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>
                    Loading {selectedDifficulty === 'beginner' ? 'Beginner' : 'Advanced'} Game...
                </Text>
                <Text style={styles.loadingSubText}>
                    {selectedDifficulty === 'beginner'
                        ? 'Preparing memory matching game for you!'
                        : 'Setting up the organ placement challenge!'}
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* 头部区域 */}
                <View style={styles.header}>
                    <Heart size={60} color="#FF6B6B" style={{ marginBottom: 20 }} />
                    <Text style={styles.mainTitle}>Human Body Games</Text>
                    <Text style={styles.subTitle}>
                        Learn about the human body through fun and interactive games!
                    </Text>
                </View>

                {/* 难度选择卡片 */}
                <View style={styles.menuGrid}>
                    {difficultyOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.diffCard,
                                { backgroundColor: option.bgColor, borderColor: option.color }
                            ]}
                            onPress={() => handleSelectDifficulty(option.gameComponent, option.id)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardIconContainer}>
                                <Text style={styles.cardIcon}>{option.icon}</Text>
                            </View>
                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.diffBtnText, { color: option.color }]}>
                                        {option.title}
                                    </Text>
                                    <View style={[styles.levelBadge, { backgroundColor: option.color }]}>
                                        <Text style={styles.levelBadgeText}>
                                            {option.level === 'beginner' ? 'Easy Start' : 'Challenge'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.diffDesc}>{option.description}</Text>

                                {/* 特色功能列表 */}
                                <View style={styles.featuresList}>
                                    {option.features.map((feature, index) => (
                                        <View key={index} style={styles.featureItem}>
                                            <Star size={12} color={option.color} style={styles.featureIcon} />
                                            <Text style={styles.featureText}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* 开始按钮 */}
                                <View style={styles.startButtonContainer}>
                                    <View style={[styles.startButton, { backgroundColor: option.color }]}>
                                        <Text style={styles.startButtonText}>
                                            Start Game →
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 游戏信息区域 */}


                {/* 人体趣味知识 */}


                {/* 游戏说明 */}
                <View style={styles.gameInstructions}>
                    <Text style={styles.instructionsTitle}>🎮 How to Play</Text>
                    <View style={styles.instructionItem}>
                        <Text style={styles.instructionBullet}>•</Text>
                        <Text style={styles.instructionText}>
                            <Text style={styles.instructionHighlight}>Beginner Mode:</Text> Match pairs of body part cards. Each correct match gives you points!
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Text style={styles.instructionBullet}>•</Text>
                        <Text style={styles.instructionText}>
                            <Text style={styles.instructionHighlight}>Advanced Mode:</Text> Drag and drop organs to their correct positions on the human body grid.
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <Text style={styles.instructionBullet}>•</Text>
                        <Text style={styles.instructionText}>
                            Complete all challenges to earn the highest score!
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 20,
        paddingBottom: 30,
        backgroundColor: '#fff',
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 30,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '600',
        color: '#FF6B6B',
        textAlign: 'center',
    },
    loadingSubText: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    menuGrid: {
        width: '100%',
        paddingHorizontal: 20,
        gap: 20,
    },
    diffCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        gap: 15,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardIcon: {
        fontSize: 32,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        flexWrap: 'wrap',
        gap: 8,
    },
    diffBtnText: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    levelBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelBadgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    diffDesc: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 12,
        lineHeight: 20,
    },
    featuresList: {
        marginBottom: 15,
        gap: 6,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureIcon: {
        marginRight: 4,
    },
    featureText: {
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
    },
    startButtonContainer: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    startButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 120,
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    infoContainer: {
        paddingHorizontal: 20,
        marginTop: 30,
        gap: 12,
    },
    infoCard: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
        flex: 1,
    },
    factContainer: {
        marginTop: 30,
        marginHorizontal: 20,
        padding: 20,
        backgroundColor: '#FEF3E8',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFE4CC',
    },
    factTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },
    factItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
    },
    factEmoji: {
        fontSize: 20,
        width: 36,
    },
    factText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
    gameInstructions: {
        marginTop: 30,
        marginHorizontal: 20,
        padding: 20,
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#CCE5FF',
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    instructionItem: {
        flexDirection: 'row',
        marginBottom: 10,
        gap: 8,
    },
    instructionBullet: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: 'bold',
        width: 12,
    },
    instructionText: {
        flex: 1,
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
    instructionHighlight: {
        fontWeight: '700',
        color: '#FF6B6B',
    },
});

export default HumanBodyGamesIndex;