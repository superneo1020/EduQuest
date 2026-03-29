import React, {useMemo} from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.8;
const CENTER = CHART_SIZE / 2;
const RADIUS = CENTER * 0.7;

interface RadarData {
    label: string;
    value: number; // 0 to 1
}

export default function SkillRadarChart({ gameHistory }: { gameHistory: any[] }) {


    // 1. 邏輯：計算各科目熟練度 (0 ~ 100)
    const skills = useMemo(() => {
        const categories = [
            { key: 'MATH', label: 'Math' },
            { key: 'ENGLISH', label: 'English' },
            { key: 'SCIENCE', label: 'Science' },
            { key: 'MEMORY', label: 'Memory' }
        ];

        return categories.map(cat => {
            const scores = gameHistory
                .filter(g => g.gameType?.toUpperCase() === cat.key)
                .map(g => g.scores);

            // 假設 100 分是滿分，計算平均值
            const avg = scores.length > 0
                ? Math.min(scores.reduce((a, b) => a + b, 0) / scores.length, 100)
                : 20; // 沒玩過給點基礎分

            return { label: cat.label, value: avg / 100 };
        });
    }, [gameHistory]);

    // 2. 座標計算函式
    const getCoordinates = (index: number, total: number, value: number) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        return {
            x: CENTER + RADIUS * value * Math.cos(angle),
            y: CENTER + RADIUS * value * Math.sin(angle)
        };
    };

    const points = skills.map((s, i) => {
        const { x, y } = getCoordinates(i, skills.length, s.value);
        return `${x},${y}`;
    }).join(' ');

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Svg height={CHART_SIZE} width={CHART_SIZE}>
                <G>
                    {/* 背景網格：三個圓圈 */}
                    {[0.3, 0.6, 1].map((r, i) => (
                        <Circle key={i} cx={CENTER} cy={CENTER} r={RADIUS * r}
                                fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4" />
                    ))}

                    {/* 軸線與標籤 */}
                    {skills.map((s, i) => {
                        const end = getCoordinates(i, skills.length, 1);
                        const labelPos = getCoordinates(i, skills.length, 1.2);
                        return (
                            <G key={i}>
                                <Line x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="#E2E8F0" strokeWidth="1" />
                                <SvgText
                                    x={labelPos.x} y={labelPos.y}
                                    fill="#64748B" fontSize="12" fontWeight="bold"
                                    textAnchor="middle" alignmentBaseline="middle"
                                >
                                    {s.label}
                                </SvgText>
                            </G>
                        );
                    })}

                    {/* 雷達區域 */}
                    <Polygon
                        points={points}
                        fill="rgba(76, 175, 80, 0.2)"
                        stroke="#4CAF50"
                        strokeWidth="3"
                    />

                    {/* 頂點小圓點 */}
                    {skills.map((s, i) => {
                        const p = getCoordinates(i, skills.length, s.value);
                        return <Circle key={i} cx={p.x} cy={p.y} r="4" fill="#4CAF50" />;
                    })}
                </G>
            </Svg>
        </View>
    );
}