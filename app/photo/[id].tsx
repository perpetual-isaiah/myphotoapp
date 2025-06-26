import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  SafeAreaView,
  View,
  TextInput,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

type Photo = {
  id: string;
  uri: string;
  createdAt: string;
  caption: string;
  favorite?: boolean;
};

export default function PhotoDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [caption, setCaption] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isRotated, setIsRotated] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('photos');
      const photos: Photo[] = stored ? JSON.parse(stored) : [];
      const found = photos.find(p => p.id === id);
      if (found) {
        setPhoto(found);
        setCaption(found.caption);
      }
    })();
  }, [id]);

  const saveCaption = async () => {
    if (!photo) return;
    try {
      const stored = await AsyncStorage.getItem('photos');
      const photos: Photo[] = stored ? JSON.parse(stored) : [];

      const updatedPhotos = photos.map(p =>
        p.id === photo.id ? { ...p, caption } : p
      );

      await AsyncStorage.setItem('photos', JSON.stringify(updatedPhotos));
      Alert.alert('Saved', 'Caption updated.', [
        {
          text: 'OK',
          onPress: () => router.push('/gallery'),
        },
      ]);
    } catch (err) {
      console.error('Failed to save caption:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!photo) return;
    try {
      const stored = await AsyncStorage.getItem('photos');
      const photos: Photo[] = stored ? JSON.parse(stored) : [];

      const updatedPhotos = photos.map(p =>
        p.id === photo.id ? { ...p, favorite: !p.favorite } : p
      );

      await AsyncStorage.setItem('photos', JSON.stringify(updatedPhotos));
      setPhoto({ ...photo, favorite: !photo.favorite });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const deletePhoto = async () => {
    if (!photo) return;
    try {
      await FileSystem.deleteAsync(photo.uri, { idempotent: true });

      const stored = await AsyncStorage.getItem('photos');
      const photos: Photo[] = stored ? JSON.parse(stored) : [];
      const updatedPhotos = photos.filter(p => p.id !== photo.id);

      await AsyncStorage.setItem('photos', JSON.stringify(updatedPhotos));
      Alert.alert('Deleted', 'Photo removed.');
      router.back();
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  const saveRotatedPhoto = async () => {
    if (!photo) return;

    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ rotate: rotation }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );

      const stored = await AsyncStorage.getItem('photos');
      const photos: Photo[] = stored ? JSON.parse(stored) : [];

      const updatedPhotos = photos.map(p =>
        p.id === photo.id ? { ...p, uri: manipulated.uri } : p
      );

      await AsyncStorage.setItem('photos', JSON.stringify(updatedPhotos));
      setPhoto({ ...photo, uri: manipulated.uri });
      setIsRotated(false);
      setRotation(0);

      Alert.alert('Saved', 'Rotated photo saved successfully.');
    } catch (err) {
      console.error('Failed to save rotated photo:', err);
    }
  };

  if (!photo) {
    return (
      <View style={styles.center}>
        <Text>Loading photo...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={{ uri: photo.uri }}
        style={[styles.image, { transform: [{ rotate: `${rotation}deg` }] }]}
        resizeMode="contain"
      />
      <TextInput
        placeholder="Add a caption..."
        value={caption}
        onChangeText={setCaption}
        style={styles.input}
        placeholderTextColor="#999"
      />
      <TouchableOpacity style={styles.button} onPress={saveCaption}>
        <Text style={styles.buttonText}>💾 Save Caption</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setRotation(r => (r + 90) % 360);
          setIsRotated(true);
        }}
      >
        <Text style={styles.buttonText}>🔄 Rotate</Text>
      </TouchableOpacity>

      {isRotated && (
        <TouchableOpacity style={styles.button} onPress={saveRotatedPhoto}>
          <Text style={styles.buttonText}>✅ Save Rotated Photo</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={toggleFavorite}>
        <Text style={styles.buttonText}>
          {photo.favorite ? '❤️ Unfavorite' : '🤍 Add to Favorites'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={deletePhoto}>
        <Text style={styles.buttonText}>🗑️ Delete Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Gallery</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fefefe',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 320,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
    backgroundColor: '#eee',
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  button: {
    width: '100%',
    backgroundColor: '#444',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 6,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#b00020',
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
  flex: 1,
  backgroundColor: '#fefefe', // Same background as your content
},

});
