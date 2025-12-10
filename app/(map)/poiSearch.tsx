import IntroModal from '@/components/IntroModal';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useSafeScrollViewStyle } from '@/hooks/useSafeScrollView';
import { GaodeWebAPI, POIInfo } from 'expo-gaode-map-web-api';
import { useNavigation } from 'expo-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';


/**
 * POI 搜索示例
 * 
 */
export default function POISearchExample() {
  // 全局已初始化 Key，这里直接构造实例；内部会自动解析全局 webKey
  const api = useMemo(() => new GaodeWebAPI(), []);
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const textColor = colorScheme === 'dark' ? '#fff' : '#1c1c1c';
  const muted = colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : '#666';
  const cardBg = colorScheme === 'dark' ? '#111' : '#fff';
  const hairline = colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : '#ddd';
  const softBg = colorScheme === 'dark' ? 'rgba(16,16,16,0.6)' : '#f5f5f5';

  const [introVisible, setIntroVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 搜索参数
  const [keywords, setKeywords] = useState('肯德基');
  const [region, setRegion] = useState('北京市');
  const [location, setLocation] = useState('116.481028,39.989643'); // 望京
  const [radius, setRadius] = useState('1000');

  // 结果
  const [result, setResult] = useState('');
  const [pois, setPois] = useState<POIInfo[]>([]);
  const navigation = useNavigation()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setIntroVisible(true)}>
          <Text style={{ color: primary }}>说明</Text>
        </Pressable>
      )
    })
  }, [])

  // 关键字搜索
  const testKeywordSearch = async () => {
    setLoading(true);
    try {
      const res = await api.poi.search(keywords, {
        region,
        city_limit: true,
        page_size: 10,
        show_fields: 'children,business,photos',
      });

      setPois(res.pois);

      setResult(`
🔍 关键字搜索：${keywords}

📊 搜索结果：共找到 ${res.count} 个

前 ${Math.min(10, res.pois.length)} 个结果：
${res.pois.slice(0, 10).map((poi, i) =>
        `${i + 1}. ${poi.name}
   📍 地址：${poi.address}
   📞 电话：${poi.business?.tel || '暂无'}
   🗺️ 坐标：${poi.location}
`
      ).join('\n')}
      `.trim());
    } catch (error) {
      toast.error('关键字搜索失败' + (error instanceof Error ? error.message : ''));
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
        page_size: 10,
        show_fields: 'children,business,photos',
      });

      setPois(res.pois);

      setResult(`
📍 周边搜索：${keywords}

🎯 中心点：${location}
📏 搜索半径：${radius}米
📊 搜索结果：共找到 ${res.count} 个

按距离排序（前 ${Math.min(10, res.pois.length)} 个）：
${res.pois.slice(0, 10).map((poi, i) =>
        `${i + 1}. ${poi.name}
   📍 地址：${poi.address}
   📞 电话：${poi.business?.tel || '暂无'}
   🗺️ 坐标：${poi.location}
   📏 距离：${poi.distance || '0'}米
`
      ).join('\n')}
      `.trim());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '周边搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // 类型搜索
  const testTypeSearch = async () => {
    setLoading(true);
    try {
      // 050000 = 餐饮服务
      const res = await api.poi.search('', {
        types: '050000',
        region,
        city_limit: true,
        page_size: 10,
        show_fields: 'children,business,photos',
      });

      setPois(res.pois);

      setResult(`
🍴 类型搜索：餐饮服务

📊 搜索结果：共找到 ${res.count} 个

前 ${Math.min(10, res.pois.length)} 个结果：
${res.pois.slice(0, 10).map((poi, i) =>
        `${i + 1}. ${poi.name}
   📍 地址：${poi.address}
   📞 电话：${poi.business?.tel || '暂无'}
   🏷️ 类型：${poi.type}
   🗺️ 坐标：${poi.location}
`
      ).join('\n')}
      `.trim());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 查看 POI 详情
  const viewPOIDetail = async (poiId: string, poiName: string) => {
    try {
      const res = await api.poi.getDetail(poiId);

      if (res.pois && res.pois.length > 0) {
        const poi = res.pois[0];
        const business = poi.business;
        Alert.alert(
          `📍 ${poiName}`,
          `地址：${poi.address}\n电话：${business?.tel || '暂无'}\n类型：${poi.type}\n坐标：${poi.location}${business?.opentime_today ? `\n营业时间：${business.opentime_today}` : ''}${business?.rating ? `\n评分：${business.rating}` : ''}${business?.cost ? `\n人均：${business.cost}元` : ''}`,
          [{ text: '确定' }]
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    }
  };

  const contentStyle = useSafeScrollViewStyle(styles.container);

  return (
    <ScrollView style={[contentStyle, { backgroundColor: softBg }]}>

      {/* 关键字搜索参数 */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor: hairline }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>1. 关键字搜索</Text>
        <TextInput
          style={[styles.input, { borderColor: hairline, color: textColor }]}
          value={keywords}
          onChangeText={setKeywords}
          placeholder="搜索关键字（如：肯德基）"
        />
        <TextInput
          style={[styles.input, { borderColor: hairline, color: textColor }]}
          value={region}
          onChangeText={setRegion}
          placeholder="搜索区划（如：北京市）"
          placeholderTextColor={muted}
        />
        <View style={styles.actionRow}>
          <Pressable
            onPress={testKeywordSearch}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              { backgroundColor: primary, borderColor: primary },
              (pressed || loading) && styles.pressed,
            ]}
          >
            <Text style={styles.btnText}>{loading ? '搜索中...' : '搜索'}</Text>
          </Pressable>
        </View>
        <Text style={[styles.hint, { color: muted }]}>
          💡 在指定城市搜索关键字
        </Text>
      </View>

      {/* 周边搜索参数 */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor: hairline }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>2. 周边搜索</Text>
        <TextInput
          style={[styles.input, { borderColor: hairline, color: textColor }]}
          value={location}
          onChangeText={setLocation}
          placeholder="中心点坐标（经度,纬度）"
        />
        <TextInput
          style={[styles.input, { borderColor: hairline, color: textColor }]}
          value={radius}
          onChangeText={setRadius}
          placeholder="搜索半径（米）"
          placeholderTextColor={muted}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, { borderColor: hairline, color: textColor }]}
          value={keywords}
          onChangeText={setKeywords}
          placeholder="搜索关键字"
          placeholderTextColor={muted}
        />
        <View style={styles.actionRow}>
          <Pressable
            onPress={testAroundSearch}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              { backgroundColor: primary, borderColor: primary },
              (pressed || loading) && styles.pressed,
            ]}
          >
            <Text style={styles.btnText}>{loading ? '搜索中...' : '搜索周边'}</Text>
          </Pressable>
        </View>
        <Text style={[styles.hint, { color: muted }]}>
          💡 搜索指定位置周边的POI，默认：望京
        </Text>
      </View>

      {/* 类型搜索 */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor: hairline }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>3. 类型搜索</Text>
        <View style={styles.actionRow}>
          <Pressable
            onPress={testTypeSearch}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              styles.btnSecondary,
              { borderColor: primary },
              (pressed || loading) && styles.pressed,
            ]}
          >
            <Text style={[styles.btnText, { color: primary }]}>{loading ? '搜索中...' : '搜索餐饮服务（050000）'}</Text>
          </Pressable>
        </View>
        <Text style={[styles.hint, { color: muted }]}>
          💡 按POI类型搜索，不需要关键字
        </Text>
      </View>

      {/* 结果显示 / 加载中 */}
      {loading ? (
        <View style={[styles.resultBox, { backgroundColor: colorScheme === 'dark' ? '#0b2239' : '#f0f9ff', borderLeftColor: primary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator size="small" color={primary} />
            <Text style={[styles.resultText, { color: muted }]}>正在搜索，请稍候...</Text>
          </View>
        </View>
      ) : result ? (
        <View style={[styles.resultBox, { backgroundColor: colorScheme === 'dark' ? '#0b2239' : '#f0f9ff', borderLeftColor: primary }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={[styles.resultText, { color: textColor }]}>{result}</Text>
          </ScrollView>
        </View>
      ) : null}

      {/* POI 列表 */}
      {pois.length > 0 && (
        <View style={[styles.section, { backgroundColor: cardBg, borderColor: hairline }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>📍 点击查看详情</Text>
          {pois.map((poi, index) => (
            <TouchableOpacity
              key={poi.id || index}
              style={[styles.poiItem, { backgroundColor: colorScheme === 'dark' ? '#151515' : '#f8f9fa', borderLeftColor: primary }]}
              onPress={() => viewPOIDetail(poi.id, poi.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.poiName, { color: textColor }]}>{poi.name}</Text>
              <Text style={[styles.poiAddress, { color: muted }]} numberOfLines={1} ellipsizeMode="tail">{poi.address}</Text>
              {poi.distance && (
                <Text style={[styles.poiDistance, { color: primary }]}>📏 {poi.distance}米</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 说明 */}
      <View style={[styles.note, { backgroundColor: colorScheme === 'dark' ? '#2a1f0a' : '#fff3e0', borderLeftColor: '#FF9800' }]}>
        <Text style={[styles.noteTitle, { color: colorScheme === 'dark' ? '#FFC107' : '#E65100' }]}>📝 POI 搜索说明：</Text>
        <Text style={[styles.noteText, { color: muted }]}>
          • 关键字搜索：在指定区域搜索关键字（无距离信息）{'\n'}
          • 周边搜索：搜索指定坐标周边的POI（按距离排序）{'\n'}
          • 类型搜索：按POI类型码搜索（无距离信息）{'\n'}
          • POI详情：点击列表项查看详情{'\n'}
          • 支持参数：page_size（每页数量）、page_num（页码）{'\n'}
          • show_fields：控制返回字段（children,business,indoor,navi,photos）
        </Text>
      </View>

      <View style={styles.spacer} />

      {/* 统一介绍弹框 */}
      <IntroModal
        visible={introVisible}
        onClose={() => setIntroVisible(false)}
        title="POI 搜索功能概览"
        bullets={[
          '关键字搜索（支持城市限定）',
          '周边搜索（支持半径与距离排序）',
          '类型搜索（按 POI 类型码）',
          '点击列表查看 POI 详情（营业时间/评分/电话等）',
        ]}
        actions={[{ text: '知道了', onPress: () => setIntroVisible(false), type: 'primary' }]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'left',
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(0,0,0,0.12)',
    borderWidth: 1,
  },
  infoBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#444',
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    // 阴影
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: '#2f95dc',
    borderColor: '#2f95dc',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  resultBox: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  poiItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  poiName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  poiAddress: {
    fontSize: 12,
    marginBottom: 4,
  },
  poiDistance: {
    fontSize: 12,
  },
  note: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.9,
  },
  spacer: {
    height: 40,
  },
});