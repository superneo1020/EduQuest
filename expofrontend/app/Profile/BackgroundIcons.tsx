import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Ellipse, Rect, LinearGradient, Stop, Defs } from 'react-native-svg';

// Background icons using SVG patterns and designs
export const BackgroundIcons = {
    default: ({ size = 50, color = '#F0F4F8' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Rect width="100" height="100" fill={color} />
            <Circle cx="50" cy="50" r="30" fill="#E2E8F0" opacity="0.5" />
            <Circle cx="25" cy="25" r="15" fill="#CBD5E1" opacity="0.3" />
            <Circle cx="75" cy="75" r="20" fill="#CBD5E1" opacity="0.3" />
        </Svg>
    ),

    Space: ({ size = '100%' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <Defs>
                <LinearGradient id="spaceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#0F172A" />
                    <Stop offset="100%" stopColor="#1E293B" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#spaceGradient)" />
            <Circle cx="50" cy="50" r="15" fill="#FFD700" opacity="0.8" />
            <Circle cx="80" cy="20" r="3" fill="#fff" opacity="0.9" />
            <Circle cx="20" cy="30" r="2" fill="#fff" opacity="0.7" />
            <Circle cx="70" cy="80" r="2" fill="#fff" opacity="0.8" />
            <Circle cx="30" cy="70" r="3" fill="#fff" opacity="0.6" />
            <Circle cx="15" cy="85" r="1.5" fill="#fff" opacity="0.5" />
            <Circle cx="85" cy="60" r="1" fill="#fff" opacity="0.7" />
            <Path d="M 25 50 L 30 45 L 35 50 L 30 55 Z" fill="#FF69B4" opacity="0.6" />
            <Path d="M 65 30 L 70 25 L 75 30 L 70 35 Z" fill="#00CED1" opacity="0.5" />
        </Svg>
    ),

    Ocean: ({ size = '100%' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <Defs>
                <LinearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#006994" />
                    <Stop offset="50%" stopColor="#0099CC" />
                    <Stop offset="100%" stopColor="#00CED1" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#oceanGradient)" />
            <Path d="M 20 40 Q 35 35 50 40 T 80 40" stroke="#87CEEB" strokeWidth="3" fill="none" opacity="0.7" />
            <Path d="M 20 50 Q 35 45 50 50 T 80 50" stroke="#87CEEB" strokeWidth="3" fill="none" opacity="0.6" />
            <Path d="M 20 60 Q 35 55 50 60 T 80 60" stroke="#87CEEB" strokeWidth="3" fill="none" opacity="0.5" />
            <Path d="M 20 70 Q 35 65 50 70 T 80 70" stroke="#87CEEB" strokeWidth="3" fill="none" opacity="0.4" />
            <Circle cx="30" cy="75" r="2" fill="#fff" opacity="0.8" />
            <Circle cx="50" cy="80" r="2" fill="#fff" opacity="0.7" />
            <Circle cx="70" cy="75" r="2" fill="#fff" opacity="0.6" />
            <Ellipse cx="25" cy="25" rx="8" ry="4" fill="#FFD700" opacity="0.9" />
        </Svg>
    ),


    Forest: ({ size = 50, color = '#228B22' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="forestGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <Stop offset="0%" stopColor="#8B4513" />
                    <Stop offset="30%" stopColor="#228B22" />
                    <Stop offset="100%" stopColor="#90EE90" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#forestGradient)" />
            <Path d="M 50 20 L 35 40 L 65 40 Z" fill="#90EE90" opacity="0.8" />
            <Path d="M 50 30 L 40 45 L 60 45 Z" fill="#228B22" opacity="0.7" />
            <Rect x="45" y="45" width="10" height="20" fill="#8B4513" opacity="0.8" />
            <Path d="M 25 35 L 15 50 L 35 50 Z" fill="#32CD32" opacity="0.6" />
            <Path d="M 75 40 L 65 55 L 85 55 Z" fill="#32CD32" opacity="0.5" />
            <Circle cx="20" cy="70" r="3" fill="#FF6347" opacity="0.7" />
            <Circle cx="80" cy="75" r="2" fill="#FF6347" opacity="0.6" />
            <Circle cx="50" cy="80" r="2.5" fill="#FF6347" opacity="0.8" />
        </Svg>
    ),

    City: ({ size = 50, color = '#708090' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="cityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#FF6B35" />
                    <Stop offset="30%" stopColor="#708090" />
                    <Stop offset="100%" stopColor="#2C3E50" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#cityGradient)" />
            <Rect x="20" y="40" width="15" height="30" fill="#696969" opacity="0.8" />
            <Rect x="40" y="30" width="20" height="40" fill="#696969" opacity="0.8" />
            <Rect x="65" y="35" width="15" height="35" fill="#696969" opacity="0.8" />
            <Rect x="10" y="50" width="10" height="20" fill="#696969" opacity="0.7" />
            <Rect x="80" y="45" width="12" height="25" fill="#696969" opacity="0.7" />
            <Circle cx="25" cy="45" r="2" fill="#FFD700" opacity="0.9" />
            <Circle cx="45" cy="35" r="2" fill="#FFD700" opacity="0.9" />
            <Circle cx="70" cy="40" r="2" fill="#FFD700" opacity="0.9" />
            <Circle cx="15" cy="55" r="1.5" fill="#FFD700" opacity="0.8" />
            <Circle cx="85" cy="50" r="1.5" fill="#FFD700" opacity="0.8" />
            <Circle cx="50" cy="25" r="2" fill="#fff" opacity="0.7" />
        </Svg>
    ),

    // Database icon field mappings (with .png suffix)
    'Space.png': ({ size = 50, color = '#0F172A' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="spaceGradientPng" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#0F172A" />
                    <Stop offset="100%" stopColor="#1E293B" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#spaceGradientPng)" />
            <Circle cx="50" cy="50" r="15" fill="#FFD700" opacity="0.8" />
            <Circle cx="80" cy="20" r="3" fill="#fff" opacity="0.9" />
            <Circle cx="20" cy="30" r="2" fill="#fff" opacity="0.7" />
            <Circle cx="70" cy="80" r="2" fill="#fff" opacity="0.8" />
            <Circle cx="30" cy="70" r="3" fill="#fff" opacity="0.6" />
        </Svg>
    ),

    'Ocean.png': ({ size = 50, color = '#006994' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="oceanGradientPng" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#006994" />
                    <Stop offset="50%" stopColor="#0099CC" />
                    <Stop offset="100%" stopColor="#00CED1" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#oceanGradientPng)" />
            <Path d="M 20 40 Q 35 35 50 40 T 80 40" stroke="#87CEEB" strokeWidth="3" fill="none" opacity="0.7" />
            <Path d="M 20 50 Q 35 45 50 50 T 80 50" stroke="#87CEEB" strokeWidth="3" fill="none" opacity="0.6" />
            <Path d="M 20 60 Q 35 55 50 60 T 80 60" stroke="#87CEEB" strokeWidth="3" fill="none" opacity="0.5" />
        </Svg>
    ),

    'Forest.png': ({ size = 50, color = '#228B22' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="forestGradientPng" x1="0%" y1="100%" x2="0%" y2="0%">
                    <Stop offset="0%" stopColor="#8B4513" />
                    <Stop offset="30%" stopColor="#228B22" />
                    <Stop offset="100%" stopColor="#90EE90" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#forestGradientPng)" />
            <Path d="M 50 20 L 35 40 L 65 40 Z" fill="#90EE90" opacity="0.8" />
            <Path d="M 50 30 L 40 45 L 60 45 Z" fill="#228B22" opacity="0.7" />
            <Rect x="45" y="45" width="10" height="20" fill="#8B4513" opacity="0.8" />
        </Svg>
    ),

    'City.png': ({ size = 50, color = '#708090' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="cityGradientPng" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#FF6B35" />
                    <Stop offset="30%" stopColor="#708090" />
                    <Stop offset="100%" stopColor="#2C3E50" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#cityGradientPng)" />
            <Rect x="20" y="40" width="15" height="30" fill="#696969" opacity="0.8" />
            <Rect x="40" y="30" width="20" height="40" fill="#696969" opacity="0.8" />
            <Rect x="65" y="35" width="15" height="35" fill="#696969" opacity="0.8" />
        </Svg>
    ),

    // Aliases without .png suffix (for processedUserItems compatibility)
    'Space': ({ size = 50, color = '#0F172A' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="spaceGradientAlias" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#0F172A" />
                    <Stop offset="100%" stopColor="#1E293B" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#spaceGradientAlias)" />
            <Circle cx="50" cy="50" r="15" fill="#FFD700" opacity="0.8" />
            <Circle cx="80" cy="20" r="3" fill="#fff" opacity="0.9" />
            <Circle cx="20" cy="30" r="2" fill="#fff" opacity="0.7" />
            <Circle cx="70" cy="80" r="2" fill="#fff" opacity="0.8" />
            <Circle cx="30" cy="70" r="3" fill="#fff" opacity="0.6" />
        </Svg>
    ),

    'Ocean': ({ size = 50, color = '#006994' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="oceanGradientAlias" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#006994" />
                    <Stop offset="50%" stopColor="#0099CC" />
                    <Stop offset="100%" stopColor="#00CED1" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#oceanGradientAlias)" />
            <Path d="M 20 40 Q 35 35 50 40 T 80 40" stroke="#87CEEB" strokeWidth="3" fill="none" opacity="0.7" />
            <Path d="M 20 50 Q 35 45 50 50 T 80 50" stroke="#87CEEB" strokeWidth="3" fill="none" opacity="0.6" />
            <Path d="M 20 60 Q 35 55 50 60 T 80 60" stroke="#87CEEB" strokeWidth="3" fill="none" opacity="0.5" />
        </Svg>
    ),

    'Forest': ({ size = 50, color = '#228B22' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="forestGradientAlias" x1="0%" y1="100%" x2="0%" y2="0%">
                    <Stop offset="0%" stopColor="#8B4513" />
                    <Stop offset="30%" stopColor="#228B22" />
                    <Stop offset="100%" stopColor="#90EE90" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#forestGradientAlias)" />
            <Path d="M 50 20 L 35 40 L 65 40 Z" fill="#90EE90" opacity="0.8" />
            <Path d="M 50 30 L 40 45 L 60 45 Z" fill="#228B22" opacity="0.7" />
            <Rect x="45" y="45" width="10" height="20" fill="#8B4513" opacity="0.8" />
        </Svg>
    ),

    'City': ({ size = 50, color = '#708090' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
                <LinearGradient id="cityGradientAlias" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#FF6B35" />
                    <Stop offset="30%" stopColor="#708090" />
                    <Stop offset="100%" stopColor="#2C3E50" />
                </LinearGradient>
            </Defs>
            <Rect width="100" height="100" fill="url(#cityGradientAlias)" />
            <Rect x="20" y="40" width="15" height="30" fill="#696969" opacity="0.8" />
            <Rect x="40" y="30" width="20" height="40" fill="#696969" opacity="0.8" />
            <Rect x="65" y="35" width="15" height="35" fill="#696969" opacity="0.8" />
        </Svg>
    )
};
