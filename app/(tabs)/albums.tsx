import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 48) / 3;

type AppAlbum = {
  id: string;
  name: string;
  photoIds: string[];
};

type AppPhoto = {
  id: string;
  uri: string;
  createdAt: string;
  caption: string;
  favorite?: boolean;
};

export default function AlbumsScreen() {
  const [albums, setAlbums] = useState<AppAlbum[]>([]);
  const [photos, setPhotos] = useState<AppPhoto[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AppAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    React.useCallback(() => {
      loadAlbumsAndPhotos();
    }, [])
  );

  const loadAlbumsAndPhotos = async () => {
    try {
      const albumsJson = await AsyncStorage.getItem('albums');
      const photosJson = await AsyncStorage.getItem('photos');

      const albumList = albumsJson ? JSON.parse(albumsJson) : [];
      const photoList = photosJson ? JSON.parse(photosJson) : [];

      setAlbums(albumList);
      setPhotos(photoList);
    } catch (error) {
      console.error('Failed to load:', error);
      Alert.alert('Error', 'Failed to load albums or photos');
    } finally {
      setLoading(false);
    }
  };

  const getPhotosForAlbum = (album: AppAlbum) => {
    return photos.filter((photo) => album.photoIds.includes(photo.id));
  };

  const renderAlbumItem = ({ item }: { item: AppAlbum }) => (
    <TouchableOpacity
      style={styles.albumItem}
      activeOpacity={0.7}
      onPress={() => setSelectedAlbum(item)}
    >
      <Ionicons name="albums-outline" size={32} color="#007AFF" style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.albumTitle}>{item.name}</Text>
        <Text style={styles.albumCount}>{item.photoIds.length} photo{item.photoIds.length !== 1 ? 's' : ''}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderPhotoItem = ({ item }: { item: AppPhoto }) => (
    <View style={styles.photoWrapper}>
      <Image source={{ uri: item.uri }} style={styles.photo} resizeMode="cover" />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (!selectedAlbum) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            setNewAlbumName('');
            setSelectedPhotoIds(new Set());
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create Album</Text>
        </TouchableOpacity>

        {albums.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.noAlbumsText}>No albums created yet.</Text>
          </View>
        ) : (
          <FlatList
           key="album-list"
            data={albums}
            keyExtractor={(item) => item.id}
            renderItem={renderAlbumItem}
            contentContainerStyle={{ paddingVertical: 12 }}
          />
        )}

        {showCreateModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Create New Album</Text>
              <TextInput
                style={styles.input}
                placeholder="Album name"
                value={newAlbumName}
                onChangeText={setNewAlbumName}
              />
              <FlatList
                data={photos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedPhotoIds.has(item.id);
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        const updated = new Set(selectedPhotoIds);
                        if (updated.has(item.id)) updated.delete(item.id);
                        else updated.add(item.id);
                        setSelectedPhotoIds(new Set(updated));
                      }}
                      style={[
                        styles.photoWrapper,
                        {
                          opacity: isSelected ? 0.5 : 1,
                          borderColor: isSelected ? '#007AFF' : 'transparent',
                          borderWidth: isSelected ? 2 : 0,
                          marginBottom: 10,
                        },
                      ]}
                    >
                      <Image source={{ uri: item.uri }} style={styles.photo} />
                    </TouchableOpacity>
                  );
                }}
                numColumns={3}
                style={{ marginVertical: 12 }}
              />
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    const trimmed = newAlbumName.trim();
                    if (!trimmed || selectedPhotoIds.size === 0) {
                      Alert.alert('Missing Info', 'Please provide album name and select at least one photo.');
                      return;
                    }
                    const newAlbum = {
                      id: Date.now().toString(),
                      name: trimmed,
                      photoIds: Array.from(selectedPhotoIds),
                    };
                    const updatedAlbums = [...albums, newAlbum];
                    await AsyncStorage.setItem('albums', JSON.stringify(updatedAlbums));
                    setAlbums(updatedAlbums);
                    setShowCreateModal(false);
                    Alert.alert('Success', `Album "${trimmed}" created.`);
                  }}
                  style={[styles.modalButton, { backgroundColor: '#007AFF' }]}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const albumPhotos = getPhotosForAlbum(selectedAlbum);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedAlbum(null)} style={{ paddingHorizontal: 8 }}>
          <Ionicons name="arrow-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedAlbum.name}</Text>
        <View style={{ width: 36 }} />
      </View>
      {albumPhotos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.noAlbumsText}>No photos in this album.</Text>
        </View>
      ) : (
        <FlatList
        key="album-photos"
          data={albumPhotos}
          keyExtractor={(item) => item.id}
          renderItem={renderPhotoItem}
          numColumns={3}
          contentContainerStyle={{ padding: 12 }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fefefe' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  albumTitle: { fontSize: 18, fontWeight: '600', color: '#222' },
  albumCount: { fontSize: 13, color: '#666', marginTop: 2 },
  noAlbumsText: { fontSize: 16, color: '#999' },
  photoWrapper: {
    width: imageSize,
    height: imageSize,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ddd',
    marginRight: 8,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginLeft: 12,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
