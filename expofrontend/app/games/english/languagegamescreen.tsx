// games/LanguageGameScreen.tsx
import React from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import ListeningGame from './components/listeninggame';
import MatchingGame from './components/matchinggame';

const LanguageGameScreen = () => {
  const params = useLocalSearchParams();
  const gameType = params.type || 'listening';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {gameType === 'listening' ? <ListeningGame /> : <MatchingGame />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default LanguageGameScreen;