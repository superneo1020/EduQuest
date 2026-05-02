import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.35; // Reduced size (originally 0.5)
const CENTER = CHART_SIZE / 2;
const RADIUS = CENTER * 0.65; // Reduce radius ratio for more compact graph

interface RadarData {
    label: string;
    value: number; // 0 to 1
}

export default function SkillRadarChart({ gameHistory }: { gameHistory: any[] }) {

    const skills = useMemo(() => {
        const gameTypes = [...new Set(gameHistory.map(g => g.type?.toUpperCase()).filter(Boolean))];

        const categories = gameTypes.length > 0
            ? gameTypes.map(type => ({ key: type, label: type.charAt(0) + type.slice(1).toLowerCase() }))
            : [
                { key: 'MATH', label: 'Math' },
                { key: 'ENGLISH', label: 'English' },
                { key: 'SCIENCE', label: 'Science' },
                { key: 'CHINESE', label: 'Chinese' }
            ];

        return categories.map(cat => {
            const scores = gameHistory
                .filter(g => g.type?.toUpperCase() === cat.key)
                .map(g => g.scores || 0);

            let avg = 0;
            if (scores.length > 0) {
                avg = scores.reduce((a, b) => a + b, 0) / scores.length;

                const difficultyBonus = gameHistory
                    .filter(g => g.type?.toUpperCase() === cat.key)
                    .reduce((bonus, g) => {
                        switch(g.difficulty?.toUpperCase()) {
                            case 'HARD': return bonus + 10;
                            case 'MEDIUM': return bonus + 5;
                            default: return bonus;
                        }
                    }, 0) / scores.length;

                avg = Math.min(avg + difficultyBonus, 100);
            }

            return { label: cat.label, value: avg / 100 };
        });
    }, [gameHistory]);

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
                    {/* Background grid: three circles */}
                    {[0.3, 0.6, 1].map((r, i) => (
                        <Circle key={i} cx={CENTER} cy={CENTER} r={RADIUS * r}
                                fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3" />
                    ))}

                    {/* Axes and labels */}
                    {skills.map((s, i) => {
                        const end = getCoordinates(i, skills.length, 1);
                        const labelPos = getCoordinates(i, skills.length, 1.15);
                        return (
                            <G key={i}>
                                <Line x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="#E2E8F0" strokeWidth="0.8" />
                                <SvgText
                                    x={labelPos.x} y={labelPos.y}
                                    fill="#64748B" fontSize="10" fontWeight="bold"
                                    textAnchor="middle" alignmentBaseline="middle"
                                >
                                    {s.label}
                                </SvgText>
                            </G>
                        );
                    })}

                    {/* Radar area */}
                    <Polygon
                        points={points}
                        fill="rgba(76, 175, 80, 0.2)"
                        stroke="#4CAF50"
                        strokeWidth="2"
                    />

                    {/* Vertex dots */}
                    {skills.map((s, i) => {
                        const p = getCoordinates(i, skills.length, s.value);
                        return <Circle key={i} cx={p.x} cy={p.y} r="3" fill="#4CAF50" />;
                    })}
                </G>
            </Svg>
        </View>
    );
}