import { ExpoGaodeMapModule, MapView, MapViewRef, Marker, Polygon, type CameraPosition, type Coordinates, type LatLng } from 'expo-gaode-map';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { toast } from 'sonner-native';

export default function CheckInExample() {
  const mapRef = useRef<MapViewRef | null>(null);
  const api = useMemo(() => new GaodeWebAPI(), []);

  const workArea = useMemo<LatLng[]>(
    () => [
      { latitude: 39.9095, longitude: 116.396 },
      { latitude: 39.9095, longitude: 116.401 },
      { latitude: 39.9065, longitude: 116.401 },
      { latitude: 39.9065, longitude: 116.396 },
    ],
    []
  );

  const workCenter = useMemo<LatLng>(
    () => ({
      latitude: (39.9095 + 39.9065) / 2,
      longitude: (116.396 + 116.401) / 2,
    }),
    []
  );

  const [initialCamera, setInitialCamera] = useState<CameraPosition | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const status = await ExpoGaodeMapModule.checkLocationPermission();
        if (!status.granted) {
          const req = await ExpoGaodeMapModule.requestLocationPermission();
          if (!req.granted) {
            setInitialCamera({
              target: { latitude: 39.908692, longitude: 116.397477 },
              zoom: 15,
            });
            toast.error('未授予定位权限，使用默认视角');
            return;
          }
        }
        const loc = await ExpoGaodeMapModule.getCurrentLocation();
        setLocation(loc);
        setInitialCamera({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 17,
        });
        const position = `${loc.longitude},${loc.latitude}`;
        try {
          const res = await api.geocode.regeocode(position);
          const formatted = res.regeocode?.formatted_address;
          if (formatted) {
            setAddress(formatted);
          }
        } catch {
        }
      } catch (error: any) {
        toast.error(error?.message || '初始化失败');
        setInitialCamera({
          target: { latitude: 39.908692, longitude: 116.397477 },
          zoom: 15,
        });
      }
    };
    init();
  }, [api]);

  const handleCheckIn = async () => {
    if (!location) {
      toast.error('尚未获取到当前位置');
      return;
    }
    setChecking(true);
    try {
      const point: LatLng = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
      const inside = await ExpoGaodeMapModule.isPointInPolygon(point, workArea);
      if (inside) {
        setResult('success');
        toast.success('签到成功，已在打卡范围内');
      } else {
        setResult('fail');
        toast.error('当前位置不在打卡范围内');
      }
    } catch (error: any) {
      toast.error(error?.message || '签到失败');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;
    if (!initialCamera) return;
    mapRef.current.moveCamera(initialCamera, 300);
  }, [initialCamera]);

  if (!initialCamera) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>正在初始化地图...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={ref => {
          mapRef.current = ref;
        }}
        style={styles.map}
        myLocationEnabled
        initialCameraPosition={initialCamera}
      >
        <Polygon
          points={workArea}
          fillColor="#2234ff33"
          strokeColor="#2234ff"
          strokeWidth={3}
        />
        <Marker
          position={workCenter}
          title="打卡点"
          snippet="请在该范围内完成签到"
          pinColor="orange"
        />
        {location && (
          <Marker
            position={{ latitude: location.latitude, longitude: location.longitude }}
            title="当前位置"
           
          />
        )}
      </MapView>
      <View style={styles.panel}>
        <Text style={styles.title}>位置签到打卡</Text>
        <Text style={styles.subtitle}>示例打卡范围位于天安门附近矩形区域</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>当前地址</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            {address || '正在获取地址信息...'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>打卡结果</Text>
          <Text style={[styles.infoValue, result === 'success' && styles.successText, result === 'fail' && styles.failText]}>
            {result === null && '未打卡'}
            {result === 'success' && '已在范围内，签到成功'}
            {result === 'fail' && '不在范围内，签到失败'}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.checkButton,
            pressed && styles.pressed,
            checking && styles.disabledButton,
          ]}
          onPress={handleCheckIn}
          disabled={checking}
        >
          <Text style={styles.checkButtonText}>{checking ? '正在签到...' : '立即签到'}</Text>
        </Pressable>
      </View>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#aaa',
    fontSize: 12,
    width: 70,
  },
  infoValue: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
  },
  successText: {
    color: '#4caf50',
  },
  failText: {
    color: '#f44336',
  },
  checkButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2f95dc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.85,
  },
});
