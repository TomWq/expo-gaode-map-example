import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { GaodeWebAPI, TransitStrategy } from 'expo-gaode-map-web-api';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '../../constants/Colors';
import Button from '@/components/UnifiedButton';
import { useSafeScrollViewStyle } from '@/hooks/useSafeScrollView';
/**
 * 公交路径规划示例
 * 依赖全局初始化的 Web API Key（在 example/App.tsx 中初始化）
 */
export default function TransitRouteExample() {
  const scheme = useColorScheme();
  const C = Colors[scheme ?? 'light'];
  const palette = {
    background: C.background,
    text: C.text,
    textMuted: scheme === 'dark' ? '#9aa0a6' : '#666',
    card: scheme === 'dark' ? '#1e1e1e' : '#ffffff',
    border: scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    tint: C.tint,
    infoBg: scheme === 'dark' ? 'rgba(43, 121, 183, 0.15)' : '#f0f9ff',
    noteBg: scheme === 'dark' ? 'rgba(255, 243, 224, 0.08)' : '#fff3e0',
    warning: scheme === 'dark' ? '#ffb74d' : '#E65100',
  };

  // 起点终点
  const [origin, setOrigin] = useState('116.481028,39.989643'); // 望京
  const [destination, setDestination] = useState('116.397477,39.908692'); // 天安门
  const [city1, setCity1] = useState('010'); // 北京 citycode
  const [city2, setCity2] = useState('010');

  // 结果 + 加载
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // 全局已初始化 Key，这里直接构造实例；内部会自动解析全局 webKey
  const api = useMemo(() => new GaodeWebAPI(), []);

  const wrap = (fn: () => Promise<void>) => async () => {
    if (loading) return;
    setLoading(true);
    setResult('');
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  // 格式化换乘段信息
  const formatSegments = (segments: any[]) => {
    let stepNum = 0;
    return segments.map((seg) => {
      const parts: string[] = [];
      
      if (seg.walking) {
        stepNum++;
        const walkCost = seg.walking.cost || {};
        const duration = walkCost.duration ? Math.floor(parseInt(walkCost.duration) / 60) : 0;
        parts.push(`${stepNum}. 🚶 步行 ${seg.walking.distance}米（约${duration}分钟）`);
      }
      
      if (seg.bus) {
        stepNum++;
        const line = seg.bus.buslines[0];
        const lineCost = line.cost || {};
        const duration = lineCost.duration ? Math.floor(parseInt(lineCost.duration) / 60) : 0;
        const type = line.type?.includes('地铁') ? '🚇' : '🚌';
        parts.push(`${stepNum}. ${type} ${line.name}\n   ${line.departure_stop.name} → ${line.arrival_stop.name}\n   途经${line.via_num}站 | ${duration}分钟`);
      } else if (seg.railway) {
        stepNum++;
        const line = seg.railway.buslines[0];
        const lineCost = line.cost || {};
        const duration = lineCost.duration ? Math.floor(parseInt(lineCost.duration) / 60) : 0;
        parts.push(`${stepNum}. 🚇 ${line.name}\n   ${line.departure_stop.name} → ${line.arrival_stop.name}\n   途经${line.via_num}站 | ${duration}分钟`);
      }
      
      return parts.join('\n');
    }).filter(Boolean).join('\n');
  };

  // 策略 0：推荐模式
  const testRecommended = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.RECOMMENDED,
        show_fields: 'cost',
      });

      if (res.route.transits.length === 0) {
        Alert.alert('提示', '未找到公交路线');
        return;
      }

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 推荐模式（策略0）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米
🌙 夜班车：${transit.nightflag === '1' ? '是' : '否'}

💡 特点：综合权重，同高德APP默认

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 1：最经济模式
  const testCheapest = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.CHEAPEST,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 最经济模式（策略1）

💰 总费用：${fee} 元（票价最低）
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米

💡 特点：选择票价最低的路线

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 2：最少换乘模式
  const testLeastTransfer = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.LEAST_TRANSFER,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const busSegments = transit.segments.filter((seg: any) => seg.bus || seg.railway);
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 最少换乘模式（策略2）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米
🔄 换乘次数：${busSegments.length - 1}次

💡 特点：尽量减少换乘次数

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 3：最少步行模式
  const testLeastWalk = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.LEAST_WALK,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 最少步行模式（策略3）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米（最少）

💡 特点：尽可能减少步行距离

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 5：不乘地铁模式
  const testNoSubway = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.NO_SUBWAY,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 不乘地铁模式（策略5）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米

💡 特点：只乘坐公交车，不乘地铁

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 7：地铁优先模式
  const testSubwayFirst = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.SUBWAY_FIRST,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 地铁优先模式（策略7）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟
🚶 步行距离：${transit.walking_distance}米

