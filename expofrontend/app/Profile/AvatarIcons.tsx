import React from 'react';
import { View } from 'react-native';

// Elementary school style avatar icons using SVG paths
export const AvatarIcons = {
    default: ({ size = 50, color = '#636E72' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" fill={color} />
            <circle cx="35" cy="40" r="5" fill="#fff" />
            <circle cx="65" cy="40" r="5" fill="#fff" />
            <path d="M 35 60 Q 50 70 65 60" stroke="#fff" strokeWidth="3" fill="none" />
        </svg>
    ),
    
    happy_cat: ({ size = 50, color = '#FFD93D' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" fill={color} />
            <path d="M 25 30 L 35 45 L 20 40 Z" fill={color} />
            <path d="M 75 30 L 65 45 L 80 40 Z" fill={color} />
            <circle cx="35" cy="45" r="4" fill="#000" />
            <circle cx="65" cy="45" r="4" fill="#000" />
            <path d="M 30 60 Q 50 75 70 60" stroke="#000" strokeWidth="3" fill="none" />
            <path d="M 50 60 L 50 65" stroke="#000" strokeWidth="2" />
            <path d="M 45 65 L 50 70 L 55 65" stroke="#000" strokeWidth="2" fill="none" />
        </svg>
    ),
    
    cool_dog: ({ size = 50, color = '#4ECDC4' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="50" rx="40" ry="35" fill={color} />
            <ellipse cx="25" cy="35" rx="8" ry="12" fill={color} />
            <ellipse cx="75" cy="35" rx="8" ry="12" fill={color} />
            <circle cx="35" cy="45" r="4" fill="#000" />
            <circle cx="65" cy="45" r="4" fill="#000" />
            <ellipse cx="50" cy="65" rx="8" ry="6" fill="#000" />
            <path d="M 30 75 Q 50 85 70 75" stroke="#000" strokeWidth="2" fill="none" />
        </svg>
    ),
    
    smart_owl: ({ size = 50, color = '#9B59B6' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="55" rx="35" ry="30" fill={color} />
            <path d="M 25 25 L 35 40 L 15 35 Z" fill={color} />
            <path d="M 75 25 L 65 40 L 85 35 Z" fill={color} />
            <circle cx="35" cy="50" r="8" fill="#fff" />
            <circle cx="65" cy="50" r="8" fill="#fff" />
            <circle cx="35" cy="50" r="4" fill="#000" />
            <circle cx="65" cy="50" r="4" fill="#000" />
            <path d="M 35 65 Q 50 70 65 65" stroke="#FFD93D" strokeWidth="3" fill="none" />
        </svg>
    ),
    
    sporty_rabbit: ({ size = 50, color = '#FF6B6B' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="60" rx="30" ry="25" fill={color} />
            <ellipse cx="35" cy="30" rx="6" ry="20" fill={color} />
            <ellipse cx="65" cy="30" rx="6" ry="20" fill={color} />
            <circle cx="35" cy="30" r="4" fill={color} />
            <circle cx="65" cy="30" r="4" fill={color} />
            <circle cx="40" cy="55" r="3" fill="#000" />
            <circle cx="60" cy="55" r="3" fill="#000" />
            <path d="M 45 65 Q 50 70 55 65" stroke="#000" strokeWidth="2" fill="none" />
            <circle cx="25" cy="65" r="3" fill="#fff" />
            <circle cx="75" cy="65" r="3" fill="#fff" />
        </svg>
    ),
    
    artistic_butterfly: ({ size = 50, color = '#FF9FF3' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="50" rx="8" ry="20" fill={color} />
            <ellipse cx="30" cy="40" rx="15" ry="20" fill={color} opacity="0.8" />
            <ellipse cx="70" cy="40" rx="15" ry="20" fill={color} opacity="0.8" />
            <ellipse cx="30" cy="60" rx="12" ry="15" fill={color} opacity="0.7" />
            <ellipse cx="70" cy="60" rx="12" ry="15" fill={color} opacity="0.7" />
            <circle cx="45" cy="45" r="2" fill="#000" />
            <circle cx="55" cy="45" r="2" fill="#000" />
            <path d="M 50 50 L 50 55" stroke="#000" strokeWidth="1" />
        </svg>
    ),
    
    bookworm_bear: ({ size = 50, color = '#54A0FF' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="35" fill={color} />
            <circle cx="30" cy="40" r="5" fill="#000" />
            <circle cx="70" cy="40" r="5" fill="#000" />
            <ellipse cx="50" cy="65" rx="10" ry="8" fill="#000" />
            <rect x="35" y="75" width="30" height="20" rx="2" fill="#8B4513" />
            <rect x="37" y="77" width="26" height="16" fill="#FFF8DC" />
            <path d="M 40 80 L 60 80" stroke="#000" strokeWidth="1" />
            <path d="M 40 83 L 60 83" stroke="#000" strokeWidth="1" />
            <path d="M 40 86 L 55 86" stroke="#000" strokeWidth="1" />
        </svg>
    ),
    
    explorer_monkey: ({ size = 50, color = '#1DD1A1' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="35" fill={color} />
            <circle cx="35" cy="40" r="4" fill="#000" />
            <circle cx="65" cy="40" r="4" fill="#000" />
            <ellipse cx="50" cy="60" rx="8" ry="6" fill="#000" />
            <path d="M 25 35 Q 15 25 10 30" stroke={color} strokeWidth="4" />
            <path d="M 75 35 Q 85 25 90 30" stroke={color} strokeWidth="4" />
            <circle cx="10" cy="30" r="3" fill={color} />
            <circle cx="90" cy="30" r="3" fill={color} />
            <path d="M 40 65 Q 50 70 60 65" stroke="#000" strokeWidth="2" fill="none" />
        </svg>
    ),
    
    star_student: ({ size = 50, color = '#FFA502' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" fill={color} />
            <path d="M 50 15 L 55 30 L 70 30 L 58 40 L 63 55 L 50 45 L 37 55 L 42 40 L 30 30 L 45 30 Z" fill="#FFD700" />
            <circle cx="40" cy="60" r="3" fill="#000" />
            <circle cx="60" cy="60" r="3" fill="#000" />
            <path d="M 45 70 Q 50 75 55 70" stroke="#000" strokeWidth="2" fill="none" />
        </svg>
    ),
    
    rainbow_unicorn: ({ size = 50, color = '#A29BFE' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="60" rx="30" ry="25" fill={color} />
            <path d="M 30 40 L 35 20 L 40 40 Z" fill={color} />
            <path d="M 70 40 L 65 20 L 60 40 Z" fill={color} />
            <path d="M 25 20 Q 50 10 75 20" stroke="#FF0000" strokeWidth="3" fill="none" />
            <path d="M 25 25 Q 50 15 75 25" stroke="#FFA500" strokeWidth="3" fill="none" />
            <path d="M 25 30 Q 50 20 75 30" stroke="#FFFF00" strokeWidth="3" fill="none" />
            <path d="M 25 35 Q 50 25 75 35" stroke="#00FF00" strokeWidth="3" fill="none" />
            <circle cx="40" cy="55" r="3" fill="#000" />
            <circle cx="60" cy="55" r="3" fill="#000" />
            <path d="M 45 65 Q 50 70 55 65" stroke="#000" strokeWidth="2" fill="none" />
        </svg>
    ),
    
    rocket_raccoon: ({ size = 50, color = '#FF6348' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="35" fill={color} />
            <path d="M 45 25 L 50 15 L 55 25 Z" fill="#708090" />
            <rect x="48" y="10" width="4" height="10" fill="#FF0000" />
            <path d="M 20 40 Q 10 35 5 40" stroke="#000" strokeWidth="3" />
            <path d="M 80 40 Q 90 35 95 40" stroke="#000" strokeWidth="3" />
            <circle cx="35" cy="45" r="4" fill="#000" />
            <circle cx="65" cy="45" r="4" fill="#000" />
            <ellipse cx="50" cy="65" rx="8" ry="6" fill="#000" />
            <path d="M 40 75 L 45 85 L 50 75 L 55 85 L 60 75" stroke="#FFD700" strokeWidth="2" fill="none" />
        </svg>
    ),
    
    heart_panda: ({ size = 50, color = '#FF4757' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" fill="#fff" />
            <circle cx="35" cy="35" r="8" fill="#000" />
            <circle cx="65" cy="35" r="8" fill="#000" />
            <circle cx="35" cy="35" r="4" fill="#fff" />
            <circle cx="65" cy="35" r="4" fill="#fff" />
            <ellipse cx="50" cy="60" rx="12" ry="10" fill="#000" />
            <path d="M 50 70 Q 50 75 50 70" stroke="#000" strokeWidth="2" />
            <path d="M 25 25 Q 15 15 10 20 Q 5 25 15 30 Z" fill={color} />
            <path d="M 75 25 Q 85 15 90 20 Q 95 25 85 30 Z" fill={color} />
        </svg>
    ),
    
    sunshine_bee: ({ size = 50, color = '#FFA500' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" fill={color} />
            <circle cx="50" cy="50" r="25" fill="#FFD700" />
            <circle cx="35" cy="45" r="3" fill="#000" />
            <circle cx="65" cy="45" r="3" fill="#000" />
            <path d="M 40 55 Q 50 60 60 55" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M 90 50 L 95 45 L 95 55 Z" fill="#fff" />
            <path d="M 10 50 L 5 45 L 5 55 Z" fill="#fff" />
            <path d="M 50 10 L 45 5 L 55 5 Z" fill="#fff" />
            <path d="M 50 90 L 45 95 L 55 95 Z" fill="#fff" />
            <path d="M 75 25 L 80 20 L 85 25 L 80 30 Z" fill="#fff" />
            <path d="M 25 25 L 20 20 L 15 25 L 20 30 Z" fill="#fff" />
            <path d="M 75 75 L 80 80 L 85 75 L 80 70 Z" fill="#fff" />
            <path d="M 25 75 L 20 80 L 15 75 L 20 70 Z" fill="#fff" />
        </svg>
    ),
    
    moon_turtle: ({ size = 50, color = '#3498DB' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="55" rx="35" ry="30" fill={color} />
            <path d="M 20 30 Q 25 20 30 30" fill={color} />
            <circle cx="25" cy="25" r="8" fill="#F0E68C" />
            <circle cx="35" cy="45" r="3" fill="#000" />
            <circle cx="65" cy="45" r="3" fill="#000" />
            <path d="M 40 55 Q 50 60 60 55" stroke="#000" strokeWidth="2" fill="none" />
            <ellipse cx="50" cy="70" rx="15" ry="10" fill="#2E8B57" />
            <path d="M 40 75 L 45 80 L 50 75 L 55 80 L 60 75" stroke="#000" strokeWidth="1" fill="none" />
        </svg>
    ),
    
    flower_ladybug: ({ size = 50, color = '#E91E63' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="35" fill="#FF0000" />
            <path d="M 50 50" stroke="#000" strokeWidth="2" />
            <circle cx="40" cy="40" r="5" fill="#000" />
            <circle cx="60" cy="40" r="5" fill="#000" />
            <circle cx="40" cy="60" r="5" fill="#000" />
            <circle cx="60" cy="60" r="5" fill="#000" />
            <circle cx="35" cy="45" r="2" fill="#000" />
            <circle cx="65" cy="45" r="2" fill="#000" />
            <path d="M 25 25 Q 35 15 45 25" fill="#FFB6C1" />
            <path d="M 75 25 Q 65 15 55 25" fill="#FFB6C1" />
            <path d="M 25 75 Q 35 85 45 75" fill="#FFB6C1" />
            <path d="M 75 75 Q 65 85 55 75" fill="#FFB6C1" />
            <path d="M 15 50 Q 5 40 15 30" fill="#FFB6C1" />
            <path d="M 85 50 Q 95 40 85 30" fill="#FFB6C1" />
        </svg>
    ),
    
    rainbow_frog: ({ size = 50, color = '#00BCD4' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="60" rx="35" ry="30" fill={color} />
            <circle cx="35" cy="50" r="4" fill="#000" />
            <circle cx="65" cy="50" r="4" fill="#000" />
            <ellipse cx="50" cy="70" rx="10" ry="8" fill="#000" />
            <path d="M 45 75 Q 50 80 55 75" stroke="#000" strokeWidth="2" fill="none" />
            <ellipse cx="25" cy="40" rx="8" ry="6" fill="#FF0000" />
            <ellipse cx="75" cy="40" rx="8" ry="6" fill="#FF0000" />
            <path d="M 20 35 Q 50 25 80 35" stroke="#FFA500" strokeWidth="3" fill="none" />
            <path d="M 20 40 Q 50 30 80 40" stroke="#FFFF00" strokeWidth="3" fill="none" />
            <path d="M 20 45 Q 50 35 80 45" stroke="#00FF00" strokeWidth="3" fill="none" />
        </svg>
    ),
    
    cloud_sheep: ({ size = 50, color = '#ECF0F1' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" fill={color} />
            <circle cx="35" cy="40" r="15" fill="#fff" />
            <circle cx="65" cy="40" r="15" fill="#fff" />
            <circle cx="50" cy="30" r="12" fill="#fff" />
            <circle cx="35" cy="55" r="12" fill="#fff" />
            <circle cx="65" cy="55" r="12" fill="#fff" />
            <circle cx="50" cy="65" r="10" fill="#fff" />
            <circle cx="40" cy="45" r="3" fill="#000" />
            <circle cx="60" cy="45" r="3" fill="#000" />
            <path d="M 45 55 Q 50 60 55 55" stroke="#000" strokeWidth="2" fill="none" />
        </svg>
    ),
    
    apple_teacher: ({ size = 50, color = '#27AE60' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" fill={color} />
            <ellipse cx="50" cy="60" rx="25" ry="20" fill="#FF0000" />
            <path d="M 50 40 L 50 45" stroke="#8B4513" strokeWidth="3" />
            <path d="M 45 42 Q 50 38 55 42" stroke="#228B22" strokeWidth="2" fill="none" />
            <circle cx="40" cy="55" r="3" fill="#000" />
            <circle cx="60" cy="55" r="3" fill="#000" />
            <path d="M 45 65 Q 50 70 55 65" stroke="#000" strokeWidth="2" fill="none" />
        </svg>
    ),
    
    pencil_wizard: ({ size = 50, color = '#8E44AD' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" fill={color} />
            <path d="M 45 25 L 55 25 L 55 75 L 45 75 Z" fill="#FFD700" />
            <path d="M 45 25 L 50 15 L 55 25 Z" fill="#FF69B4" />
            <path d="M 45 75 L 50 85 L 55 75 Z" fill="#FF69B4" />
            <circle cx="50" cy="35" r="3" fill="#000" />
            <circle cx="50" cy="45" r="3" fill="#000" />
            <path d="M 40 55 Q 50 60 60 55" stroke="#000" strokeWidth="2" fill="none" />
            <path d="M 30 30 Q 20 20 10 25" stroke="#FFD700" strokeWidth="2" />
            <path d="M 70 30 Q 80 20 90 25" stroke="#FFD700" strokeWidth="2" />
            <path d="M 30 70 Q 20 80 10 75" stroke="#FFD700" strokeWidth="2" />
            <path d="M 70 70 Q 80 80 90 75" stroke="#FFD700" strokeWidth="2" />
        </svg>
    ),
    
    crayon_dragon: ({ size = 50, color = '#E74C3C' }) => (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <ellipse cx="50" cy="50" rx="35" ry="30" fill={color} />
            <path d="M 30 35 L 25 20 L 35 30 Z" fill={color} />
            <path d="M 70 35 L 75 20 L 65 30 Z" fill={color} />
            <circle cx="35" cy="45" r="4" fill="#000" />
            <circle cx="65" cy="45" r="4" fill="#000" />
            <path d="M 30 55 Q 50 65 70 55" stroke="#000" strokeWidth="3" fill="none" />
            <path d="M 45 65 L 50 70 L 55 65" stroke="#FFA500" strokeWidth="2" fill="none" />
            <path d="M 80 60 Q 90 65 85 70" stroke="#FFD700" strokeWidth="3" fill="none" />
            <path d="M 20 60 Q 10 65 15 70" stroke="#FFD700" strokeWidth="3" fill="none" />
        </svg>
    )
};
