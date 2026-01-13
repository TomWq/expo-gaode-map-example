import { getRouteBounds } from '@/utils/routeUtils';
import { MapView, MapViewRef, Marker, Polyline, type CameraPosition, type LatLng } from 'expo-gaode-map';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';

const iconUri = Image.resolveAssetSource(require('@/assets/images/car.png')).uri;

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const PROGRESS_BIAS = 1;

function buildAnimatedPath(track: LatLng[]): LatLng[] {
  if (track.length < 2) return track;
  const result: LatLng[] = [];
  const segments = 8;
  for (let i = 0; i < track.length - 1; i++) {
    const start = track[i];
    const end = track[i + 1];
    result.push(start);
    for (let s = 1; s < segments; s++) {
      const t = s / segments;
      result.push({
        latitude: start.latitude + (end.latitude - start.latitude) * t,
        longitude: start.longitude + (end.longitude - start.longitude) * t,
      });
    }
  }
  result.push(track[track.length - 1]);
  return result;
}

export default function TrackPlaybackExample() {
  const mapRef = useRef<MapViewRef | null>(null);
  const track = useMemo<LatLng[]>(
    () => [
      { latitude: 39.908692, longitude: 116.397477 },
      { latitude: 39.9091, longitude: 116.3989 },
      { latitude: 39.9096, longitude: 116.4002 },
      { latitude: 39.9103, longitude: 116.4015 },
      { latitude: 39.9111, longitude: 116.4024 },
      { latitude: 39.9119, longitude: 116.4031 },
      { latitude: 39.9127, longitude: 116.4038 },
      { latitude: 39.9134, longitude: 116.4049 },
      { latitude: 39.9139, longitude: 116.4064 },
      { latitude: 39.9141, longitude: 116.4081 },
      { latitude: 39.9138, longitude: 116.4097 },
      { latitude: 39.9131, longitude: 116.4109 },
      { latitude: 39.9123, longitude: 116.4117 },
      { latitude: 39.9115, longitude: 116.4124 },
      { latitude: 39.9107, longitude: 116.4132 },
      { latitude: 39.9101, longitude: 116.4144 },
      { latitude: 39.9098, longitude: 116.4159 },
      { latitude: 39.9101, longitude: 116.4174 },
      { latitude: 39.9109, longitude: 116.4185 },
      { latitude: 39.9118, longitude: 116.4191 },
      { latitude: 39.9127, longitude: 116.4194 },
      { latitude: 39.9136, longitude: 116.4190 },
      { latitude: 39.9143, longitude: 116.4180 },
      { latitude: 39.9147, longitude: 116.4167 },
      { latitude: 39.9145, longitude: 116.4153 },
      { latitude: 39.9139, longitude: 116.4141 },
      { latitude: 39.9131, longitude: 116.4132 },
      { latitude: 39.9122, longitude: 116.4126 },
      { latitude: 39.9113, longitude: 116.4121 },
      { latitude: 39.9105, longitude: 116.4115 },
    ],
    []
  );

  const [isAnimating, setIsAnimating] = useState(false);
  const [fullPathData, setFullPathData] = useState<LatLng[]>([]);
  const [initialCamera, setInitialCamera] = useState<CameraPosition | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [smoothDuration, setSmoothDuration] = useState<number | undefined>(undefined);
  const [markerKey, setMarkerKey] = useState(0);

  const animationProgress = useSharedValue(0);
  const animationStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastIosCameraIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (track.length === 0) return;
    const first = track[0];
    setInitialCamera({
      target: { latitude: first.latitude, longitude: first.longitude },
      zoom: 16,
    });
    const animatedPath = buildAnimatedPath(track);
    setFullPathData(animatedPath);
  }, [track]);

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    if (track.length > 0) {
      setCurrentIndex(track.length - 1);
    }

    const bounds = getRouteBounds(track);
    if (bounds && mapRef.current) {
      mapRef.current.moveCamera(
        {
          target: bounds.center,
          zoom: 14,
        },
        600,
      );
    }
  };

  const handlePlay = () => {
    if (track.length < 2 || fullPathData.length < 2) return;
    setCurrentIndex(0);
    setIsAnimating(true);
    setHasPlayed(true);
     lastIosCameraIndexRef.current = null;
    const totalPoints = fullPathData.length;
    const durationMs = Math.max(4000, totalPoints * 20);
    setSmoothDuration(durationMs / 1000);
    setMarkerKey(prev => prev + 1);
    animationProgress.value = 0;

    if (animationFrameRef.current != null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    animationStartRef.current = Date.now();

    const loop = () => {
      if (!animationStartRef.current) return;
      const elapsed = Date.now() - animationStartRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      animationProgress.value = progress;

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        animationFrameRef.current = null;
        handleAnimationComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  console.log('fullPathData', fullPathData);

  const handlePause = () => {
    setIsAnimating(false);
    if (animationFrameRef.current != null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    animationStartRef.current = null;
  };

  const handleReset = () => {
    setIsAnimating(false);
    setCurrentIndex(0);
    setHasPlayed(false);
    if (animationFrameRef.current != null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    animationStartRef.current = null;
    lastIosCameraIndexRef.current = null;
    animationProgress.value = 0;
    if (track[0] && mapRef.current) {
      mapRef.current.moveCamera(
        {
          target: track[0],
          zoom: 16,
        },
        300
      );
    }
  };

  useEffect(() => {
    if (!isAnimating || fullPathData.length === 0) return;

    const interval = setInterval(() => {
      const totalPoints = fullPathData.length;
      if (totalPoints === 0) return;

      const currentPointCount = Math.ceil(animationProgress.value * totalPoints);
      const safeIndex = Math.min(Math.max(0, currentPointCount - 1), totalPoints - 1);
      setCurrentIndex(safeIndex);

     const position = fullPathData[safeIndex];
if (Platform.OS === 'android' && position && mapRef.current) {
  mapRef.current.moveCamera(
    {
      target: position,
      zoom: 16,
    },
    300,
  );
} else if (Platform.OS === 'ios' && position && mapRef.current) {
  const lastIndex = lastIosCameraIndexRef.current ?? -1;
  const minStep = Math.max(3, Math.floor(totalPoints * 0.1));
  if (Math.abs(safeIndex - lastIndex) >= minStep) {
    lastIosCameraIndexRef.current = safeIndex;
    mapRef.current.moveCamera(
      {
        target: position,
        zoom: 16,
      },
      300,
    );
  }
}
    }, 100);

    return () => clearInterval(interval);
  }, [isAnimating, fullPathData]);

  const animatedPolylineProps = useAnimatedProps(() => {
    'worklet';
    const totalPoints = fullPathData.length;
    if (totalPoints === 0) {
      return { points: [] } as any;
    }
    const biasedProgress = Math.min(1, animationProgress.value * PROGRESS_BIAS);
    const currentPointCount = Math.ceil(biasedProgress * totalPoints);
    const visiblePoints = fullPathData.slice(0, Math.max(2, currentPointCount));
    return {
      points: visiblePoints,
    } as any;
  }, [fullPathData]);

  return (
    <View style={styles.container}>
      {!initialCamera ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>正在初始化轨迹数据...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={ref => {
              mapRef.current = ref;
            }}
            style={styles.map}
            initialCameraPosition={initialCamera}
          >
            <Polyline
              points={track}
              strokeColor="#9e9e9e"
              strokeWidth={4}
            />
            {hasPlayed && fullPathData.length > 1 && (
              <AnimatedPolyline
                points={fullPathData}
                animatedProps={animatedPolylineProps}
                strokeWidth={6}
                strokeColor="#2f95dc"
              />
            )}
            {/* {fullPathData.length > 0 && (
              <Marker
                key={markerKey}
                position={fullPathData[0]}
                smoothMovePath={isAnimating ? fullPathData : []}
                smoothMoveDuration={smoothDuration}
                icon={iconUri}
                iconWidth={10}
                iconHeight={(200 / 120) * 10}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={99}
              />
            )} */}
            <Marker
                // key={markerKey}
                position={fullPathData[0]}
                smoothMovePath={fullPathData}
                smoothMoveDuration={smoothDuration}
                icon={iconUri}
                iconWidth={10}
                iconHeight={(200 / 120) * 10}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={99}
              />
          </MapView>

          <View style={styles.panel}>
            <Text style={styles.title}>轨迹回放示例</Text>
            <Text style={styles.subtitle}>演示沿既定路径平滑移动标记</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>进度</Text>
              <Text style={styles.infoValue}>
                {currentIndex + 1}/{track.length}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>状态</Text>
              <Text style={styles.infoValue}>{isAnimating ? '播放中' : '已暂停'}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
                onPress={handlePlay}
              >
                <Text style={styles.buttonText}>播放</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
                onPress={handlePause}
              >
                <Text style={styles.buttonText}>暂停</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.resetButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleReset}
              >
                <Text style={styles.buttonText}>重置</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#ddd',
    fontSize: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  infoValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#2f95dc',
  },
  secondaryButton: {
    backgroundColor: '#616161',
  },
  resetButton: {
    backgroundColor: '#424242',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.85,
  },
});