💡 特点：优先选择地铁（步行不超过4KM）

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 8：时间短模式
  const testTimeFirst = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.TIME_FIRST,
        show_fields: 'cost',
      });

      const transit = res.route.transits[0];
      const costInfo = transit.cost as any;
      const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
      const fee = costInfo?.transit_fee || '0';
      
      setResult(`
🚌 时间短模式（策略8）

💰 总费用：${fee} 元
⏱️ 总时间：${duration} 分钟（最短）
🚶 步行距离：${transit.walking_distance}米

💡 特点：方案花费总时间最少

换乘方案：
${formatSegments(transit.segments)}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 多方案对比
  const testMultipleRoutes = async () => {
    try {
      const res = await api.route.transit(origin, destination, city1, city2, {
        strategy: TransitStrategy.RECOMMENDED,
        AlternativeRoute: 3,
        show_fields: 'cost',
      });

      const routesText = res.route.transits.slice(0, 3).map((transit, i) => {
        const busCount = transit.segments.filter((seg: any) => seg.bus || seg.railway).length;
        const costInfo = transit.cost as any;
        const duration = costInfo?.duration ? Math.floor(parseInt(costInfo.duration) / 60) : 0;
        const fee = costInfo?.transit_fee || '0';
        return `方案${i + 1}：${fee}元 | ${duration}分钟 | 步行${transit.walking_distance}米 | ${busCount}段乘车`;
      }).join('\n');

      setResult(`
🚌 多方案对比（3个方案）

${routesText}

💡 提示：选择最适合您的方案
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

   const contentStyle = useSafeScrollViewStyle(styles.container);

  return (
    <ScrollView style={[contentStyle, { backgroundColor: palette.background }]}>
      

      {/* 起点终点 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>1. 设置起点终点</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor: palette.border, color: palette.text }]}
            value={origin}
            onChangeText={setOrigin}
            placeholder='起点坐标（经度,纬度）'
            placeholderTextColor={palette.textMuted}
          />
          <TextInput
            style={[styles.input, { flex: 1, borderColor: palette.border, color: palette.text }]}
            value={destination}
            onChangeText={setDestination}
            placeholder='终点坐标（经度,纬度）'
            placeholderTextColor={palette.textMuted}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor: palette.border, color: palette.text }]}
            value={city1}
            onChangeText={setCity1}
            placeholder='起点城市码'
            placeholderTextColor={palette.textMuted}
          />
          <TextInput
            style={[styles.input, { flex: 1, borderColor: palette.border, color: palette.text }]}
            value={city2}
            onChangeText={setCity2}
            placeholder='终点城市码'
            placeholderTextColor={palette.textMuted}
          />
        </View>
        <Text style={[styles.hint, { color: palette.textMuted }]}>
          💡 默认：望京 → 天安门（citycode: 010）
        </Text>
      </View>

      {/* 基础策略 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>2. 基础策略</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title={loading ? '策略0：推荐模式（计算中…）' : '策略0：推荐模式'}
            onPress={wrap(testRecommended)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '策略1：最经济（计算中…）' : '策略1：最经济'}
            onPress={wrap(testCheapest)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '策略2：最少换乘（计算中…）' : '策略2：最少换乘'}
            onPress={wrap(testLeastTransfer)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '策略3：最少步行（计算中…）' : '策略3：最少步行'}
            onPress={wrap(testLeastWalk)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
        </View>
      </View>

      {/* 地铁相关策略 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>3. 地铁相关策略</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title={loading ? '策略5：不乘地铁（计算中…）' : '策略5：不乘地铁'}
            onPress={wrap(testNoSubway)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '策略7：地铁优先（计算中…）' : '策略7：地铁优先'}
            onPress={wrap(testSubwayFirst)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '策略8：时间短（计算中…）' : '策略8：时间短'}
            onPress={wrap(testTimeFirst)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
        </View>
      </View>

      {/* 多方案 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>4. 多方案对比</Text>
        
        <Button
          title={loading ? '返回3个方案对比（计算中…）' : '返回3个方案对比'}
          onPress={wrap(testMultipleRoutes)}
          disabled={loading}
          color={loading ? palette.border : palette.tint}
        />
        
        <Text style={[styles.hint, { color: palette.textMuted }]}>
          💡 AlternativeRoute: 1-10
        </Text>
      </View>

      {/* 结果显示 */}
      {loading ? (
        <View style={[styles.resultBox, { backgroundColor: palette.infoBg, borderLeftColor: palette.tint }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color={palette.tint} />
            <Text style={[styles.resultText, { color: palette.text }]}>正在计算路线，请稍候…</Text>
          </View>
        </View>
      ) : result ? (
        <View style={[styles.resultBox, { backgroundColor: palette.infoBg, borderLeftColor: palette.tint }]}>
          <Text style={[styles.resultText, { color: palette.text }]}>{result}</Text>
        </View>
      ) : null}

      {/* 说明 */}
      <View style={[styles.note, { backgroundColor: palette.noteBg, borderLeftColor: palette.warning, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.noteTitle, { color: palette.warning }]}>📝 新版 V5 API 说明：</Text>
        <Text style={[styles.noteText, { color: palette.textMuted }]}>
          • city1/city2 为必填参数（使用citycode）{'\n'}
          • 新增策略6（地铁图）、7（地铁优先）、8（时间短）{'\n'}
          • AlternativeRoute 可返回1-10个方案{'\n'}
          • multiexport 控制地铁出入口数量{'\n'}
          • 支持 originpoi/destinationpoi 提升准确性{'\n'}
          • 支持 date/time 参数规划指定时间的路线{'\n'}
          • 北京citycode: 010, 上海: 021, 广州: 020
        </Text>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonGroup: {
    gap: 8,
  },
  buttonSpacer: {
    height: 8,
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
  note: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
  },
  spacer: {
    height: 40,
  },
});
