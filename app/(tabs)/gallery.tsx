import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { format, isToday, isYesterday } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

type Photo = {
  id: string;
  uri: string;
  createdAt: string;
  caption: string;
  favorite?: boolean;
};

type Album = {
  id: string;
  name: string;
  createdAt: string;
  photoIds: string[];
  coverPhotoId?: string;
};

const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 48) / 3;

export default function GalleryScreen() {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filteredSections, setFilteredSections] = useState<Record<string, Photo[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const formatSectionTitle = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM dd, yyyy');
  };

  const groupPhotosByDate = (photos: Photo[]) => {
    const grouped: Record<string, Photo[]> = {};
    for (const photo of photos) {
      const dateKey = formatSectionTitle(photo.createdAt);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(photo);
    }
    return grouped;
  };

  const loadPhotos = async () => {
    try {
      const stored = await AsyncStorage.getItem('photos');
      const parsed: Photo[] = stored ? JSON.parse(stored) : [];
      setAllPhotos(parsed);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

  const loadAlbums = async () => {
    try {
      const stored = await AsyncStorage.getItem('albums');
      const parsed: Album[] = stored ? JSON.parse(stored) : [];
      setAlbums(parsed);
    } catch (error) {
      console.error('Failed to load albums:', error);
    }
  };

  const saveAlbums = async (albumsToSave: Album[]) => {
    try {
      await AsyncStorage.setItem('albums', JSON.stringify(albumsToSave));
      setAlbums(albumsToSave);
    } catch (error) {
      console.error('Failed to save albums:', error);
      throw error;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPhotos();
      loadAlbums();
      setSelectedIds(new Set());
      setSelectionMode(false);
    }, [])
  );

  useEffect(() => {
    const lowerSearch = searchText.toLowerCase();

    const filtered = allPhotos.filter((photo) => {
      const captionMatch = photo.caption.toLowerCase().includes(lowerSearch);
      const dateMatch = format(new Date(photo.createdAt), 'MMMM dd, yyyy')
        .toLowerCase()
        .includes(lowerSearch);
      return captionMatch || dateMatch;
    });

    const grouped = groupPhotosByDate(filtered);
    setFilteredSections(grouped);
  }, [searchText, allPhotos]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectionAction = () => {
    if (selectedIds.size === 0) {
      Alert.alert('No photos selected', 'Please select photos first.');
      return;
    }
    setShowActionModal(true);
  };

  const handleAddToAlbum = () => {
    setShowActionModal(false);
    setShowAlbumModal(true);
    setAlbumName('My Gallery'); // Default album name
  };

  const createOrUpdateAlbum = async () => {
    if (!albumName.trim()) {
      Alert.alert('Album Name Required', 'Please enter a name for the album.');
      return;
    }

    setIsLoading(true);
    try {
      const selectedPhotoIds = Array.from(selectedIds);
      const trimmedName = albumName.trim();
      
      // Check if album with this name already exists
      const existingAlbumIndex = albums.findIndex(album => album.name.toLowerCase() === trimmedName.toLowerCase());
      let updatedAlbums = [...albums];
      
      if (existingAlbumIndex >= 0) {
        // Album exists, add photos to it (avoid duplicates)
        const existingAlbum = updatedAlbums[existingAlbumIndex];
        const newPhotoIds = selectedPhotoIds.filter(id => !existingAlbum.photoIds.includes(id));
        
        if (newPhotoIds.length === 0) {
          Alert.alert('No New Photos', 'All selected photos are already in this album.');
          setIsLoading(false);
          return;
        }
        
        updatedAlbums[existingAlbumIndex] = {
          ...existingAlbum,
          photoIds: [...existingAlbum.photoIds, ...newPhotoIds],
          coverPhotoId: existingAlbum.coverPhotoId || newPhotoIds[0], // Set cover if not already set
        };
        
        await saveAlbums(updatedAlbums);
        
        Alert.alert(
          'Success', 
          `Added ${newPhotoIds.length} photo${newPhotoIds.length > 1 ? 's' : ''} to album "${trimmedName}"`
        );
      } else {
        // Create new album
        const newAlbum: Album = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: trimmedName,
          createdAt: new Date().toISOString(),
          photoIds: selectedPhotoIds,
          coverPhotoId: selectedPhotoIds[0], // Use first selected photo as cover
        };
        
        updatedAlbums.push(newAlbum);
        await saveAlbums(updatedAlbums);
        
        Alert.alert(
          'Success', 
          `Created album "${trimmedName}" with ${selectedPhotoIds.length} photo${selectedPhotoIds.length > 1 ? 's' : ''}`
        );
      }
      
      // Reset state
      setShowAlbumModal(false);
      setSelectedIds(new Set());
      setSelectionMode(false);
      setAlbumName('');
      
    } catch (error) {
      console.error('Create album error:', error);
      Alert.alert('Error', 'Failed to create/update album. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Photos',
      `Are you sure you want to delete ${selectedIds.size} photo${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setShowActionModal(false) },
        { text: 'Delete', style: 'destructive', onPress: deleteSelected },
      ]
    );
  };

  const deleteSelected = async () => {
    try {
      const deletedIds = Array.from(selectedIds);
      const remaining = allPhotos.filter(photo => !selectedIds.has(photo.id));
      await AsyncStorage.setItem('photos', JSON.stringify(remaining));
      
      // Also remove deleted photos from all albums
      const updatedAlbums = albums.map(album => ({
        ...album,
        photoIds: album.photoIds.filter(id => !deletedIds.includes(id)),
        coverPhotoId: deletedIds.includes(album.coverPhotoId || '') 
          ? album.photoIds.find(id => !deletedIds.includes(id)) || undefined
          : album.coverPhotoId
      })).filter(album => album.photoIds.length > 0); // Remove empty albums
      
      await saveAlbums(updatedAlbums);
      
      setAllPhotos(remaining);
      setSelectedIds(new Set());
      setSelectionMode(false);
      setShowActionModal(false);
      Alert.alert('Deleted', 'Selected photos have been deleted from gallery and albums.');
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete photos.');
      setShowActionModal(false);
    }
  };

  const handlePhotoPress = (id: string) => {
    if (selectionMode) {
      toggleSelect(id);
    } else {
      router.push(`/photo/${id}`);
    }
  };

  const viewAlbums = () => {
    setShowActionModal(false);
    // Navigate to albums screen - you'll need to create this route
    router.push('/albums');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search by caption or date..."
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={() => {
              if (selectionMode) {
                setSelectionMode(false);
                setSelectedIds(new Set());
              } else {
                setSelectionMode(true);
              }
            }}
            style={[
              styles.selectButton,
              selectionMode ? styles.selectButtonActive : null,
            ]}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={selectionMode ? 'close' : 'checkmark-circle-outline'}
              size={20}
              color={selectionMode ? '#fff' : '#007AFF'}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.selectButtonText,
                selectionMode ? styles.selectButtonTextActive : null,
              ]}
            >
              {selectionMode ? 'Cancel' : 'Select'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Albums Quick Access */}
        {albums.length > 0 && !selectionMode && (
          <TouchableOpacity 
            style={styles.albumsButton}
            onPress={viewAlbums}
          >
            <Ionicons name="albums" size={20} color="#007AFF" style={{ marginRight: 8 }} />
            <Text style={styles.albumsButtonText}>
              View Albums ({albums.length})
            </Text>
          </TouchableOpacity>
        )}

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {Object.entries(filteredSections).length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.noMatch}>No matching photos found.</Text>
            </View>
          ) : (
            Object.entries(filteredSections).map(([sectionTitle, data]) => (
              <View key={sectionTitle} style={styles.section}>
                <Text style={styles.sectionHeader}>{sectionTitle}</Text>
                <View style={styles.grid}>
                  {data.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handlePhotoPress(item.id)}
                        style={[
                          styles.imageWrapper,
                          isSelected && styles.selectedWrapper,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.image}
                          resizeMode="cover"
                          fadeDuration={250}
                        />

                        {item.favorite && (
                          <View style={styles.heartOverlay}>
                            <Ionicons 
                              name="heart" 
                              size={16} 
                              color="#ef4444"
                              style={{ 
                                textShadowColor: 'rgba(239, 68, 68, 0.7)',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 4,
                              }}
                            />
                          </View>
                        )}

                        {item.caption ? (
                          <Text style={styles.caption} numberOfLines={1}>
                            {item.caption}
                          </Text>
                        ) : null}

                        {selectionMode && (
                          <View
                            style={[
                              styles.selectCircle,
                              isSelected && styles.selectCircleSelected,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons name="checkmark" size={18} color="#fff" />
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
       
        {/* Floating Add Photo Button */}
        {!selectionMode && (
          <TouchableOpacity
            onPress={() => router.push('/camera')}
            style={styles.fab}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="camera" size={26} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Action Button */}
        {selectionMode && selectedIds.size > 0 && (
          <TouchableOpacity
            onPress={handleSelectionAction}
            style={styles.actionButton}
            activeOpacity={0.85}
          >
            <Ionicons name="options" size={24} color="#fff" />
            <Text style={styles.actionText}>Actions ({selectedIds.size})</Text>
          </TouchableOpacity>
        )}

        {/* Action Selection Modal */}
        <Modal
          visible={showActionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowActionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                What would you like to do with {selectedIds.size} photo{selectedIds.size > 1 ? 's' : ''}?
              </Text>
              
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleAddToAlbum}
              >
                <Ionicons name="albums" size={20} color="#000" style={{ marginRight: 10 }} />
                <Text style={styles.modalButtonText}>Add to Album</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Ionicons name="trash" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={[styles.modalButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowActionModal(false)}
              >
                <Ionicons name="close" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Album Creation Modal */}
        <Modal
          visible={showAlbumModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => !isLoading && setShowAlbumModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Create Album
              </Text>
              
              <Text style={styles.modalSubtitle}>
                Adding {selectedIds.size} photo{selectedIds.size > 1 ? 's' : ''} to album
              </Text>
              
              <TextInput
                style={styles.albumInput}
                placeholder="Enter album name..."
                value={albumName}
                onChangeText={setAlbumName}
                autoFocus={true}
                maxLength={50}
                editable={!isLoading}
              />
              
              <View style={styles.modalButtonRow}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton, { flex: 1, marginRight: 10 }]}
                  onPress={() => !isLoading && setShowAlbumModal(false)}
                  disabled={isLoading}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.createButton, { flex: 1 }, isLoading && styles.disabledButton]}
                  onPress={createOrUpdateAlbum}
                  disabled={isLoading || !albumName.trim()}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                    {isLoading ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    color: '#333',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    elevation: 3,
    shadowColor: '#007AFF',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  selectButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#005ecb',
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  selectButtonText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 14,
  },
  selectButtonTextActive: {
    color: '#fff',
  },
  albumsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  albumsButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  imageWrapper: {
    width: imageSize,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    position: 'relative',
  },
  selectedWrapper: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  image: {
    width: '100%',
    height: imageSize,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  caption: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
  },
  center: {
    alignItems: 'center',
    marginTop: 60,
  },
  noMatch: {
    fontSize: 16,
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  selectCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#eee',
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectCircleSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  actionButton: {
    position: 'absolute',
    bottom: 90,
    left: 24,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 32,
    shadowColor: '#007AFF',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 15,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  heartOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#666',
    marginTop: 10,
  },
  createButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  albumInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
  },
});