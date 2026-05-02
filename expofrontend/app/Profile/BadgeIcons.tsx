import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Ellipse, Rect, Polygon } from 'react-native-svg';


// Badge icons using SVG with achievement-focused designs
export const BadgeIcons = {






    MathChampion: ({ size = 50, color = '#FF6B6B' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#FF0000" strokeWidth="3" />
            <Path d="M 35 35 L 65 35 L 65 65 L 35 65 Z" fill="#fff" stroke="#FF0000" strokeWidth="2" />
            <Path d="M 40 45 L 60 45" stroke="#000" strokeWidth="2" />
            <Path d="M 50 35 L 50 65" stroke="#000" strokeWidth="2" />
            <Path d="M 40 55 L 60 55" stroke="#000" strokeWidth="2" />
            <Circle cx="50" cy="50" r="3" fill="#FF6B6B" />
            <Path d="M 50 23 L 52 27 L 56 27 L 53 30 L 54 34 L 50 31 L 46 34 L 47 30 L 44 27 L 48 27 Z" fill="#FFD700" />
            <Path d="M 45 50 L 55 50 M 50 45 L 50 55" stroke="#000" strokeWidth="2" />
        </Svg>
    ),

    ReadingStar: ({ size = 50, color = '#4CAF50' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#2E7D32" strokeWidth="3" />
            <Path d="M 30 35 L 70 35 L 65 55 L 35 55 Z" fill="#8B4513" />
            <Rect x="32" y="37" width="36" height="16" fill="#FFF8DC" />
            <Path d="M 50 37 L 50 53" stroke="#000" strokeWidth="1" />
            <Path d="M 37 42 L 43 42" stroke="#000" strokeWidth="1" />
            <Path d="M 57 42 L 63 42" stroke="#000" strokeWidth="1" />
            <Path d="M 37 47 L 43 47" stroke="#000" strokeWidth="1" />
            <Path d="M 57 47 L 63 47" stroke="#000" strokeWidth="1" />
            <Path d="M 50 17 L 54 25 L 62 25 L 56 30 L 58 38 L 50 33 L 42 38 L 44 30 L 38 25 L 46 25 Z" fill="#FFD700" />
        </Svg>
    ),

    ScienceExplorer: ({ size = 50, color = '#9C27B0' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#7B1FA2" strokeWidth="3" />
            <Circle cx="50" cy="45" r="12" fill="#87CEEB" stroke="#4682B4" strokeWidth="2" />
            <Rect x="48" y="57" width="4" height="8" fill="#708090" />
            <Rect x="40" y="65" width="20" height="4" fill="#708090" />
            <Circle cx="45" cy="45" r="3" fill="#fff" />
            <Circle cx="55" cy="45" r="3" fill="#fff" />
            <Circle cx="50" cy="45" r="2" fill="#000" />
            <Path d="M 50 19 L 53 25 L 59 25 L 54 29 L 56 35 L 50 31 L 44 35 L 46 29 L 41 25 L 47 25 Z" fill="#FFD700" />
        </Svg>
    ),

    MemoryMaster: ({ size = 50, color = '#FF9800' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#F57C00" strokeWidth="3" />
            <Path d="M 35 40 Q 25 50 35 60 Q 50 65 65 60 Q 75 50 65 40 Q 50 35 35 40" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="2" />
            <Circle cx="40" cy="45" r="3" fill="#000" />
            <Circle cx="60" cy="45" r="3" fill="#000" />
            <Circle cx="50" cy="55" r="2" fill="#000" />
            <Path d="M 42 50 Q 50 52 58 50" stroke="#000" strokeWidth="1" fill="none" />
            <Path d="M 50 18 L 53 24 L 59 24 L 54 28 L 56 34 L 50 30 L 44 34 L 46 28 L 41 24 L 47 24 Z" fill="#FFD700" />
        </Svg>
    ),

    // Database icon field mappings (with .png suffix)
    'Trophy.png': ({ size = 50, color = '#FFD700' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#FFA500" strokeWidth="3" />
            <Path d="M 35 35 L 35 50 Q 35 60 50 60 Q 65 60 65 50 L 65 35 Z" fill="#FFA500" />
            <Rect x="45" y="60" width="10" height="15" fill="#8B4513" />
            <Rect x="40" y="75" width="20" height="5" fill="#8B4513" />
            <Circle cx="30" cy="40" r="3" fill="#FFD700" />
            <Circle cx="70" cy="40" r="3" fill="#FFD700" />
            <Path d="M 50 38 L 52 42 L 56 42 L 53 45 L 54 49 L 50 46 L 46 49 L 47 45 L 44 42 L 48 42 Z" fill="#fff" />
        </Svg>
    ),

    'Book.png': ({ size = 50, color = '#8B4513' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#654321" strokeWidth="3" />
            <Rect x="25" y="30" width="50" height="35" rx="2" fill="#FF6347" />
            <Rect x="30" y="35" width="40" height="25" fill="#FFF8DC" />
            <Path d="M 50 35 L 50 60" stroke="#000" strokeWidth="1" />
            <Path d="M 35 40 L 45 40" stroke="#000" strokeWidth="1" />
            <Path d="M 55 40 L 65 40" stroke="#000" strokeWidth="1" />
            <Path d="M 50 44 L 52 48 L 56 48 L 53 51 L 54 55 L 50 52 L 46 55 L 47 51 L 44 48 L 48 48 Z" fill="#FFD700" />
        </Svg>
    ),

    'Microscope.png': ({ size = 50, color = '#4169E1' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#1E90FF" strokeWidth="3" />
            <Rect x="45" y="25" width="10" height="30" fill="#708090" />
            <Circle cx="50" cy="25" r="8" fill="#87CEEB" />
            <Rect x="40" y="50" width="20" height="5" fill="#708090" />
            <Rect x="35" y="55" width="30" height="15" fill="#708090" />
            <Path d="M 25 65 L 75 65" stroke="#000" strokeWidth="2" />
            <Path d="M 50 44 L 52 48 L 56 48 L 53 51 L 54 55 L 50 52 L 46 55 L 47 51 L 44 48 L 48 48 Z" fill="#FFD700" />
        </Svg>
    ),

    'Brain.png': ({ size = 50, color = '#FF69B4' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#FF1493" strokeWidth="3" />
            <Path d="M 35 40 Q 25 45 30 55 Q 35 60 45 55" fill="#FFB6C1" />
            <Path d="M 65 40 Q 75 45 70 55 Q 65 60 55 55" fill="#FFB6C1" />
            <Path d="M 40 45 Q 50 40 60 45" fill="#FFB6C1" />
            <Circle cx="35" cy="50" r="2" fill="#000" />
            <Circle cx="65" cy="50" r="2" fill="#000" />
            <Path d="M 50 44 L 52 48 L 56 48 L 53 51 L 54 55 L 50 52 L 46 55 L 47 51 L 44 48 L 48 48 Z" fill="#FFD700" />
        </Svg>
    ),

    // Aliases without .png suffix (for processedUserItems compatibility)
    'Trophy': ({ size = 50, color = '#FFD700' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#FFA500" strokeWidth="3" />
            <Path d="M 35 35 L 35 50 Q 35 60 50 60 Q 65 60 65 50 L 65 35 Z" fill="#FFA500" />
            <Rect x="45" y="60" width="10" height="15" fill="#8B4513" />
            <Rect x="40" y="75" width="20" height="5" fill="#8B4513" />
            <Circle cx="30" cy="40" r="3" fill="#FFD700" />
            <Circle cx="70" cy="40" r="3" fill="#FFD700" />
            <Path d="M 50 38 L 52 42 L 56 42 L 53 45 L 54 49 L 50 46 L 46 49 L 47 45 L 44 42 L 48 42 Z" fill="#fff" />
        </Svg>
    ),

    'Book': ({ size = 50, color = '#8B4513' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#654321" strokeWidth="3" />
            <Rect x="25" y="30" width="50" height="35" rx="2" fill="#FF6347" />
            <Rect x="30" y="35" width="40" height="25" fill="#FFF8DC" />
            <Path d="M 50 35 L 50 60" stroke="#000" strokeWidth="1" />
            <Path d="M 35 40 L 45 40" stroke="#000" strokeWidth="1" />
            <Path d="M 55 40 L 65 40" stroke="#000" strokeWidth="1" />
            <Path d="M 50 44 L 52 48 L 56 48 L 53 51 L 54 55 L 50 52 L 46 55 L 47 51 L 44 48 L 48 48 Z" fill="#FFD700" />
        </Svg>
    ),

    'Microscope': ({ size = 50, color = '#4169E1' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#1E90FF" strokeWidth="3" />
            <Rect x="45" y="25" width="10" height="30" fill="#708090" />
            <Circle cx="50" cy="25" r="8" fill="#87CEEB" />
            <Rect x="40" y="50" width="20" height="5" fill="#708090" />
            <Rect x="35" y="55" width="30" height="15" fill="#708090" />
            <Path d="M 25 65 L 75 65" stroke="#000" strokeWidth="2" />
            <Path d="M 50 44 L 52 48 L 56 48 L 53 51 L 54 55 L 50 52 L 46 55 L 47 51 L 44 48 L 48 48 Z" fill="#FFD700" />
        </Svg>
    ),

    'Brain': ({ size = 50, color = '#FF69B4' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#FF1493" strokeWidth="3" />
            <Path d="M 35 40 Q 25 45 30 55 Q 35 60 45 55" fill="#FFB6C1" />
            <Path d="M 65 40 Q 75 45 70 55 Q 65 60 55 55" fill="#FFB6C1" />
            <Path d="M 40 45 Q 50 40 60 45" fill="#FFB6C1" />
            <Circle cx="35" cy="50" r="2" fill="#000" />
            <Circle cx="65" cy="50" r="2" fill="#000" />
            <Path d="M 50 44 L 52 48 L 56 48 L 53 51 L 54 55 L 50 52 L 46 55 L 47 51 L 44 48 L 48 48 Z" fill="#FFD700" />
        </Svg>
    ),

    'ScienceGlasses': ({ size = 50, color = '#4169E1' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#1E90FF" strokeWidth="3" />
            <Circle cx="35" cy="45" r="12" fill="#87CEEB" stroke="#4682B4" strokeWidth="2" />
            <Circle cx="65" cy="45" r="12" fill="#87CEEB" stroke="#4682B4" strokeWidth="2" />
            <Path d="M 47 45 L 53 45" stroke="#708090" strokeWidth="3" />
            <Path d="M 35 33 L 35 57" stroke="#708090" strokeWidth="2" />
            <Path d="M 65 33 L 65 57" stroke="#708090" strokeWidth="2" />
            <Path d="M 23 45 L 35 45" stroke="#708090" strokeWidth="2" />
            <Path d="M 65 45 L 77 45" stroke="#708090" strokeWidth="2" />
            <Circle cx="35" cy="45" r="4" fill="#fff" />
            <Circle cx="65" cy="45" r="4" fill="#fff" />
            <Circle cx="35" cy="45" r="2" fill="#000" />
            <Circle cx="65" cy="45" r="2" fill="#000" />
            <Path d="M 50 19 L 53 25 L 59 25 L 54 29 L 56 35 L 50 31 L 44 35 L 46 29 L 41 25 L 47 25 Z" fill="#FFD700" />
        </Svg>
    ),

    'SportsJersey': ({ size = 50, color = '#FF6B6B' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#FF0000" strokeWidth="3" />
            <Path d="M 40 30 L 40 45 L 35 50 L 35 65 L 65 65 L 65 50 L 60 45 L 60 30 Z" fill="#fff" stroke="#FF0000" strokeWidth="2" />
            <Path d="M 40 35 L 60 35 L 60 40 L 40 40 Z" fill="#FF6B6B" />
            <Path d="M 45 45 L 55 45 L 55 50 L 45 50 Z" fill="#FF6B6B" />
            <Path d="M 42 52 L 58 52 L 58 57 L 42 57 Z" fill="#FF6B6B" />
            <Circle cx="50" cy="47" r="2" fill="#fff" />
            <Path d="M 50 18 L 53 24 L 59 24 L 54 28 L 56 34 L 50 30 L 44 34 L 46 28 L 41 24 L 47 24 Z" fill="#FFD700" />
        </Svg>
    ),

    // Default badge icon
    default: ({ size = 50, color = '#FFD700' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} stroke="#FFA500" strokeWidth="3" />
            <Path d="M 50 38 L 52 42 L 56 42 L 53 45 L 54 49 L 50 46 L 46 49 L 47 45 L 44 42 L 48 42 Z" fill="#fff" />
        </Svg>
    )
};
