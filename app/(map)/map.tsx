//基础地图使用
import IntroModal from '@/components/IntroModal';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useHeaderHeight } from '@react-navigation/elements';
import { BlurView } from 'expo-blur';
import {
  Circle,
  Cluster,
  ClusterPoint,
  ExpoGaodeMapModule,
  HeatMap,
  LatLng,
  MapView,
  MapViewRef,
  Marker,
  MultiPoint,
  MultiPointItem,
  Polygon,
  Polyline,
  type CameraPosition,
  type Coordinates,
  type ReGeocode
} from 'expo-gaode-map';
import { useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { toast } from 'sonner-native';

const iconUri = Image.resolveAssetSource(require('@/assets/images/positio_icon.png')).uri;

// 模拟热力图数据 (在当前位置周围生成)
const generateHeatMapData = (center: Coordinates, count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      latitude: center.latitude + (Math.random() - 0.5) * 0.05,
      longitude: center.longitude + (Math.random() - 0.5) * 0.05,
      count: Math.floor(Math.random() * 100), // 权重
    });
  }
  return data;
};

// 模拟海量点数据
const generateMultiPointData = (center: Coordinates, count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      latitude: center.latitude + (Math.random() - 0.5) * 0.1,
      longitude: center.longitude + (Math.random() - 0.5) * 0.1,
      title: `Point ${i}`,
      subtitle: `Subtitle ${i}`,
      customerId: `id_${i}`
    });
  }
  return data;
};

// 模拟原生聚合数据
const generateClusterData = (center: Coordinates, count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      latitude: center.latitude + (Math.random() - 0.5) * 0.1,
      longitude: center.longitude + (Math.random() - 0.5) * 0.1,
      title: `Cluster Item ${i}`,
      snippet: `Detail info ${i}`,
    });
  }
  return data;
};

