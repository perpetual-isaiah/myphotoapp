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

const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 48) / 3;

export default function GalleryScreen() {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filteredSections, setFilteredSections] = useState<Record<string, Photo[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
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

  useFocusEffect(
    React.useCallback(() => {
      loadPhotos();
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

  const confirmDelete = () => {
    if (selectedIds.size === 0) {
      Alert.alert('No photos selected', 'Please select photos to delete.');
      return;
    }

    Alert.alert(
      'Delete Photos',
      `Are you sure you want to delete ${selectedIds.size} photo${selectedIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteSelected },
      ]
    );
  };

  const deleteSelected = async () => {
    try {
      const remaining = allPhotos.filter(photo => !selectedIds.has(photo.id));
      await AsyncStorage.setItem('photos', JSON.stringify(remaining));
      setAllPhotos(remaining);
      setSelectedIds(new Set());
      setSelectionMode(false);
      Alert.alert('Deleted', 'Selected photos have been deleted.');
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete photos.');
    }
  };

  const handlePhotoPress = (id: string) => {
    if (selectionMode) {
      toggleSelect(id);
    } else {
      router.push(`/photo/${id}`);
    }
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
                color="#ef4444"  // A juicy rose-red (#ef4444 = tailwind red-500)
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

      {/* Delete Button */}
      {selectionMode && selectedIds.size > 0 && (
        <TouchableOpacity
          onPress={confirmDelete}
          style={styles.deleteButton}
          activeOpacity={0.85}
        >
          <Ionicons name="trash" size={24} color="#fff" />
          <Text style={styles.deleteText}>Delete {selectedIds.size}</Text>
        </TouchableOpacity>
      )}
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
  paddingVertical: 6,       // smaller vertical padding
  paddingHorizontal: 14,    // smaller horizontal padding
  borderRadius: 20,         // slightly less round
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
  fontSize: 14,             // smaller font
},
selectButtonTextActive: {
  color: '#fff',
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
  deleteButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 32,
    shadowColor: '#b91c1c',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 15,
  },
  deleteText: {
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

});
