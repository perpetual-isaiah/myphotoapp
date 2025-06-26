import React, { useEffect, useState } from 'react';
import {
   SafeAreaView, View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

type Photo = {
  id: string;
  uri: string;
  caption: string;
  createdAt: string;
  favorite?: boolean;
};

export default function ExploreTab() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('photos');
      const all: Photo[] = stored ? JSON.parse(stored) : [];

      // Filter only favorites
      const favorites = all.filter(photo => photo.favorite === true );

      // Sort by date descending
      const sorted = favorites.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPhotos(sorted);
    })();
  }, []);

  const filtered = photos.filter(p =>
    p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.createdAt.includes(searchQuery)
  );

  return (
<SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <Text style={styles.title}>❤️ Favorite Photos</Text>

      <TextInput
        placeholder="Search favorites by caption or date..."
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>No favorite photos found.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() =>
              router.push({ pathname: '/photo/[id]', params: { id: item.id } })
            }>
              <Image source={{ uri: item.uri }} style={styles.image} />
              {item.caption ? (
                <Text style={styles.caption} numberOfLines={1}>
                  {item.caption}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#e11d48' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  image: { width: 110, height: 110, margin: 5, borderRadius: 8 },
  caption: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 110,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
    fontSize: 16,
  },
  safeArea: {
  flex: 1,
  backgroundColor: '#fefefe',
},

});
