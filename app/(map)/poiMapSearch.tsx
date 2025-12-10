import { MapView, Marker } from 'expo-gaode-map';
import { GaodeWebAPI, POIInfo } from 'expo-gaode-map-web-api';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { toast } from 'sonner-native';

/**
 * POI 搜索 + 地图标记示例
 * 依赖全局初始化的 Web API Key（在 example/App.tsx 中初始化）
 */
export default function POISearchMapExample() {
  // 全局已初始化 Key，这里直接构造实例；内部会自动解析全局 webKey
  const api = useMemo(() => new GaodeWebAPI(), []);

  // 搜索参数
  const [keywords, setKeywords] = useState('肯德基');
  const [region, setRegion] = useState('北京市');
  const [location, setLocation] = useState('116.481028,39.989643'); // 望京
  const [radius, setRadius] = useState('1000');
  
  // 地图和标记
  const [mapCenter, setMapCenter] = useState({ latitude: 39.989643, longitude: 116.481028 });
  const [markers, setMarkers] = useState<Array<{
    id: string;
    coordinate: { latitude: number; longitude: number };
    title: string;
    description: string;
  }>>([]);
  
  // 结果统计
  const [resultCount, setResultCount] = useState(0);
  const [selectedPOI, setSelectedPOI] = useState<POIInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // 解析坐标字符串
  const parseLocation = (locationStr: string): { latitude: number; longitude: number } => {
    const [lng, lat] = locationStr.split(',').map(Number);
    return { latitude: lat, longitude: lng };
  };

  // 关键字搜索
  const testKeywordSearch = async () => {
    setLoading(true);
    try {
      const res = await api.poi.search(keywords, {
        region,
        city_limit: true,
        page_size: 20,
        show_fields: 'children,business,photos',
      });

      setResultCount(parseInt(res.count));
      
      // 转换为地图标记
      const newMarkers = res.pois.map((poi, index) => {
        const coord = parseLocation(poi.location);
        return {
          id: poi.id || `poi-${index}`,
          coordinate: coord,
          title: poi.name,
          description: `${poi.address}\n${poi.business?.tel || '暂无电话'}`,
        };
      });
      
      setMarkers(newMarkers);
      
      // 设置地图中心为第一个结果
      if (newMarkers.length > 0) {
        setMapCenter(newMarkers[0].coordinate);
      }
      
      toast.success(`找到 ${res.count} 个结果，已在地图上标记前 ${newMarkers.length} 个`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 周边搜索
  const testAroundSearch = async () => {
    setLoading(true);
    try {
      const res = await api.poi.searchAround(location, {
        keywords,
        radius: parseInt(radius),
        sortrule: 'distance',
        page_size: 20,
        show_fields: 'children,business,photos',
      });

      setResultCount(parseInt(res.count));
      
      // 转换为地图标记
      const newMarkers = res.pois.map((poi, index) => {
        const coord = parseLocation(poi.location);
        return {
          id: poi.id || `poi-${index}`,
          coordinate: coord,
          title: poi.name,
          description: `${poi.address}\n距离：${poi.distance}米\n${poi.business?.tel || '暂无电话'}`,
        };
      });
      
      setMarkers(newMarkers);
      
      // 设置地图中心为搜索中心点
      const centerCoord = parseLocation(location);
      setMapCenter(centerCoord);
      
      toast.success( `找到 ${res.count} 个结果，已在地图上标记前 ${newMarkers.length} 个`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 清除标记
  const clearMarkers = () => {
    setMarkers([]);
    setResultCount(0);
    setSelectedPOI(null);
    toast.success('已清除所有标记');
  };

  return (
    <View style={styles.container}>
      {/* 地图视图 */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialCameraPosition={{
            target: mapCenter,
            zoom: 14,
          }}
          onMapPress={(e: any) => {
            console.log('地图点击:', e.nativeEvent);
          }}
        >
          {/* 搜索结果标记 */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.coordinate}
              title={marker.title}
              snippet={marker.description}
              onMarkerPress={() => {
                toast.info(marker.title + '\n' + marker.description);
              }}
            />
          ))}
          
          {/* 周边搜索中心点标记（红色） */}
          {markers.length > 0 && location && (
            <Marker
              position={parseLocation(location)}
              title="搜索中心"
              snippet="周边搜索的中心点"
              pinColor="red"
            />
          )}
        </MapView>
        
        {/* 结果统计浮层 */}
        {resultCount > 0 && (
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeText}>
              找到 {resultCount} 个结果
            </Text>
            <Text style={styles.resultBadgeSubtext}>
              已标记 {markers.length} 个
            </Text>
          </View>
        )}

        {/* 加载中遮罩 */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2f95dc" />
            <Text style={styles.loadingText}>正在搜索，请稍候...</Text>
          </View>
        )}
      </View>

      {/* 控制面板 */}
      <ScrollView style={styles.controlPanel}>
        {/* 关键字搜索 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 关键字搜索</Text>
          <TextInput
            style={styles.input}
            value={keywords}
            onChangeText={setKeywords}
            placeholder="搜索关键字"
          />
          <TextInput
            style={styles.input}
            value={region}
            onChangeText={setRegion}
            placeholder="搜索区域"
          />
          <Button
            title={loading ? "🔍 搜索中…" : "🔍 搜索并标记"}
            onPress={testKeywordSearch}
            disabled={loading}
          />
        </View>

        {/* 周边搜索 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 周边搜索</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="中心点坐标"
          />
          <TextInput
            style={styles.input}
            value={radius}
            onChangeText={setRadius}
            placeholder="搜索半径（米）"
            keyboardType="numeric"
          />
          <Button
            title={loading ? "📍 搜索中…" : "📍 周边搜索并标记"}
            onPress={testAroundSearch}
            disabled={loading}
          />
        </View>

        {/* 操作按钮 */}
        <View style={styles.section}>
          <Button
            title="🗑️ 清除所有标记"
            onPress={clearMarkers}
            color="#f44336"
            disabled={loading}
          />
        </View>

        {/* 说明 */}
        <View style={styles.note}>
          <Text style={styles.noteTitle}>💡 使用说明：</Text>
          <Text style={styles.noteText}>
            • 关键字搜索：在指定区域搜索并标记{'\n'}
            • 周边搜索：搜索指定坐标周边并标记{'\n'}
            • 红色标记：周边搜索的中心点{'\n'}
            • 蓝色标记：搜索到的 POI{'\n'}
            • 点击标记：查看详细信息{'\n'}
            • 最多显示前 20 个结果
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    height: '50%',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  resultBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  resultBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  resultBadgeSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  controlPanel: {
    height: '50%',
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  note: {
    backgroundColor: '#fff3e0',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#E65100',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  loadingText: {
    marginTop: 8,
    color: '#333',
    fontSize: 12,
  },
});