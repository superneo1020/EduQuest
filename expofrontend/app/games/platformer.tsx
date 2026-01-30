// app/games/platformer.tsx
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking } from 'react-native';

export default function PlatformerGame() {
  const openGame = () => {
    Linking.openURL('http://localhost:8443/2D Platformer Demo.html');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎮 2D Platformer Demo</Text>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>To Play:</Text>
          <Text style={styles.instruction}>1. Open terminal</Text>
          <Text style={styles.instruction}>2. cd expofrontend/export/web</Text>
          <Text style={styles.instruction}>3. python -m http.server 8443</Text>
          <Text style={styles.instruction}>4. Open browser to localhost:8443</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={openGame}>
          <Text style={styles.buttonText}>Open in Browser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 30,
  },
  instructions: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 15,
  },
  instruction: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});