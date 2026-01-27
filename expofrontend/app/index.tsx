import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    useWindowDimensions,
    SafeAreaView,
    Platform
} from 'react-native';
import { Calculator, Languages, Atom, Brain, User, Trophy, Clock, Target } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function LandscapeOptimizedHome() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();

    // 判斷是否為橫屏
    const isLandscape = width > height;

    const gameButtons = [
        { id: 1, title: 'Math', icon: Calculator, color: '#4CAF50', route: '/games/math/math', pos: { x: '20%', y: '25%' } },
        { id: 2, title: 'Language', icon: Languages, color: '#2196F3', route: '/games/english/language', pos: { x: '70%', y: '20%' } },
        { id: 3, title: 'Science', icon: Atom, color: '#FF9800', route: '/games/science', pos: { x: '25%', y: '65%' } },
        { id: 4, title: 'Memory', icon: Brain, color: '#9C27B0', route: '/games/memory/memory',  pos: { x: '75%', y: '60%' } },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header - 保持簡潔 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>EduQuest</Text>
                <TouchableOpacity onPress={() => router.push('/Profile/profile' as any)}>
                                                    <User size={22} color="#333" />
                                                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/Profile/Welcome' as any)}>
                    <User size={22} color="#333" />
                </TouchableOpacity>

            </View>

            {/* 主內容區：橫屏時左右排列 */}
            <View style={[styles.mainContent, isLandscape ? { flexDirection: 'row' } : { flexDirection: 'column' }]}>

                {/* 左側或中間：地圖區域 */}
                {/* 左側或中間：地圖區域 */}
                <View style={styles.mapSection}>
                    <ImageBackground
                        source={require('../assets/images/map.jpg')}
                        style={styles.mapImage}
                        resizeMode="cover"
                    >
                        {gameButtons.map((button) => {
                            const IconComponent = button.icon; // 提取圖標組件
                            return (
                                <TouchableOpacity
                                    key={button.id}
                                    style={[
                                        styles.gameButton,
                                        { backgroundColor: button.color, left: button.pos.x as any, top: button.pos.y as any }
                                    ]}
                                    // 修復這裡：加入跳轉邏輯
                                    onPress={() => router.push(button.route as any)}
                                >
                                    <IconComponent size={24} color="white" />
                                    <Text style={styles.buttonText}>{button.title}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ImageBackground>
                </View>

                {/* 右側：任務與數據面板 (橫屏時變窄，直屏時在下方) */}
                <View style={[styles.sidePanel, isLandscape ? { width: 250 } : { height: 200 }]}>
                    <Text style={styles.panelTitle}>Progress</Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.miniStat}>
                            <Trophy size={18} color="#FFD700" />
                            <Text style={styles.statVal}>150</Text>
                        </View>
                        <View style={styles.miniStat}>
                            <Clock size={18} color="#2196F3" />
                            <Text style={styles.statVal}>45m</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.panelTitle}>Daily Quest</Text>
                    <TouchableOpacity style={styles.questCard}>
                        <Target size={20} color="#FF4757" />
                        <View style={{marginLeft: 10}}>
                            <Text style={styles.questTitle}>Math Mountain</Text>
                            <Text style={styles.questSub}>Earn 20 XP</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    header: {
        height: 50,
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    mainContent: {
        flex: 1, // 填滿 Header 以下所有空間
    },
    mapSection: {
        flex: 1, // 地圖佔據主要空間
        backgroundColor: '#ddd',
        overflow: 'hidden',
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    sidePanel: {
        backgroundColor: 'white',
        padding: 15,
        // 橫屏時加上左邊框
        borderLeftWidth: 1,
        borderLeftColor: '#eee',
    },
    panelTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#636E72',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    miniStat: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: 8,
        borderRadius: 10,
        width: '48%',
    },
    statVal: {
        marginLeft: 5,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    questCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FFE3E3',
    },
    questTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    questSub: {
        fontSize: 12,
        color: '#888',
    },
    gameButton: {
        position: 'absolute',
        width: 66,
        height: 66,
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        transform: [{ translateX: -33 }, { translateY: -33 }],
        elevation: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    }
});