// app/games/MatchingGame.tsx
import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import MatchingGameComponent from './components/matchinggame';

const MatchingGame = () => {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
            <MatchingGameComponent />
        </SafeAreaView>
    );
};

export default MatchingGame;