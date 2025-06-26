import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';

export const unstable_settings = {
  headerShown: false,
};

const backgroundImage = require('../../assets/images/pic.webp');

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      blurRadius={3}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.container}>
        <Text style={styles.title}>📷 My Photo App</Text>
        <Text style={styles.subtitle}>Capture, Caption, Organize.</Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.75}
            onPress={() => router.push('/camera')}
          >
            <Text style={styles.buttonText}>Open Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.75}
            onPress={() => router.push('/gallery')}
          >
            <Text style={styles.buttonText}>View Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.75}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.buttonText}>Explore Tab</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

// ...styles unchanged

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // dark overlay for text contrast
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    zIndex: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#f0f0f0',
    marginBottom: 8,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 50,
    letterSpacing: 0.6,
  },
  buttonGroup: {
    width: '100%',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // semi-transparent glass effect
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  buttonText: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  safeArea: {
  flex: 1,
  backgroundColor: '#fefefe',
},

});
