import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
} from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SIZE = 100;

export default function ResizableCrop() {
  const { uri, id } = useLocalSearchParams<{ uri: string; id: string }>();
  const router = useRouter();

  const left = useSharedValue(60);
  const top = useSharedValue(160);
  const width = useSharedValue(240);
  const height = useSharedValue(240);

  const moveGesture = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = left.value;
      ctx.startY = top.value;
    },
    onActive: (e, ctx: any) => {
      left.value = Math.max(0, Math.min(ctx.startX + e.translationX, SCREEN_WIDTH - width.value));
      top.value = Math.max(0, Math.min(ctx.startY + e.translationY, SCREEN_HEIGHT - height.value));
    },
  });

  const resizeBR = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startW = width.value;
      ctx.startH = height.value;
    },
    onActive: (e, ctx: any) => {
      width.value = Math.max(MIN_SIZE, ctx.startW + e.translationX);
      height.value = Math.max(MIN_SIZE, ctx.startH + e.translationY);
    },
  });

  const cropStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: left.value,
    top: top.value,
    width: width.value,
    height: height.value,
    borderColor: '#00FFAA',
    borderWidth: 2,
    borderStyle: 'dashed',
  }));

  const handleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#00FFAA',
    borderRadius: 10,
    bottom: -10,
    right: -10,
  }));

  const imageStyle = StyleSheet.absoluteFillObject;

  const handleSave = async () => {
    try {
      const cropArea = {
        originX: left.value,
        originY: top.value,
        width: width.value,
        height: height.value,
      };

      const result = await ImageManipulator.manipulateAsync(uri!, [{ crop: cropArea }]);

      // Update the photo in AsyncStorage
      const stored = await AsyncStorage.getItem('photos');
      const parsed = stored ? JSON.parse(stored) : [];

      const updated = parsed.map((p: any) =>
        p.id === id ? { ...p, uri: result.uri } : p
      );

      await AsyncStorage.setItem('photos', JSON.stringify(updated));

      Alert.alert('Saved', 'Photo cropped and saved.');
      router.replace('/gallery');

    } catch (e) {
      console.error('❌ Cropping failed', e);
      Alert.alert('Error', 'Cropping failed.');
    }
  };

  const reset = () => {
    left.value = withTiming(60);
    top.value = withTiming(160);
    width.value = withTiming(240);
    height.value = withTiming(240);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          {uri && (
            <Animated.Image
              source={{ uri }}
              style={imageStyle}
              resizeMode="contain"
            />
          )}

          <PanGestureHandler onGestureEvent={moveGesture}>
            <Animated.View style={cropStyle}>
              <PanGestureHandler onGestureEvent={resizeBR}>
                <Animated.View style={handleStyle} />
              </PanGestureHandler>
            </Animated.View>
          </PanGestureHandler>

          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>💾 Save Crop</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={reset} style={[styles.saveButton, { top: SCREEN_HEIGHT - 100 }]}>
            <Text style={styles.saveText}>↩️ Reset</Text>
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  saveButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#00FFAA',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  saveText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
