import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Ellipse, Rect } from 'react-native-svg';

// Elementary school style avatar icons using SVG paths
export const AvatarIcons = {
    default: ({ size = 50, color = '#636E72' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="45" fill={color} />
            <Circle cx="35" cy="40" r="5" fill="#fff" />
            <Circle cx="65" cy="40" r="5" fill="#fff" />
            <Path d="M 35 60 Q 50 70 65 60" stroke="#fff" strokeWidth="3" fill="none" />
        </Svg>
    ),
    
    happy_cat: ({ size = 50, color = '#FFD93D' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="45" fill={color} />
            <Path d="M 25 30 L 35 45 L 20 40 Z" fill={color} />
            <Path d="M 75 30 L 65 45 L 80 40 Z" fill={color} />
            <Circle cx="35" cy="45" r="4" fill="#000" />
            <Circle cx="65" cy="45" r="4" fill="#000" />
            <Path d="M 30 60 Q 50 75 70 60" stroke="#000" strokeWidth="3" fill="none" />
            <Path d="M 50 60 L 50 65" stroke="#000" strokeWidth="2" />
            <Path d="M 45 65 L 50 70 L 55 65" stroke="#000" strokeWidth="2" fill="none" />
        </Svg>
    ),
    
    cool_dog: ({ size = 50, color = '#4ECDC4' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Ellipse cx="50" cy="50" rx="40" ry="35" fill={color} />
            <Ellipse cx="25" cy="35" rx="8" ry="12" fill={color} />
            <Ellipse cx="75" cy="35" rx="8" ry="12" fill={color} />
            <Circle cx="35" cy="45" r="4" fill="#000" />
            <Circle cx="65" cy="45" r="4" fill="#000" />
            <Ellipse cx="50" cy="65" rx="8" ry="6" fill="#000" />
            <Path d="M 30 75 Q 50 85 70 75" stroke="#000" strokeWidth="2" fill="none" />
        </Svg>
    ),
    
    smart_owl: ({ size = 50, color = '#9B59B6' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Ellipse cx="50" cy="55" rx="35" ry="30" fill={color} />
            <Path d="M 25 25 L 35 40 L 15 35 Z" fill={color} />
            <Path d="M 75 25 L 65 40 L 85 35 Z" fill={color} />
            <Circle cx="35" cy="50" r="8" fill="#fff" />
            <Circle cx="65" cy="50" r="8" fill="#fff" />
            <Circle cx="35" cy="50" r="4" fill="#000" />
            <Circle cx="65" cy="50" r="4" fill="#000" />
            <Path d="M 35 65 Q 50 70 65 65" stroke="#FFD93D" strokeWidth="3" fill="none" />
        </Svg>
    ),
    
    sporty_rabbit: ({ size = 50, color = '#FF6B6B' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Ellipse cx="50" cy="60" rx="30" ry="25" fill={color} />
            <Ellipse cx="35" cy="30" rx="6" ry="20" fill={color} />
            <Ellipse cx="65" cy="30" rx="6" ry="20" fill={color} />
            <Circle cx="35" cy="30" r="4" fill={color} />
            <Circle cx="65" cy="30" r="4" fill={color} />
            <Circle cx="40" cy="55" r="3" fill="#000" />
            <Circle cx="60" cy="55" r="3" fill="#000" />
            <Path d="M 45 65 Q 50 70 55 65" stroke="#000" strokeWidth="2" fill="none" />
            <Circle cx="25" cy="65" r="3" fill="#fff" />
            <Circle cx="75" cy="65" r="3" fill="#fff" />
        </Svg>
    ),
    
    artistic_butterfly: ({ size = 50, color = '#FF9FF3' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Ellipse cx="50" cy="50" rx="8" ry="20" fill={color} />
            <Ellipse cx="30" cy="40" rx="15" ry="20" fill={color} opacity="0.8" />
            <Ellipse cx="70" cy="40" rx="15" ry="20" fill={color} opacity="0.8" />
            <Ellipse cx="30" cy="60" rx="12" ry="15" fill={color} opacity="0.7" />
            <Ellipse cx="70" cy="60" rx="12" ry="15" fill={color} opacity="0.7" />
            <Circle cx="45" cy="45" r="2" fill="#000" />
            <Circle cx="55" cy="45" r="2" fill="#000" />
            <Path d="M 50 50 L 50 55" stroke="#000" strokeWidth="1" />
        </Svg>
    ),
    
    bookworm_bear: ({ size = 50, color = '#54A0FF' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="35" fill={color} />
            <Circle cx="30" cy="40" r="5" fill="#000" />
            <Circle cx="70" cy="40" r="5" fill="#000" />
            <Ellipse cx="50" cy="65" rx="10" ry="8" fill="#000" />
            <Rect x="35" y="75" width="30" height="20" rx="2" fill="#8B4513" />
            <Rect x="37" y="77" width="26" height="16" fill="#FFF8DC" />
            <Path d="M 40 80 L 60 80" stroke="#000" strokeWidth="1" />
            <Path d="M 40 83 L 60 83" stroke="#000" strokeWidth="1" />
            <Path d="M 40 86 L 55 86" stroke="#000" strokeWidth="1" />
        </Svg>
    ),
    
    explorer_monkey: ({ size = 50, color = '#1DD1A1' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="35" fill={color} />
            <Circle cx="35" cy="40" r="4" fill="#000" />
            <Circle cx="65" cy="40" r="4" fill="#000" />
            <Ellipse cx="50" cy="60" rx="8" ry="6" fill="#000" />
            <Path d="M 25 35 Q 15 25 10 30" stroke={color} strokeWidth="4" />
            <Path d="M 75 35 Q 85 25 90 30" stroke={color} strokeWidth="4" />
            <Circle cx="10" cy="30" r="3" fill={color} />
            <Circle cx="90" cy="30" r="3" fill={color} />
            <Path d="M 40 65 Q 50 70 60 65" stroke="#000" strokeWidth="2" fill="none" />
        </Svg>
    ),
    
    star_student: ({ size = 50, color = '#FFA502' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 50 15 L 55 30 L 70 30 L 58 40 L 63 55 L 50 45 L 37 55 L 42 40 L 30 30 L 45 30 Z" fill="#FFD700" />
            <Circle cx="40" cy="60" r="3" fill="#000" />
            <Circle cx="60" cy="60" r="3" fill="#000" />
            <Path d="M 45 70 Q 50 75 55 70" stroke="#000" strokeWidth="2" fill="none" />
        </Svg>
    ),
    
    rainbow_unicorn: ({ size = 50, color = '#A29BFE' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Ellipse cx="50" cy="60" rx="30" ry="25" fill={color} />
            <Path d="M 30 40 L 35 20 L 40 40 Z" fill={color} />
            <Path d="M 70 40 L 65 20 L 60 40 Z" fill={color} />
            <Path d="M 25 20 Q 50 10 75 20" stroke="#FF0000" strokeWidth="3" fill="none" />
            <Path d="M 25 25 Q 50 15 75 25" stroke="#FFA500" strokeWidth="3" fill="none" />
            <Path d="M 25 30 Q 50 20 75 30" stroke="#FFFF00" strokeWidth="3" fill="none" />
            <Path d="M 25 35 Q 50 25 75 35" stroke="#00FF00" strokeWidth="3" fill="none" />
            <Circle cx="40" cy="55" r="3" fill="#000" />
            <Circle cx="60" cy="55" r="3" fill="#000" />
            <Path d="M 45 65 Q 50 70 55 65" stroke="#000" strokeWidth="2" fill="none" />
        </Svg>
    ),
    
    rocket_raccoon: ({ size = 50, color = '#FF6348' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="35" fill={color} />
            <Path d="M 45 25 L 50 15 L 55 25 Z" fill="#708090" />
            <Rect x="48" y="10" width="4" height="10" fill="#FF0000" />
            <Path d="M 20 40 Q 10 35 5 40" stroke="#000" strokeWidth="3" />
            <Path d="M 80 40 Q 90 35 95 40" stroke="#000" strokeWidth="3" />
            <Circle cx="35" cy="45" r="4" fill="#000" />
            <Circle cx="65" cy="45" r="4" fill="#000" />
            <Ellipse cx="50" cy="65" rx="8" ry="6" fill="#000" />
            <Path d="M 40 75 L 45 85 L 50 75 L 55 85 L 60 75" stroke="#FFD700" strokeWidth="2" fill="none" />
        </Svg>
    ),
    
    heart_panda: ({ size = 50, color = '#FF4757' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill="#fff" />
            <Circle cx="35" cy="35" r="8" fill="#000" />
            <Circle cx="65" cy="35" r="8" fill="#000" />
            <Circle cx="35" cy="35" r="4" fill="#fff" />
            <Circle cx="65" cy="35" r="4" fill="#fff" />
            <Ellipse cx="50" cy="60" rx="12" ry="10" fill="#000" />
            <Path d="M 50 70 Q 50 75 50 70" stroke="#000" strokeWidth="2" />
            <Path d="M 25 25 Q 15 15 10 20 Q 5 25 15 30 Z" fill={color} />
            <Path d="M 75 25 Q 85 15 90 20 Q 95 25 85 30 Z" fill={color} />
        </Svg>
    ),
    
    sunshine_bee: ({ size = 50, color = '#FFA500' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Circle cx="50" cy="50" r="25" fill="#FFD700" />
            <Circle cx="35" cy="45" r="3" fill="#000" />
            <Circle cx="65" cy="45" r="3" fill="#000" />
            <Path d="M 40 55 Q 50 60 60 55" stroke="#000" strokeWidth="2" fill="none" />
            <Path d="M 90 50 L 95 45 L 95 55 Z" fill="#fff" />
            <Path d="M 10 50 L 5 45 L 5 55 Z" fill="#fff" />
            <Path d="M 50 10 L 45 5 L 55 5 Z" fill="#fff" />
            <Path d="M 50 90 L 45 95 L 55 95 Z" fill="#fff" />
            <Path d="M 75 25 L 80 20 L 85 25 L 80 30 Z" fill="#fff" />
            <Path d="M 25 25 L 20 20 L 15 25 L 20 30 Z" fill="#fff" />
            <Path d="M 75 75 L 80 80 L 85 75 L 80 70 Z" fill="#fff" />
            <Path d="M 25 75 L 20 80 L 15 75 L 20 70 Z" fill="#fff" />
        </Svg>
    ),
    
    moon_turtle: ({ size = 50, color = '#3498DB' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Ellipse cx="50" cy="55" rx="35" ry="30" fill={color} />
            <Path d="M 20 30 Q 25 20 30 30" fill={color} />
            <Circle cx="25" cy="25" r="8" fill="#F0E68C" />
            <Circle cx="35" cy="45" r="3" fill="#000" />
            <Circle cx="65" cy="45" r="3" fill="#000" />
            <Path d="M 40 55 Q 50 60 60 55" stroke="#000" strokeWidth="2" fill="none" />
            <Ellipse cx="50" cy="70" rx="15" ry="10" fill="#2E8B57" />
            <Path d="M 40 75 L 45 80 L 50 75 L 55 80 L 60 75" stroke="#000" strokeWidth="1" fill="none" />
        </Svg>
    ),
    
    flower_ladybug: ({ size = 50, color = '#E91E63' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="35" fill="#FF0000" />
                        <Circle cx="40" cy="40" r="5" fill="#000" />
            <Circle cx="60" cy="40" r="5" fill="#000" />
            <Circle cx="40" cy="60" r="5" fill="#000" />
            <Circle cx="60" cy="60" r="5" fill="#000" />
            <Circle cx="35" cy="45" r="2" fill="#000" />
            <Circle cx="65" cy="45" r="2" fill="#000" />
            <Path d="M 25 25 Q 35 15 45 25" fill="#FFB6C1" />
            <Path d="M 75 25 Q 65 15 55 25" fill="#FFB6C1" />
            <Path d="M 25 75 Q 35 85 45 75" fill="#FFB6C1" />
            <Path d="M 75 75 Q 65 85 55 75" fill="#FFB6C1" />
            <Path d="M 15 50 Q 5 40 15 30" fill="#FFB6C1" />
            <Path d="M 85 50 Q 95 40 85 30" fill="#FFB6C1" />
        </Svg>
    ),
    
    rainbow_frog: ({ size = 50, color = '#00BCD4' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Ellipse cx="50" cy="60" rx="35" ry="30" fill={color} />
            <Circle cx="35" cy="50" r="4" fill="#000" />
            <Circle cx="65" cy="50" r="4" fill="#000" />
            <Ellipse cx="50" cy="70" rx="10" ry="8" fill="#000" />
            <Path d="M 45 75 Q 50 80 55 75" stroke="#000" strokeWidth="2" fill="none" />
            <Ellipse cx="25" cy="40" rx="8" ry="6" fill="#FF0000" />
            <Ellipse cx="75" cy="40" rx="8" ry="6" fill="#FF0000" />
            <Path d="M 20 35 Q 50 25 80 35" stroke="#FFA500" strokeWidth="3" fill="none" />
            <Path d="M 20 40 Q 50 30 80 40" stroke="#FFFF00" strokeWidth="3" fill="none" />
            <Path d="M 20 45 Q 50 35 80 45" stroke="#00FF00" strokeWidth="3" fill="none" />
        </Svg>
    ),
    
    cloud_sheep: ({ size = 50, color = '#ECF0F1' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Circle cx="35" cy="40" r="15" fill="#fff" />
            <Circle cx="65" cy="40" r="15" fill="#fff" />
            <Circle cx="50" cy="30" r="12" fill="#fff" />
            <Circle cx="35" cy="55" r="12" fill="#fff" />
            <Circle cx="65" cy="55" r="12" fill="#fff" />
            <Circle cx="50" cy="65" r="10" fill="#fff" />
            <Circle cx="40" cy="45" r="3" fill="#000" />
            <Circle cx="60" cy="45" r="3" fill="#000" />
            <Path d="M 45 55 Q 50 60 55 55" stroke="#000" strokeWidth="2" fill="none" />
        </Svg>
    ),
    
    apple_teacher: ({ size = 50, color = '#27AE60' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Ellipse cx="50" cy="60" rx="25" ry="20" fill="#FF0000" />
            <Path d="M 50 40 L 50 45" stroke="#8B4513" strokeWidth="3" />
            <Path d="M 45 42 Q 50 38 55 42" stroke="#228B22" strokeWidth="2" fill="none" />
            <Circle cx="40" cy="55" r="3" fill="#000" />
            <Circle cx="60" cy="55" r="3" fill="#000" />
            <Path d="M 45 65 Q 50 70 55 65" stroke="#000" strokeWidth="2" fill="none" />
        </Svg>
    ),
    
    pencil_wizard: ({ size = 50, color = '#8E44AD' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 45 25 L 55 25 L 55 75 L 45 75 Z" fill="#FFD700" />
            <Path d="M 45 25 L 50 15 L 55 25 Z" fill="#FF69B4" />
            <Path d="M 45 75 L 50 85 L 55 75 Z" fill="#FF69B4" />
            <Circle cx="50" cy="35" r="3" fill="#000" />
            <Circle cx="50" cy="45" r="3" fill="#000" />
            <Path d="M 40 55 Q 50 60 60 55" stroke="#000" strokeWidth="2" fill="none" />
            <Path d="M 30 30 Q 20 20 10 25" stroke="#FFD700" strokeWidth="2" />
            <Path d="M 70 30 Q 80 20 90 25" stroke="#FFD700" strokeWidth="2" />
            <Path d="M 30 70 Q 20 80 10 75" stroke="#FFD700" strokeWidth="2" />
            <Path d="M 70 70 Q 80 80 90 75" stroke="#FFD700" strokeWidth="2" />
        </Svg>
    ),
    
    crayon_dragon: ({ size = 50, color = '#E74C3C' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Ellipse cx="50" cy="50" rx="35" ry="30" fill={color} />
            <Path d="M 30 35 L 25 20 L 35 30 Z" fill={color} />
            <Path d="M 70 35 L 75 20 L 65 30 Z" fill={color} />
            <Circle cx="35" cy="45" r="4" fill="#000" />
            <Circle cx="65" cy="45" r="4" fill="#000" />
            <Path d="M 30 55 Q 50 65 70 55" stroke="#000" strokeWidth="3" fill="none" />
            <Path d="M 45 65 L 50 70 L 55 65" stroke="#FFA500" strokeWidth="2" fill="none" />
            <Path d="M 80 60 Q 90 65 85 70" stroke="#FFD700" strokeWidth="3" fill="none" />
            <Path d="M 20 60 Q 10 65 15 70" stroke="#FFD700" strokeWidth="3" fill="none" />
        </Svg>
    ),

    // Additional icon mappings for backend compatibility
    Space: ({ size = 50, color = '#4A90E2' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Circle cx="50" cy="50" r="15" fill="#FFD700" />
            <Circle cx="80" cy="20" r="3" fill="#fff" />
            <Circle cx="20" cy="30" r="2" fill="#fff" />
            <Circle cx="70" cy="80" r="2" fill="#fff" />
            <Circle cx="30" cy="70" r="3" fill="#fff" />
        </Svg>
    ),

    Ocean: ({ size = 50, color = '#006994' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 20 40 Q 35 35 50 40 T 80 40" stroke="#00CED1" strokeWidth="3" fill="none" />
            <Path d="M 20 50 Q 35 45 50 50 T 80 50" stroke="#00CED1" strokeWidth="3" fill="none" />
            <Path d="M 20 60 Q 35 55 50 60 T 80 60" stroke="#00CED1" strokeWidth="3" fill="none" />
            <Circle cx="30" cy="70" r="2" fill="#fff" />
            <Circle cx="50" cy="75" r="2" fill="#fff" />
            <Circle cx="70" cy="70" r="2" fill="#fff" />
        </Svg>
    ),

    Forest: ({ size = 50, color = '#228B22' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 50 20 L 35 40 L 65 40 Z" fill="#90EE90" />
            <Path d="M 50 30 L 40 45 L 60 45 Z" fill="#90EE90" />
            <Rect x="45" y="45" width="10" height="20" fill="#8B4513" />
        </Svg>
    ),

    City: ({ size = 50, color = '#708090' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Rect x="20" y="40" width="15" height="30" fill="#696969" />
            <Rect x="40" y="30" width="20" height="40" fill="#696969" />
            <Rect x="65" y="35" width="15" height="35" fill="#696969" />
            <Circle cx="25" cy="45" r="2" fill="#FFD700" />
            <Circle cx="45" cy="35" r="2" fill="#FFD700" />
            <Circle cx="70" cy="40" r="2" fill="#FFD700" />
        </Svg>
    ),

    Trophy: ({ size = 50, color = '#FFD700' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 35 35 L 35 50 Q 35 60 50 60 Q 65 60 65 50 L 65 35 Z" fill="#FFA500" />
            <Rect x="45" y="60" width="10" height="15" fill="#8B4513" />
            <Rect x="40" y="75" width="20" height="5" fill="#8B4513" />
            <Circle cx="30" cy="40" r="3" fill="#FFD700" />
            <Circle cx="70" cy="40" r="3" fill="#FFD700" />
        </Svg>
    ),

    Book: ({ size = 50, color = '#8B4513' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Rect x="25" y="30" width="50" height="35" rx="2" fill="#FF6347" />
            <Rect x="30" y="35" width="40" height="25" fill="#FFF8DC" />
            <Path d="M 50 35 L 50 60" stroke="#000" strokeWidth="1" />
            <Path d="M 35 40 L 45 40" stroke="#000" strokeWidth="1" />
            <Path d="M 55 40 L 65 40" stroke="#000" strokeWidth="1" />
        </Svg>
    ),

    Microscope: ({ size = 50, color = '#4169E1' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Rect x="45" y="25" width="10" height="30" fill="#708090" />
            <Circle cx="50" cy="25" r="8" fill="#87CEEB" />
            <Rect x="40" y="50" width="20" height="5" fill="#708090" />
            <Rect x="35" y="55" width="30" height="15" fill="#708090" />
            <Path d="M 25 65 L 75 65" stroke="#000" strokeWidth="2" />
        </Svg>
    ),

    Brain: ({ size = 50, color = '#FF69B4' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 35 40 Q 25 45 30 55 Q 35 60 45 55" fill="#FFB6C1" />
            <Path d="M 65 40 Q 75 45 70 55 Q 65 60 55 55" fill="#FFB6C1" />
            <Path d="M 40 45 Q 50 40 60 45" fill="#FFB6C1" />
            <Circle cx="35" cy="50" r="2" fill="#000" />
            <Circle cx="65" cy="50" r="2" fill="#000" />
        </Svg>
    ),

    Hat: ({ size = 50, color = '#4B0082' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 25 50 L 75 50 L 70 35 L 30 35 Z" fill="#8B008B" />
            <Rect x="20" y="48" width="60" height="8" fill="#8B008B" />
            <Circle cx="50" cy="35" r="3" fill="#FFD700" />
        </Svg>
    ),

    Cape: ({ size = 50, color = '#DC143C' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 30 30 Q 50 25 70 30 L 75 70 Q 50 65 25 70 Z" fill="#8B0000" />
            <Circle cx="35" cy="40" r="3" fill="#FFD700" />
            <Circle cx="65" cy="40" r="3" fill="#FFD700" />
        </Svg>
    ),

    // 数据库 icon 字段映射 (带 .png 后缀)
    'cool_hat.png': ({ size = 50, color = '#4B0082' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 25 50 L 75 50 L 70 35 L 30 35 Z" fill="#8B008B" />
            <Rect x="20" y="48" width="60" height="8" fill="#8B008B" />
            <Circle cx="50" cy="35" r="3" fill="#FFD700" />
        </Svg>
    ),

    'superhero_cape.png': ({ size = 50, color = '#DC143C' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 30 30 Q 50 25 70 30 L 75 70 Q 50 65 25 70 Z" fill="#8B0000" />
            <Circle cx="35" cy="40" r="3" fill="#FFD700" />
            <Circle cx="65" cy="40" r="3" fill="#FFD700" />
        </Svg>
    ),

    'sports_jersey.png': ({ size = 50, color = '#FF6B6B' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 30 35 L 70 35 L 75 50 L 65 50 L 65 70 L 35 70 L 35 50 L 25 50 Z" fill="#FFF" />
            <Path d="M 40 50 L 60 50" stroke={color} strokeWidth="2" />
            <Path d="M 50 50 L 50 70" stroke={color} strokeWidth="2" />
            <Circle cx="50" cy="40" r="2" fill="#000" />
        </Svg>
    ),

    'science_glasses.png': ({ size = 50, color = '#4169E1' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Circle cx="35" cy="50" r="12" stroke="#87CEEB" strokeWidth="3" fill="none" />
            <Circle cx="65" cy="50" r="12" stroke="#87CEEB" strokeWidth="3" fill="none" />
            <Path d="M 47 50 L 53 50" stroke="#87CEEB" strokeWidth="3" />
        </Svg>
    ),

    // Aliases without .png suffix (for processedUserItems compatibility)
    'cool_hat': ({ size = 50, color = '#4B0082' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 25 50 L 75 50 L 70 35 L 30 35 Z" fill="#8B008B" />
            <Rect x="20" y="48" width="60" height="8" fill="#8B008B" />
            <Circle cx="50" cy="35" r="3" fill="#FFD700" />
        </Svg>
    ),

    'superhero_cape': ({ size = 50, color = '#DC143C' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 30 30 Q 50 25 70 30 L 75 70 Q 50 65 25 70 Z" fill="#8B0000" />
            <Circle cx="35" cy="40" r="3" fill="#FFD700" />
            <Circle cx="65" cy="40" r="3" fill="#FFD700" />
        </Svg>
    ),

    'sports_jersey': ({ size = 50, color = '#FF6B6B' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Path d="M 30 35 L 70 35 L 75 50 L 65 50 L 65 70 L 35 70 L 35 50 L 25 50 Z" fill="#FFF" />
            <Path d="M 40 50 L 60 50" stroke={color} strokeWidth="2" />
            <Path d="M 50 50 L 50 70" stroke={color} strokeWidth="2" />
            <Circle cx="50" cy="40" r="2" fill="#000" />
        </Svg>
    ),

    'science_glasses': ({ size = 50, color = '#4169E1' }) => (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="50" r="40" fill={color} />
            <Circle cx="35" cy="50" r="12" stroke="#87CEEB" strokeWidth="3" fill="none" />
            <Circle cx="65" cy="50" r="12" stroke="#87CEEB" strokeWidth="3" fill="none" />
            <Path d="M 47 50 L 53 50" stroke="#87CEEB" strokeWidth="3" />
        </Svg>
    )
};
