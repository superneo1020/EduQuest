// app/games/ListeningGame.tsx
import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import ListeningGameComponent from './components/listeninggame';

const ListeningGame = () => {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
            <ListeningGameComponent />
        </SafeAreaView>
    );
};

export default ListeningGame;