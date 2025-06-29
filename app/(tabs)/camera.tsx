import React, { useRef, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Alert,
  Text,
  Image,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraView as CameraViewType } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraViewType | null>(null);
  const [flashAnim] = useState(new Animated.Value(0));
  const [facing, setFacing] = useState<'front' | 'back'>('back');

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const flashEffect = () => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      flashEffect(); // fake flash
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
    }
  };

  const savePhoto = async () => {
    if (!photoUri) return;

    try {
      const fileName = `${uuid.v4()}.jpg`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: photoUri,
        to: newPath,
      });

      const existing = await AsyncStorage.getItem('photos');
      const photos = existing ? JSON.parse(existing) : [];

      photos.push({
        id: fileName,
        uri: newPath,
        createdAt: new Date().toISOString(),
        caption: '',
        favorite: false,
      });

      await AsyncStorage.setItem('photos', JSON.stringify(photos));

      Alert.alert('✅ Saved', 'Photo saved to your app storage.');
      setPhotoUri(null);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
  };

  if (!permission?.granted) {
    return <Text style={{ padding: 20 }}>Camera permission is required.</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animated.View
          pointerEvents="none"
          style={[styles.flashOverlay, { opacity: flashAnim }]}
        />

        {photoUri ? (
          <>
            <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
            <View style={styles.previewButtons}>
              <TouchableOpacity onPress={savePhoto} style={styles.actionButton}>
                <Ionicons name="save-outline" size={28} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={retakePhoto} style={styles.actionButton}>
                <Ionicons name="refresh" size={28} color="#000" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Flip Camera Button */}
            <View style={styles.topControls}>
              <TouchableOpacity
                onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
                style={styles.flipButton}
              >
                
                <Ionicons name="camera-reverse" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Camera Preview */}
            {React.createElement(CameraView as any, {
              ref: cameraRef,
              style: styles.camera,
              facing: facing,
            })}

            {/* Snap Button */}
            <View style={styles.snapContainer}>
              <TouchableOpacity onPress={takePhoto} style={styles.snapButton}>
                <View style={styles.innerSnap} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    zIndex: 99,
  },
  camera: {
    flex: 1,
  },
  preview: {
    flex: 1,
    width: '100%',
  },
  previewButtons: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#ffffffcc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  snapContainer: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
  },
  snapButton: {
    width: 80,
    height: 80,
    backgroundColor: '#ffffff50',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  innerSnap: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
  },
  flipButton: {
  backgroundColor: '#ffffff80',
  padding: 10,
  borderRadius: 25,
  justifyContent: 'center',
  alignItems: 'center',
},
iconButton: {
  backgroundColor: '#ffffffcc',
  padding: 14,
  borderRadius: 30,
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 10,
},

});
