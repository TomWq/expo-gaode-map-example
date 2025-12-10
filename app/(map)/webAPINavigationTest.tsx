
import { RouteCard } from '@/components/RouteCard';
import { RouteInfoCard } from '@/components/RouteInfoCard';
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { RouteData, useRoutePlanning } from '@/hooks/useRoutePlanning';
import { getRouteBounds, simplifyPath } from '@/utils/routeUtils';
import { useHeaderHeight } from '@react-navigation/elements';
import { BlurView } from 'expo-blur';
import { ExpoGaodeMapModule, MapView, MapViewRef, Marker, Polyline } from 'expo-gaode-map';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { toast } from 'sonner-native';

// 创建动画组件
const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedMarker = Animated.createAnimatedComponent(Marker);

export default function WebAPINavigationTest() {

   const api = useMemo(() => new GaodeWebAPI({ key: '' }), []);
  const headerHeight = useHeaderHeight();
  
  // 使用自定义 Hooks
  const routePlanning = useRoutePlanning(api);
  const addressSearch = useAddressSearch();
  
  const [originText, setOriginText] = useState('当前位置');
  const [destinationText, setDestinationText] = useState('北京南站');
  
  const [selectedOrigin, setSelectedOrigin] = useState<{
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  } | null>(null);
  
  const [selectedDestination, setSelectedDestination] = useState<{
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  } | null>(null);
  
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [fullPathData, setFullPathData] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(-1);
  const [routeResult, setRouteResult] = useState<RouteData | null>(null);
  
  // Reanimated shared values
  const animationProgress = useSharedValue(0);
  const totalPointsShared = useSharedValue(0);
  
  const mapRef = useRef<MapViewRef>(null);

  // 初始化 API
  useEffect(() => {

    // 设置默认终点
    setSelectedDestination({
      latitude: 39.865195,
      longitude: 116.378865,
      name: '北京南站',
      address: '北京市丰台区永外大街车站路12号',
    });
  }, []);

  // 获取当前位置
  const getCurrentLocation = async () => {
    try {
      const location = await ExpoGaodeMapModule.getCurrentLocation();
      
      if (location) {
        setCurrentLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        
        setOriginText('当前位置');
        setSelectedOrigin({
          latitude: location.latitude,
          longitude: location.longitude,
          name: '当前位置',
          address: '当前位置',
        });
        
        mapRef.current?.moveCamera({
          target: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          zoom: 14,
        }, 1000);
        
        toast.success('位置获取成功');
      }
    } catch (error) {
      console.error('[WebAPI] 获取位置失败:', error);
      toast.error('获取位置失败，请检查定位权限');
    }
  };

  // 处理搜索输入
  const handleSearchInput = (text: string, inputType: 'origin' | 'destination') => {
    if (inputType === 'origin') {
      setOriginText(text);
    } else {
      setDestinationText(text);
    }
    addressSearch.handleSearchChange(text, inputType);
  };

  // 选择地址
  const handleSelectAddress = async (suggestion: any) => {
    const location = await addressSearch.selectSuggestion(suggestion);
    if (!location) return;

    if (addressSearch.activeInput === 'origin') {
      setOriginText(suggestion.name);
      setSelectedOrigin(location);
    } else {
      setDestinationText(suggestion.name);
      setSelectedDestination(location);
    }

    try {
      Keyboard.dismiss();
    } catch (e) {
      // ignore
    }

    // 移动地图
    mapRef.current?.moveCamera({ target: location, zoom: 14 }, 500);
  };

  // 清空搜索
  const handleClearSearch = (inputType: 'origin' | 'destination') => {
    if (inputType === 'origin') {
      setOriginText('当前位置');
      setSelectedOrigin(null);
    } else {
      setDestinationText('北京南站');
      setSelectedDestination(null);
    }
    addressSearch.clearSearch();
  };

  // 规划路径
  const calculateRoute = async () => {
    const originLocation = selectedOrigin || currentLocation;
    const destinationLocation = selectedDestination;

    if (!originLocation) {
      toast.info('请先获取当前位置或选择出发点');
      return;
    }

    if (!destinationLocation) {
      toast.info('请选择目的地');
      return;
    }

    const routes = await routePlanning.calculateRoute(originLocation, destinationLocation);
    if (routes) {
      setSelectedRouteIndex(-1);
      setRouteResult(null);
      setFullPathData([]);
    }
  };

  // 直接显示完整路线（不播放动画）
  const showFullRoute = (fullPath: Array<{ latitude: number; longitude: number }>) => {
    const simplifiedPath = simplifyPath(fullPath, 150);
    console.log(`[WebAPI] 显示完整路线，点数: ${fullPath.length}, 简化后: ${simplifiedPath.length}`);
    
    setFullPathData(simplifiedPath);
    setIsAnimating(false);
    
    const totalPoints = simplifiedPath.length;
    totalPointsShared.value = totalPoints;
    animationProgress.value = 1;
    
    // 调整视角
    const bounds = getRouteBounds(fullPath);
    if (bounds && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.moveCamera({
          target: bounds.center,
          zoom: 13,
        }, 1000);
      }, 100);
    }
  };

  // 动画显示路径（模拟导航）
  const animatePolyline = (fullPath: Array<{ latitude: number; longitude: number }>) => {
    setIsAnimating(true);
    
    const simplifiedPath = simplifyPath(fullPath, 150);
    console.log(`[WebAPI动画] 原始点数: ${fullPath.length}, 简化后: ${simplifiedPath.length}`);
    
    setFullPathData(simplifiedPath);
    
    const totalPoints = simplifiedPath.length;
    totalPointsShared.value = totalPoints;
    
    const duration = Math.max(4000, totalPoints * 20);
    
    const handleAnimationComplete = () => {
      setIsAnimating(false);
      
      const bounds = getRouteBounds(fullPath);
      if (bounds && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.moveCamera({
            target: bounds.center,
            zoom: 13,
          }, 1000);
        }, 100);
      }
    };
    
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, {
      duration,
      easing: Easing.linear,
    }, (finished) => {
      if (finished) {
        runOnJS(handleAnimationComplete)();
      }
    });
  };

  // 动画路径显示
  const animatedPolylineProps = useAnimatedProps(() => {
    'worklet';
    const totalPoints = totalPointsShared.value;
    if (totalPoints === 0 || fullPathData.length === 0) {
      return { points: [] };
    }
    
    const currentPointCount = Math.ceil(animationProgress.value * totalPoints);
    const visiblePoints = fullPathData.slice(0, Math.max(2, currentPointCount));
    
    return {
      points: visiblePoints,
    };
  }, [fullPathData]);

  // 动画 Marker 位置
  const animatedMarkerPosition = useAnimatedProps(() => {
    'worklet';
    const totalPoints = totalPointsShared.value;
    if (totalPoints === 0 || fullPathData.length === 0) {
      return { position: { latitude: 0, longitude: 0 } };
    }
    
    const currentIndex = Math.floor(animationProgress.value * (totalPoints - 1));
    const safeIndex = Math.min(Math.max(0, currentIndex), totalPoints - 1);
    
    return {
      position: fullPathData[safeIndex],
    };
  }, [fullPathData]);

  // 定期移动相机跟随动画
  useEffect(() => {
    if (!isAnimating || fullPathData.length === 0) return;
    
    const interval = setInterval(() => {
      const progress = animationProgress.value;
      const currentIndex = Math.floor(progress * fullPathData.length);
      
      if (currentIndex > 0 && currentIndex < fullPathData.length) {
        const currentPos = fullPathData[currentIndex];
        mapRef.current?.moveCamera({
          target: currentPos,
          zoom: 15,
        }, 300);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [isAnimating, fullPathData]);

  // 选择路线
  const handleSelectRoute = (route: RouteData, index: number) => {
    setSelectedRouteIndex(index);
    setRouteResult(route);
    if (route.polyline && route.polyline.length > 0) {
      showFullRoute(route.polyline);
    }
  };

  // 切换出行方式
  const handleChangeRouteType = (type: typeof routePlanning.routeType) => {
    routePlanning.setRouteType(type);
    routePlanning.clearRoutes();
    setRouteResult(null);
    setFullPathData([]);
    setSelectedRouteIndex(-1);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={{
          target: {
            latitude: 39.9042,
            longitude: 116.4074,
          },
          zoom: 12,
        }}
        myLocationEnabled={true}
        compassEnabled={true}
      >
        {/* 当前位置 */}
        {currentLocation && (
          <Marker
            position={currentLocation}
            title="当前位置"
            pinColor="green"
          />
        )}

        {/* 路径线 */}
        {fullPathData.length > 1 && routeResult && (
          <AnimatedPolyline
            points={fullPathData}
            animatedProps={animatedPolylineProps}
            strokeWidth={5}
            strokeColor={routeResult.color || "#2196F3"}
          />
        )}
        
        {/* 动画标记 */}
        {isAnimating && fullPathData.length > 0 && (
          <AnimatedMarker
            position={fullPathData[0]}
            animatedProps={animatedMarkerPosition}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={99}
          >
            <Animated.View style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={{ fontSize: 32 }}>
                {routePlanning.routeType === 'driving' ? '🚗' :
                 routePlanning.routeType === 'walking' ? '🚶' :
                 routePlanning.routeType === 'bicycling' ? '🚴' : '🚌'}
              </Text>
            </Animated.View>
          </AnimatedMarker>
        )}
      </MapView>

      {/* 顶部输入框 */}
      <View style={[styles.topInputCard, {top: headerHeight}]}>
        <View style={styles.inputRow}>
          <Text style={styles.inputIcon}>📍</Text>
          <TextInput
            style={styles.input}
            value={originText}
            onChangeText={(text) => handleSearchInput(text, 'origin')}
            placeholder="请输入出发点"
            placeholderTextColor="#999"
            onFocus={() => addressSearch.setActiveInput('origin')}
          />
          {originText && originText !== '当前位置' && (
            <TouchableOpacity
              onPress={() => handleClearSearch('origin')}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
          {addressSearch.loading && addressSearch.activeInput === 'origin' && (
            <ActivityIndicator size="small" color="#2196F3" />
          )}
        </View>
        
        <View style={styles.inputDivider} />
        
        <View style={styles.inputRow}>
          <Text style={styles.inputIcon}>🎯</Text>
          <TextInput
            style={styles.input}
            value={destinationText}
            onChangeText={(text) => handleSearchInput(text, 'destination')}
            placeholder="请输入目的地"
            placeholderTextColor="#999"
            onFocus={() => addressSearch.setActiveInput('destination')}
          />
          {destinationText && destinationText !== '北京南站' && (
            <TouchableOpacity
              onPress={() => handleClearSearch('destination')}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
          {addressSearch.loading && addressSearch.activeInput === 'destination' && (
            <ActivityIndicator size="small" color="#2196F3" />
          )}
        </View>
      </View>

      {/* 搜索建议列表 */}
      {addressSearch.showSuggestions && addressSearch.searchSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={addressSearch.searchSuggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectAddress(item)}
                disabled={addressSearch.loading}
              >
                <View style={styles.suggestionIcon}>
                  <Text>📍</Text>
                </View>
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.suggestionAddress} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* 底部操作卡片 */}
      <View style={styles.bottomCard}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bottomCardContent}
        >
          <BlurView style={StyleSheet.absoluteFillObject} tint="light" intensity={50} />
          
          {/* 出行方式 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>出行方式</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.routeTypeRow}>
                {(['driving', 'walking', 'bicycling', 'transit'] as const).map((type) => {
                  const icons = { driving: '🚗', walking: '🚶', bicycling: '🚴', transit: '🚌' };
                  const labels = { driving: '驾车', walking: '步行', bicycling: '骑行', transit: '公交' };
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.routeTypeButton,
                        routePlanning.routeType === type && styles.activeRouteType
                      ]}
                      onPress={() => handleChangeRouteType(type)}
                    >
                      <Text style={[
                        styles.routeTypeText,
                        routePlanning.routeType === type && styles.activeRouteTypeText
                      ]}>
                        {icons[type]} {labels[type]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* 路线选择 */}
          {routePlanning.allRoutes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                路线方案 ({routePlanning.allRoutes.length}条)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.routeCardsRow}>
                  {routePlanning.allRoutes.map((route, index) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      isSelected={selectedRouteIndex === index}
                      onPress={() => handleSelectRoute(route, index)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* 路线信息 */}
          {routeResult && <RouteInfoCard route={routeResult} />}

          {/* 操作按钮 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={getCurrentLocation}>
              <Text style={styles.actionButtonText}>📍 获取位置</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.primaryActionButton,
                routePlanning.isCalculating && styles.disabledButton
              ]}
              onPress={calculateRoute}
              disabled={routePlanning.isCalculating}
            >
              <Text style={styles.actionButtonText}>
                {routePlanning.isCalculating ? '计算中...' : '🗺️ 规划路径'}
              </Text>
            </TouchableOpacity>
            {routeResult && routeResult.polyline && routeResult.polyline.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.simulateActionButton,
                  isAnimating && styles.disabledButton
                ]}
                onPress={() => {
                  if (!isAnimating) {
                    animatePolyline(routeResult.polyline);
                  }
                }}
                disabled={isAnimating}
              >
                <Text style={styles.actionButtonText}>
                  {isAnimating ? '🎬 模拟中...' : '🎬 模拟导航'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  topInputCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  inputIcon: {
    fontSize: 12,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    paddingVertical: 12,
    padding: 0,
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearIcon: {
    fontSize: 16,
    color: '#999',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 160,
    left: 20,
    right: 20,
    maxHeight: 300,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  suggestionAddress: {
    fontSize: 12,
    color: '#999',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '65%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  bottomCardContent: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'transparent',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  routeTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  routeTypeButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeRouteType: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  routeTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  activeRouteTypeText: {
    color: '#fff',
  },
  routeCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButton: {
    backgroundColor: '#4CAF50',
  },
  simulateActionButton: {
    backgroundColor: '#9C27B0',
  },
  disabledButton: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
                  