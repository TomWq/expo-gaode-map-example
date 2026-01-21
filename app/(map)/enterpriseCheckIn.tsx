import { BlurView } from 'expo-blur';
import {
  Circle,
  ExpoGaodeMapModule,
  MapView,
  MapViewRef,
  Marker,
  Polyline,
  type LatLng,
  type ReGeocode
} from 'expo-gaode-map';
import { GaodeWebAPI, Step } from 'expo-gaode-map-web-api';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { toast } from 'sonner-native';

const OFFICE_LOCATION: LatLng = {
  latitude: 39.915,
  longitude: 116.403,
};
const endIcon = Image.resolveAssetSource(require('@/assets/images/end.png')).uri;
const startIcon = Image.resolveAssetSource(require('@/assets/images/car_start.png')).uri;
const CHECK_IN_RADIUS = 200; // 200米打卡范围

// --------------------------------------------------------
// 调整这里可以控制内容在地图上的垂直位置
// 0.5 表示正中心，值越大内容越靠上（为了避开底部面板）
const VERTICAL_VISUAL_CENTER = 1.5; 
// --------------------------------------------------------

export default function EnterpriseCheckIn() {
  const mapRef = useRef<MapViewRef | null>(null);
  const api = useMemo(() => new GaodeWebAPI(), []);

  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [routePoints, setRoutePoints] = useState<LatLng[]>([]);
  const [isInRange, setIsInRange] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [initialCamera, setInitialCamera] = useState<{target: LatLng, zoom: number} | null>(null);

  // 初始化路线和监听位置变化
  useEffect(() => {
    let locationSubscription: any;

    const init = async () => {
      try {
        // 1. 获取初始位置
        let loc = await ExpoGaodeMapModule.getCurrentLocation();
        let startPos: LatLng;
        
        if (loc) {
          startPos = { latitude: loc.latitude, longitude: loc.longitude };
        } else {
          startPos = { latitude: 39.908692, longitude: 116.397477 };
        }
        setCurrentLocation(startPos);

        // 2. 规划步行路线
        const origin = `${startPos.longitude},${startPos.latitude}`;
        const destination = `${OFFICE_LOCATION.longitude},${OFFICE_LOCATION.latitude}`;
        
        const res = await api.route.walking(origin, destination, {
          show_fields: 'cost,polyline,navi',
        });
        
        // 默认相机位置（如果路径规划失败）
        // 0.0001 是 zoom 15 下大约 10m 的步进
        const getOffsetForZoom = (z: number) => {
          // 根据缩放级别动态调整偏移量，保持内容始终在视觉中心
          const baseOffset = 0.004; // 基础偏移
          return baseOffset * Math.pow(2, 15 - z) * (VERTICAL_VISUAL_CENTER - 0.5);
        };

        let bestCamera = { 
          target: { 
            latitude: startPos.latitude - getOffsetForZoom(15), 
            longitude: startPos.longitude 
          }, 
          zoom: 15 
        };

        if (res.route && res.route.paths && res.route.paths[0]) {
          const path = res.route.paths[0];
          const points: LatLng[] = [];
          path.steps.forEach((step: Step) => {
            if (step && step.polyline) {
              const stepPoints = step.polyline.split(';').map((p: string) => {
                const [lng, lat] = p.split(',');
                return { latitude: parseFloat(lat), longitude: parseFloat(lng) };
              });
              points.push(...stepPoints);
            }
          });
          
          const simplifiedPoints = ExpoGaodeMapModule.simplifyPolyline(points, 5);
          setRoutePoints(simplifiedPoints);

          // 计算边界框以适应路线
          if (simplifiedPoints.length > 0) {
            let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
            simplifiedPoints.forEach(p => {
              minLat = Math.min(minLat, p.latitude);
              maxLat = Math.max(maxLat, p.latitude);
              minLng = Math.min(minLng, p.longitude);
              maxLng = Math.max(maxLng, p.longitude);
            });
            
            const centerLat = (minLat + maxLat) / 2;
            const centerLng = (minLng + maxLng) / 2;
            const maxDelta = Math.max(maxLat - minLat, maxLng - minLng);
            
            // 经验公式计算 zoom
            let zoom = 15;
            if (maxDelta > 0.1) zoom = 12;
            else if (maxDelta > 0.05) zoom = 13;
            else if (maxDelta > 0.02) zoom = 14;
            else if (maxDelta > 0.01) zoom = 15;
            else zoom = 15;

            bestCamera = {
              target: { 
                latitude: centerLat - getOffsetForZoom(zoom), 
                longitude: centerLng 
              },
              zoom: zoom
            };
          }
        }

        setInitialCamera(bestCamera);

        // 3. 开启连续定位和监听
        // 设置定位配置
        ExpoGaodeMapModule.setInterval(2000); // 2秒更新一次
        ExpoGaodeMapModule.setSensorEnable(true); // 使用传感器辅助定位

        // 监听位置更新
        locationSubscription = ExpoGaodeMapModule.addListener('onLocationUpdate', (location: ReGeocode) => {
          const newPos = { latitude: location.latitude, longitude: location.longitude };
          setCurrentLocation(newPos);
          
          // 实时判断是否在打卡范围内
          const inside = ExpoGaodeMapModule.isPointInCircle(newPos, OFFICE_LOCATION, CHECK_IN_RADIUS);
          setIsInRange(inside);
        });

        // 启动定位
        ExpoGaodeMapModule.start();
        
        setLoading(false);
      } catch (error) {
        console.error('初始化失败:', error);
        setLoading(false);
        toast.error('数据加载失败');
      }
    };

    init();

    // 页面销毁时停止定位和监听
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      ExpoGaodeMapModule.stop();
    };
  }, [api]);

  // 处理打卡动作
  const handleCheckIn = () => {
    if (!isInRange) {
      toast.error('不在打卡范围内，请靠近办公区域');
      return;
    }
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setCheckInTime(timeStr);
    toast.success('打卡成功！');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在进入考勤系统...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 地图区域 */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialCameraPosition={initialCamera || {
            target: currentLocation || OFFICE_LOCATION,
            zoom: 13,
          }}
          myLocationEnabled
        >
          {/* 办公区域范围 */}
          <Circle
            center={OFFICE_LOCATION}
            radius={CHECK_IN_RADIUS}
            fillColor="rgba(0, 122, 255, 0.15)"
            strokeColor="#007AFF"
            strokeWidth={2}
          />

          {/* 终点标记 (办公楼) */}
          <Marker
            position={OFFICE_LOCATION}
            title="办公大楼"
            snippet="打卡目的地"
            icon={endIcon}
            iconWidth={40}
            iconHeight={40}
          />

          {/* 起点标记 (我的位置) */}
          {currentLocation && (
            <Marker
              position={currentLocation}
              title="当前位置"
              snippet="考勤起点"
              icon={startIcon}
              iconWidth={40}
              iconHeight={40}
              zIndex={1000}
              // 可以自定义图标
            />
          )}

          {/* 渲染路线 - 企微风格：双层叠加实现边框效果 */}
          {routePoints.length > 0 && (
            <>
              {/* 底层：边框线 */}
              <Polyline
                points={routePoints}
                strokeColor="#2D8C3C"
                strokeWidth={12}
                zIndex={10}
              />
              {/* 顶层：主色线 */}
              <Polyline
                points={routePoints}
                strokeColor="#4CD964"
                strokeWidth={6}
                zIndex={11}
              />
            </>
          )}
        </MapView>
      </View>

      {/* 底部企微风格打卡面板 */}
      <View style={styles.bottomPanel}>
         <BlurView
              intensity={80}
              tint={'light'}
              style={StyleSheet.absoluteFillObject}
              experimentalBlurMethod={'dimezisBlurView'}
            />
        <View style={styles.panelHeader}>
          <Text style={styles.companyName}>大连尚博信科技有限公司</Text>
          <Text style={styles.attendanceType}>考勤组：研发中心</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>上班时间</Text>
            <Text style={styles.infoValue}>09:00</Text>
          </View>
          <View style={[styles.infoItem, styles.infoDivider]}>
            <Text style={styles.infoLabel}>下班时间</Text>
            <Text style={styles.infoValue}>18:00</Text>
          </View>
        </View>

        <View style={styles.locationStatus}>
          <Text style={[styles.statusText, isInRange ? styles.statusInRange : styles.statusOutOfRange]}>
            {isInRange ? '📍 已进入打卡范围' : '📍 不在打卡范围内'}
          </Text>
        </View>

        {checkInTime ? (
          <View style={styles.successContainer}>
            <Text style={styles.successTime}>{checkInTime}</Text>
            <Text style={styles.successText}>已打卡成功</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.checkInButton, !isInRange && styles.checkInButtonDisabled]}
            onPress={handleCheckIn}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <Text style={styles.buttonTime}>上班打卡</Text>
              <Text style={styles.buttonSub}>{new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
  },
  panelHeader: {
    marginBottom: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  attendanceType: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoDivider: {
    borderLeftWidth: 1,
    borderLeftColor: '#EEE',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  locationStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusInRange: {
    color: '#4CD964',
  },
  statusOutOfRange: {
    color: '#FF3B30',
  },
  checkInButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#007AFF',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: "0 4px 12px rgba(0, 122, 255, 0.3)",
  },
  checkInButtonDisabled: {
    backgroundColor: '#CCC',
   boxShadow: "0 4px 12px rgba(0, 122, 255, 0.2)",
  },
  buttonInner: {
    alignItems: 'center',
  },
  buttonTime: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  successText: {
    fontSize: 16,
    color: '#4CD964',
    marginTop: 8,
    fontWeight: '600',
  },
});