export default function MamScreen() {

  const mapRef = useRef<MapViewRef>(null);
  const [location, setLocation] = useState<Coordinates | ReGeocode | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [initialPosition, setInitialPosition] = useState<CameraPosition | null>(null);
  const [cameraInfo, setCameraInfo] = useState<string>('');
  const [introVisible, setIntroVisible] = useState(false);

  // 高级覆盖物状态
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [heatMapData, setHeatMapData] = useState<LatLng[]>([]);

  const [showMultiPoint, setShowMultiPoint] = useState(false);
  const [multiPointData, setMultiPointData] = useState<MultiPointItem[]>([]);

  const [showCluster, setShowCluster] = useState(false);
  const [clusterData, setClusterData] = useState<ClusterPoint[]>([]);


  // 主题与动态色
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const textColor = colorScheme === 'dark' ? '#fff' : '#1c1c1c';
  const muted = colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : '#444';
  const cardBg = colorScheme === 'dark' ? 'rgba(16,16,16,0.7)' : 'rgba(255,255,255,0.85)';
  const chipBg = colorScheme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)';
  const hairline = colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const navigation = useNavigation()

  const headerHeigth = useHeaderHeight()


  // 用于测试 Marker 动态添加/删除和位置变化
  const [dynamicMarkers, setDynamicMarkers] = useState<Array<{
    id: string;
    latitude: number;
    longitude: number;
    content: string;
    color: 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet' | 'purple';
    width?: number;
    height?: number;
  }>>([]);
  const markerIdCounter = useRef(0);

  // 用于测试声明式覆盖物的动态添加
  const [dynamicCircles, setDynamicCircles] = useState<Array<{
    id: string;
    latitude: number;
    longitude: number;
    radius: number;
    fillColor: string;
    strokeColor: string;
  }>>([]);
  const circleIdCounter = useRef(0);

  const [dynamicPolylines, setDynamicPolylines] = useState<Array<{
    id: string;
    points: Array<{ latitude: number; longitude: number }>;
    color: string;
  }>>([]);
  const polylineIdCounter = useRef(0);
  const [mSize, setMSize] = useState({ width: 0, height: 0 });
  const [dynamicPolygons, setDynamicPolygons] = useState<Array<{
    id: string;
    points: Array<{ latitude: number; longitude: number }>;
    fillColor: string;
    strokeColor: string;
  }>>([]);
  const polygonIdCounter = useRef(0);

  // 隐私协议状态：未同意前不初始化、不渲染地图
  const [privacyAgreed, setPrivacyAgreed] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setIntroVisible(true)}>
          <Text style={{ color: primary }}>说明</Text>
        </Pressable>
      )
    })
  }, [])

  useEffect(() => {
    const init = async () => {
      try {

        // 检查定位权限
        const status = await ExpoGaodeMapModule.checkLocationPermission();

        if (!status.granted) {
          const result = await ExpoGaodeMapModule.requestLocationPermission();
          if (!result.granted) {
            setInitialPosition({ target: { latitude: 39.9, longitude: 116.4 }, zoom: 15 });
            return;
          }
        }

        // 配置定位选项
        ExpoGaodeMapModule.setLocatingWithReGeocode(true);
        ExpoGaodeMapModule.setInterval(5000);
        // ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates(true);
        ExpoGaodeMapModule.setDistanceFilter(10);
        ExpoGaodeMapModule.setDesiredAccuracy(2);


        // 先获取初始位置
        const loc = await ExpoGaodeMapModule.getCurrentLocation();

        console.log('初始位置:', loc);
        setLocation(loc);
        setInitialPosition({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 15
        });

        // 使用便捷方法监听连续定位更新
        const subscription = ExpoGaodeMapModule.addLocationListener((location) => {
          console.log('收到定位更新:', location);
          setLocation(location);
        });

        return () => {
          subscription.remove();
        };
      } catch (error: any) {
        console.error('初始化失败:', JSON.stringify(error));
        if (error?.code === 'PRIVACY_NOT_AGREED') {
          toast.error('请先同意隐私协议')
        } else if (error?.code === 'API_KEY_NOT_SET') {
          toast.error('未设置 API Key')
        } else {
          toast.error(`初始化失败: ${error?.message || error}`)
        }
        setInitialPosition({ target: { latitude: 39.9, longitude: 116.4 }, zoom: 15 });
      }
    };

    init();
  }, [privacyAgreed]);



  // 当 location 变化时更新高级覆盖物数据
  useEffect(() => {
    if (location) {
      if (showHeatMap && heatMapData.length === 0) {
        setHeatMapData(generateHeatMapData(location, 200));
      }
      if (showMultiPoint && multiPointData.length === 0) {
        setMultiPointData(generateMultiPointData(location, 500));
      }
      if (showCluster && clusterData.length === 0) {
        setClusterData(generateClusterData(location, 50));
      }
    }
  }, [location, showHeatMap, showMultiPoint, showCluster]);



  const handleGetLocation = async () => {
    try {
      const loc = await ExpoGaodeMapModule.getCurrentLocation();

      setLocation(loc);
      if (mapRef.current) {
        await mapRef.current.moveCamera({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 15,
        }, 300);
      }
    } catch (error) {
      toast.error('获取位置失败')
    }
  };

  const handleStartLocation = () => {
    ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates(true);
    ExpoGaodeMapModule.start();
    setIsLocating(true);
    toast.success('开始连续定位')
  };

  const handleStopLocation = () => {
    ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates(false);
    ExpoGaodeMapModule.stop();
    setIsLocating(false);
    toast.success('停止定位')
  };

  const handleZoomIn = async () => {
    if (mapRef.current) {
      const pos = await mapRef.current.getCameraPosition();
      if (pos.zoom !== undefined) {
        await mapRef.current.setZoom(pos.zoom + 1, true);
      }
    }
  };

  const handleZoomOut = async () => {
    if (mapRef.current) {
      const pos = await mapRef.current.getCameraPosition();
      if (pos.zoom !== undefined) {
        await mapRef.current.setZoom(pos.zoom - 1, true);
      }
    }
  };


  // 声明式 API: 添加圆形
  const handleAddCircle = () => {
    if (!location) {
      toast.error('请等待定位完成')
      return;
    }

    const randomLatitude = location.latitude + (Math.random() - 0.5) * 0.02;
    const randomLongitude = location.longitude + (Math.random() - 0.5) * 0.02;
    const randomRadius = 200 + Math.random() * 500;
    const randomFillColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}44`;
    const randomStrokeColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    const newCircle = {
      id: `circle_${circleIdCounter.current++}`,
      latitude: randomLatitude,
      longitude: randomLongitude,
      radius: randomRadius,
      fillColor: randomFillColor,
      strokeColor: randomStrokeColor,
    };

    setDynamicCircles(prev => [...prev, newCircle]);
    // Alert.alert('成功', `已添加圆形\n当前共 ${dynamicCircles.length + 1} 个动态圆形`);
  };

  // 动态添加标记
  const handleAddMarker = () => {
    if (!location) {
      toast.error('请等待定位完成')
      return;
    }

    const colors: Array<'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet' | 'purple'> = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'violet', 'purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomOffset = () => (Math.random() - 0.5) * 0.02;

    const newMarker = {
      id: `marker_${markerIdCounter.current++}`,
      latitude: location.latitude + randomOffset(),
      longitude: location.longitude + randomOffset(),
      content: `动态标记 #${markerIdCounter.current}`,
      color: randomColor,
      cacheKey: `marker_${markerIdCounter.current}`,
    };

    setDynamicMarkers(prev => [...prev, newMarker]);

  };

  //动态添加折线
  const handleAddPolyline = () => {
    if (!location) {
      toast.error('请等待定位完成')
      return;
    }

    const randomOffset = () => (Math.random() - 0.5) * 0.02;
    const points = [
      { latitude: location.latitude + randomOffset(), longitude: location.longitude + randomOffset() },
      { latitude: location.latitude + randomOffset(), longitude: location.longitude + randomOffset() },
      { latitude: location.latitude + randomOffset(), longitude: location.longitude + randomOffset() },
    ];
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    const newPolyline = {
      id: `polyline_${polylineIdCounter.current++}`,
      points,
      color: randomColor,
    };

    setDynamicPolylines(prev => [...prev, newPolyline]);

  };

  // 动态添加多边形
  const handleAddPolygon = () => {
    if (!location) {
      toast.error('请等待定位完成')
      return;
    }

    const randomOffset = () => (Math.random() - 0.5) * 0.02;
    const points = [
      { latitude: location.latitude + randomOffset(), longitude: location.longitude + randomOffset() },
      { latitude: location.latitude + randomOffset(), longitude: location.longitude + randomOffset() },
      { latitude: location.latitude + randomOffset(), longitude: location.longitude + randomOffset() },
    ];
    const randomFillColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}44`;
    const randomStrokeColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    const newPolygon = {
      id: `polygon_${polygonIdCounter.current++}`,
      points,
      fillColor: randomFillColor,
      strokeColor: randomStrokeColor,
    };

    setDynamicPolygons(prev => [...prev, newPolygon]);

  };

  // 移除所有动态覆盖物
  const handleRemoveAllOverlays = () => {
    setShowHeatMap(false);
    setShowMultiPoint(false);
    setShowCluster(false);
    const total = dynamicCircles.length + dynamicMarkers.length + dynamicPolylines.length + dynamicPolygons.length;
    if (total === 0) {
      toast.error('没有可移除的覆盖物')
      return;
    }

    setDynamicCircles([]);
    setDynamicMarkers([]);
    setDynamicPolylines([]);
    setDynamicPolygons([]);

    toast.success(`已移除所有 ${total} 个动态覆盖物`)
  };

  // 切换热力图
  const toggleHeatMap = () => {
    setShowHeatMap((prev) => {
      const next = !prev;
      console.log('HeatMap toggle:', { prev, next, hasLocation: !!location });
      if (next) {
        setShowMultiPoint(false);
        setShowCluster(false);
        if (location) {
          const nextData = generateHeatMapData(location, 400);
          console.log('HeatMap data generated:', { length: nextData.length, sample: nextData[0] });
          setHeatMapData(nextData as any);
        }
      }
      return next;
    });
  };

  // 切换海量点
  const toggleMultiPoint = () => {
    setShowMultiPoint(!showMultiPoint);
    if (!showMultiPoint) {
      setShowHeatMap(false);
      setShowCluster(false);
    }
  };

  // 切换原生聚合
  const toggleCluster = () => {
    setShowCluster((prev) => {
      const next = !prev;
      if (next) {
        setShowHeatMap(false);
        setShowMultiPoint(false);
        if (location) {
          // 生成模拟聚合数据
          const points: ClusterPoint[] = [];
          for (let i = 0; i < 200; i++) {
            points.push({
              latitude: location.latitude + (Math.random() - 0.5) * 0.05,
              longitude: location.longitude + (Math.random() - 0.5) * 0.05,
              properties: { id: i, title: `Point ${i}` }
            });
          }
          setClusterData(points);
        }
      }
      return next;
    });
  };

  if (!initialPosition) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.title, { color: textColor }]}>正在加载地图...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#f5f5f5' }]}>

      <MapView
        ref={mapRef}
        style={styles.map}
        myLocationEnabled={true}
        indoorViewEnabled={true}
        trafficEnabled={true}
        compassEnabled={true}
        tiltGesturesEnabled={true}
        initialCameraPosition={initialPosition as CameraPosition}
        minZoom={3}
        maxZoom={20}
        userLocationRepresentation={{
          showsAccuracyRing: false,
          showsHeadingIndicator: true
          // image: iconUri,
          // imageWidth: 40,
          // imageHeight: 40,
        }}
        onLoad={() => console.log('地图加载完成')}
        onMapPress={(e) => console.log('地图点击:', e.nativeEvent)}
        onMapLongPress={(e) => console.log('地图长按:', e.nativeEvent)}
        onCameraMove={({ nativeEvent }) => {
          const { cameraPosition } = nativeEvent;
          const lat = cameraPosition.target?.latitude ?? 0;
          const lng = cameraPosition.target?.longitude ?? 0;
          const zoom = cameraPosition.zoom ?? 0;
          const bearing = cameraPosition.bearing ?? 0;
          const info = `移动中 · 中心 ${cameraPosition.target?.latitude.toFixed(4)}, ${cameraPosition.target?.longitude.toFixed(4)} · 缩放 ${zoom.toFixed(2)} · 旋转 ${bearing.toFixed(2)}°`;
          setCameraInfo(info);
        }}
        onCameraIdle={({ nativeEvent }) => {
          const { cameraPosition } = nativeEvent;
          const lat = cameraPosition.target?.latitude ?? 0;
          const lng = cameraPosition.target?.longitude ?? 0;
          const zoom = cameraPosition.zoom ?? 0;
          const info = `已停止 · 中心 ${lat.toFixed(4)}, ${lng.toFixed(4)} · 缩放 ${zoom.toFixed(2)}`;
          setCameraInfo(info);
        }}
      >
         {/* 高级覆盖物：热力图 */}
        <HeatMap
          data={heatMapData}
          visible={showHeatMap}
          radius={30}
          opacity={0.5}
          gradient={{
            colors: ['blue', 'green', 'red'],
            startPoints: [0.2, 0.5, 0.9]
          }}
        />

        {/* 高级覆盖物：海量点 */}
        {showMultiPoint && (
          <MultiPoint
            points={multiPointData}
            icon={iconUri} // 复用图标
            iconWidth={30}
            iconHeight={30}
            onMultiPointPress={(e) => Alert.alert('海量点点击', `index: ${e.nativeEvent.index}`)}
          />
        )}

        {/* 高级覆盖物：原生聚合 */}
        {showCluster && (
          <Cluster
            points={clusterData}
            radius={30}
            minClusterSize={1}
            // 分级样式配置
            clusterBuckets={[
              { minPoints: 1, backgroundColor: '#00BFFF' }, // 1个: 蓝色
              { minPoints: 2, backgroundColor: '#32CD32' }, // 2-4个: 绿色
              { minPoints: 5, backgroundColor: '#FFA500' }, // 5-9个: 橙色
              { minPoints: 10, backgroundColor: '#FF4500' } // 10+个: 红色
            ]}
            // 自定义聚合点样式 (作为兜底)
            clusterStyle={{
              backgroundColor: '#999999',
              borderColor: 'white',       // 白色边框
              borderWidth: 3,             // 边框加粗
              width: 40,
              height: 40,
            }}
            // 自定义文字样式
            clusterTextStyle={{
              color: 'white',             // 白色文字
              fontSize: 16,               // 更大的字体
            }}
            onClusterPress={(e) => {
              const { count, pois } = e.nativeEvent;
              console.log('聚合点击:', JSON.stringify(e.nativeEvent));
              if (count > 1) {
                Alert.alert('聚合点点击', `包含 ${count} 个点\n前3个ID: ${pois?.slice(0, 3).map((p: any) => p.properties?.id).join(', ')}...`);
              } else {
                Alert.alert('单点点击', `ID: ${pois?.[0]?.properties?.id ?? 'unknown'}\nTitle: ${pois?.[0]?.properties?.title ?? 'none'}`);
              }
            }}
          />
        )}

        {location && (
          <Circle
            center={{ latitude: location.latitude, longitude: location.longitude }}
            radius={300}
            fillColor="#4400FF00"
            strokeColor="#FF00FF00"
            strokeWidth={3}
            zIndex={99}
            onCirclePress={() => toast.info('点击了声明式圆形')}
          />
        )}

        {dynamicCircles.map((circle) => (
          <Circle
            key={circle.id}
            center={{ latitude: circle.latitude, longitude: circle.longitude }}
            radius={circle.radius}
            fillColor={circle.fillColor}
            strokeColor={circle.strokeColor}
            strokeWidth={2}
            onCirclePress={() => toast.info(`点击了动态圆形 #${circle.id}`)}
          />
        ))}



        {dynamicPolylines.map((polyline) => (
          <Polyline key={polyline.id} points={polyline.points} strokeWidth={5} strokeColor={polyline.color} />
        ))}

        {dynamicPolygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            points={polygon.points}
            fillColor={polygon.fillColor}
            strokeColor={polygon.strokeColor}
            strokeWidth={2}
          />
        ))}

        {dynamicMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.content}
            pinColor={marker.color}
            zIndex={99}
            customViewWidth={marker.width}
            customViewHeight={marker.height}
            cacheKey={marker.id}
            onMarkerPress={() => Alert.alert('动态标记', `点击了 ${marker.content}\nID: ${marker.id}`)}
          >
            <View
              style={{ alignSelf: 'flex-start' }}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (marker.width !== width || marker.height !== height) {
                  setDynamicMarkers(prev =>
                    prev.map(m =>
                      m.id === marker.id
                        ? { ...m, width: Math.ceil(width), height: Math.ceil(height) }
                        : m
                    )
                  );
                }
              }}
            >
              <Text
                style={[styles.dynamicMarkerText, { backgroundColor: marker.color, borderRadius: 10 }]}
                numberOfLines={2}>
                {marker.content}这是文字内容
              </Text>
            </View>
          </Marker>
        ))}

        {location && (
          <Marker
            key="fixed_current_location_marker"
            position={{ latitude: location.latitude, longitude: location.longitude }}
            zIndex={99}
            title={location.address}
            cacheKey="fixed_current_location_marker"
            customViewWidth={mSize.width}
            customViewHeight={mSize.height}
            anchor={{ x: 0.5, y: 0.5 }}
            onMarkerPress={() => Alert.alert('标记', '点击了当前位置标记')}
          >
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
                paddingVertical: 4,
              }}
              onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                if (mSize.width !== width || mSize.height !== height) {
                  setMSize({ width: Math.ceil(width), height: Math.ceil(height) });
                }
              }}
            >
              <Text
                style={[
                  styles.dynamicMarkerText,
                  {
                    backgroundColor: '#007AFF',
                    borderRadius: 10,
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={2}
              >
                {location?.address}
              </Text>
            </View>
          </Marker>
        )}



        <Marker
          key="draggable_marker"
          position={{ latitude: 39.92, longitude: 116.42 }}
          title="可拖拽标记"
          draggable={true}
          cacheKey={"draggable_marker"}
          pinColor="purple"

          onMarkerPress={() => toast.info('点击了可拖拽标记')}
          onMarkerDragEnd={(e) => {
            toast.info(`拖拽结束\n新位置: ${e.nativeEvent.latitude.toFixed(6)}, ${e.nativeEvent.longitude.toFixed(6)}`);
            // Alert.alert('拖拽结束', `新位置: ${e.nativeEvent.latitude.toFixed(6)}, ${e.nativeEvent.longitude.toFixed(6)}`);
          }}
        />

        <Marker
          key="custom_icon_marker"
          position={{ latitude: 39.93, longitude: 116.43 }}
          title="自定义图标"
          snippet="自定义图标描述"
          icon={iconUri}
          iconWidth={40}
          iconHeight={40}
        />

        {Platform.OS === 'ios' && (
          <Marker
            key="ios_animated_marker"
            position={{ latitude: 39.94, longitude: 116.44 }}
            title="iOS 动画标记"
            pinColor="green"
            animatesDrop={true}
            cacheKey={"ios_animated_marker"}
            onMarkerPress={() => toast.info('点击了 iOS 动画标记')}
          />
        )}

        <Polygon
          points={[
            { latitude: 39.88, longitude: 116.38 },
            { latitude: 39.88, longitude: 116.42 },
            { latitude: 39.86, longitude: 116.40 },
          ]}
          fillColor="rgba(255, 0, 0, 0.5)"
          strokeColor="#FFFF0000"
          strokeWidth={3}
          zIndex={1}
          onPolygonPress={() => toast.info('点击了多边形')}
        />

        <Polyline
          points={[
            { latitude: 39.85, longitude: 116.35 },
            { latitude: 39.87, longitude: 116.37 },
            { latitude: 39.89, longitude: 116.35 },
          ]}
          strokeWidth={5}
          strokeColor="#FFFF0000"
          dotted={false}
          onPolylinePress={() => toast.info('点击了实线折线')}
        />

        <Polyline
          points={[
            { latitude: 39.85, longitude: 116.45 },
            { latitude: 39.87, longitude: 116.47 },
            { latitude: 39.89, longitude: 116.45 },
          ]}
          strokeWidth={5}
          strokeColor="#FF0000FF"
          dotted={true}
          onPolylinePress={() => toast.info('点击了虚线折线')}
        />

        <Polyline
          points={[
            { latitude: 39.95, longitude: 116.35 },
            { latitude: 39.97, longitude: 116.37 },
            { latitude: 39.99, longitude: 116.35 },
          ]}
          strokeWidth={20}
          strokeColor="#FFFF0000"
          texture={iconUri}
          dotted={false}
          onPolylinePress={() => toast.info('点击了纹理折线')}
        />

       

      </MapView>

      {/* 顶部信息 Chip */}
      <View style={[styles.overlayTop, {
        top: headerHeigth
      }]}>
        {!!cameraInfo && (
          <View style={[styles.chipWrap, { borderColor: hairline }]}>
            <BlurView
              intensity={100}
              experimentalBlurMethod={'dimezisBlurView'}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.chipText, { color: textColor }]} numberOfLines={2} ellipsizeMode="tail">
              📷 {cameraInfo}
            </Text>
          </View>
        )}
        {location && 'address' in location && location.address ? (
          <View style={[styles.chipWrap, { borderColor: hairline }]}>
            <BlurView
              intensity={100}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFillObject}
              experimentalBlurMethod={'dimezisBlurView'}
            />
            <Text style={[styles.chipText, { color: muted }]} numberOfLines={1} ellipsizeMode="tail">
              📍 {location.address}
            </Text>
          </View>
        ) : null}
      </View>


      {/* 底部悬浮操作面板 */}
      <View style={[styles.overlayBottom]}>
        <View style={[styles.panelWrap, { borderColor: hairline }]}>
          <BlurView
            intensity={100}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            // experimentalBlurMethod={'dimezisBlurView'}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.panelInner}>
            <Text style={[styles.panelTitle, { color: textColor }]}>常用操作</Text>

            <View style={styles.actionRow}>
              <Pressable style={[styles.actionBtn, { backgroundColor: primary }]} onPress={handleGetLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                <Text style={styles.actionBtnText}>定位</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: isLocating ? '#FF6347' : '#4CAF50' }]}
                onPress={isLocating ? handleStopLocation : handleStartLocation}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <Text style={styles.actionBtnText}>{isLocating ? '停止' : '开始'}</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#2196F3' }]} onPress={handleZoomIn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                <Text style={styles.actionBtnText}>放大</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#FF9800' }]} onPress={handleZoomOut} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                <Text style={styles.actionBtnText}>缩小</Text>
              </Pressable>
            </View>

            <View style={[styles.actionRow, { marginTop: 10 }]}>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={handleAddCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                <Text style={styles.actionBtnText}>圆形</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#2196F3' }]} onPress={handleAddMarker} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                <Text style={styles.actionBtnText}>标记</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#9C27B0' }]} onPress={handleAddPolyline} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                <Text style={styles.actionBtnText}>折线</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#FF5722' }]} onPress={handleAddPolygon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                <Text style={styles.actionBtnText}>多边形</Text>
              </Pressable>
            </View>

            <Text style={[styles.panelTitle, { color: textColor, marginTop: 12 }]}>高级功能</Text>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: showHeatMap ? '#F44336' : '#607D8B' }]}
                onPress={toggleHeatMap}
              >
                <Text style={styles.actionBtnText}>热力图</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: showMultiPoint ? '#FF9800' : '#607D8B' }]}
                onPress={toggleMultiPoint}
              >
                <Text style={styles.actionBtnText}>海量点</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: showCluster ? '#3F51B5' : '#607D8B' }]}
                onPress={toggleCluster}
              >
                <Text style={styles.actionBtnText}>聚合</Text>
              </Pressable>
            </View>

            <Pressable style={[styles.removeBtn]} onPress={handleRemoveAllOverlays} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
              <Text style={styles.removeBtnText}>移除所有覆盖物</Text>
            </Pressable>
          </View>
        </View>
      </View>
      {/* 统一介绍弹框 */}
      <IntroModal
        visible={introVisible}
        onClose={() => setIntroVisible(false)}
        title="地图页功能概览"
        bullets={[
          '定位与相机控制',
          '动态覆盖物（圆形 / 标记 / 折线 / 多边形）',
          '毛玻璃悬浮信息与操作面板',
          '示例按钮便于快速体验功能',
        ]}
        actions={[
          { text: '知道了', onPress: () => setIntroVisible(false), type: 'primary' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
    minHeight: 400,
  },
  // 顶部信息区域
  overlayTop: {
    position: 'absolute',
    // top: Platform.OS === 'ios' ? 124 : 20 ,
    left: 16,
    right: 16,
    gap: 8,
  },
  overlayTopRight: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    right: 16,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    maxWidth: '80%',
  },
  chipWrap: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    maxWidth: '100%',
    overflow: 'hidden',
    // 轻微阴影，提升层次（Android 用 elevation 生效）
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,

  },
  chipText: {
    fontSize: 12,
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#444',
  },
  // 底部悬浮面板
  overlayBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 24 : 16,

  },
  panel: {
    // 兼容旧用法占位，实际未直接使用
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  panelWrap: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    // 阴影
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    backgroundColor: Platform.OS == 'android' ? 'rgba(255,255,255,0.5)' : 'transparent',
  },
  panelInner: {
    padding: 12,
    backgroundColor: Platform.OS == 'android' ? 'rgba(255,255,255,0.5)' : 'transparent',

  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'transparent',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  removeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6347',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  // 原有标注样式保留
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  markerContainer: {
    backgroundColor: 'red',
    borderColor: '#ccc',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    width: 200,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    color: 'white',
    fontSize: 12,
  },
  dynamicMarkerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
