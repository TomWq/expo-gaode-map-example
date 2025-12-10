import Button from '@/components/UnifiedButton';
import { useColorScheme } from '@/components/useColorScheme';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';
import { useSafeScrollViewStyle } from '@/hooks/useSafeScrollView';
/**
 * 骑行和电动车路径规划示例
 * 依赖全局初始化的 Web API Key（在 example/App.tsx 中初始化）
 */
export default function BicyclingRouteExample() {
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
  const [destination, setDestination] = useState('116.434446,39.90816'); // 天安门
  
  // 结果与加载
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // 全局已初始化 Key，这里直接构造实例；内部会自动解析全局 webKey
  const api = useMemo(() => new GaodeWebAPI(), []);

  // 骑行 - 单条路线
  const testBicyclingSingle = async () => {
    try {
      const res = await api.route.bicycling(origin, destination);

      const path = res.route.paths[0];
      const duration = path.cost?.duration || path.duration;
      const timeInMinutes = duration ? Math.floor(parseInt(duration) / 60) : 0;
      
      setResult(`
🚴 骑行路径规划（单条路线）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${timeInMinutes} 分钟

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 骑行 - 多备选路线
  const testBicyclingMultiple = async () => {
    try {
      const res = await api.route.bicycling(origin, destination, {
        alternative_route: 3, // 返回3条路线
        show_fields: 'cost',
      });

      const routeText = res.route.paths.map((path, i) => {
        const duration = path.cost?.duration || path.duration;
        const timeInMinutes = duration ? Math.floor(parseInt(duration) / 60) : 0;
        return `
路线${i + 1}：${(parseInt(path.distance) / 1000).toFixed(2)}公里 | ${timeInMinutes}分钟
      `;
      }).join('');

      setResult(`
🚴 骑行路径规划（3条备选路线）

${routeText}

💡 提示：选择最适合您的路线
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 骑行 - 详细信息
  const testBicyclingDetailed = async () => {
    try {
      const res = await api.route.bicycling(origin, destination, {
        alternative_route: 2,
        show_fields: 'cost,navi,polyline',
      });

      const path = res.route.paths[0];
      const duration = path.cost?.duration || path.duration;
      const timeInMinutes = duration ? Math.floor(parseInt(duration) / 60) : 0;
      
      setResult(`
🚴 骑行路径规划（详细信息）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${timeInMinutes} 分钟

💡 包含：成本信息、导航信息、坐标点串

导航步骤：
${path.steps.map((step, i) => {
  let text = `${i + 1}. ${step.instruction} (${step.step_distance}米)`;
  if (step.action) {
    text += `\n   动作：${step.action}`;
  }
  if (step.road_name) {
    text += `\n   道路：${step.road_name}`;
  }
  return text;
}).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 电动车 - 单条路线
  const testElectricBikeSingle = async () => {
    try {
      const res = await api.route.electricBike(origin, destination);

      const path = res.route.paths[0];
      const duration = path.cost?.duration || path.duration;
      const timeInMinutes = duration ? Math.floor(parseInt(duration) / 60) : 0;
      
      setResult(`
🛵 电动车路径规划（单条路线）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${timeInMinutes} 分钟

💡 特点：考虑电动车特性，可能与骑行路线不同

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 电动车 - 多备选路线
  const testElectricBikeMultiple = async () => {
    try {
      const res = await api.route.electricBike(origin, destination, {
        alternative_route: 3,
        show_fields: 'cost',
      });

      const routeText = res.route.paths.map((path, i) => {
        const duration = path.cost?.duration || path.duration;
        const timeInMinutes = duration ? Math.floor(parseInt(duration) / 60) : 0;
        return `
路线${i + 1}：${(parseInt(path.distance) / 1000).toFixed(2)}公里 | ${timeInMinutes}分钟
      `;
      }).join('');

      setResult(`
🛵 电动车路径规划（3条备选路线）

${routeText}

💡 提示：电动车路线可能比骑行更适合主干道
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 骑行 vs 电动车对比
  const testComparison = async () => {
    try {
      const [bicyclingRes, electricRes] = await Promise.all([
        api.route.bicycling(origin, destination, { show_fields: 'cost' }),
        api.route.electricBike(origin, destination, { show_fields: 'cost' }),
      ]);

      const bicyclingPath = bicyclingRes.route.paths[0];
      const electricPath = electricRes.route.paths[0];
      
      const bicyclingDuration = bicyclingPath.cost?.duration || bicyclingPath.duration;
      const electricDuration = electricPath.cost?.duration || electricPath.duration;

      const bicyclingTime = bicyclingDuration ? Math.floor(parseInt(bicyclingDuration) / 60) : 0;
      const electricTime = electricDuration ? Math.floor(parseInt(electricDuration) / 60) : 0;

      setResult(`
🚴 vs 🛵 骑行 vs 电动车对比

🚴 骑行：
  距离：${(parseInt(bicyclingPath.distance) / 1000).toFixed(2)} 公里
  时间：${bicyclingTime} 分钟

🛵 电动车：
  距离：${(parseInt(electricPath.distance) / 1000).toFixed(2)} 公里
  时间：${electricTime} 分钟

💡 分析：
  距离差：${Math.abs(parseInt(bicyclingPath.distance) - parseInt(electricPath.distance))}米
  时间差：${Math.abs(bicyclingTime - electricTime)}分钟
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 短途骑行
  const testShortDistance = async () => {
    try {
      const res = await api.route.bicycling(
        '116.481028,39.989643', // 望京
        '116.484527,39.990893', // 望京附近
        { show_fields: 'cost' }
      );

      const path = res.route.paths[0];
      const duration = path.cost?.duration || path.duration;
      const timeInMinutes = duration ? Math.floor(parseInt(duration) / 60) : 0;
      
      setResult(`
🚴 骑行路径规划（短途）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${timeInMinutes} 分钟

💡 适合：短途出行、最后一公里

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 通用：封装按钮点击，统一加载态与清空旧结果
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

  const contentStyle = useSafeScrollViewStyle(styles.container);

  return (
    <ScrollView style={[contentStyle, { backgroundColor: palette.background }]}>
    

      {/* 起点终点 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>1. 设置起点终点</Text>
        <Text style={[styles.hint, { color: palette.textMuted }]}>
          💡 默认：望京 → 天安门
        </Text>
      </View>

      {/* 骑行路径规划 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>2. 🚴 骑行路径规划</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title={loading ? '单条路线（计算中…）' : '单条路线'}
            onPress={wrap(testBicyclingSingle)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '3条备选路线（计算中…）' : '3条备选路线'}
            onPress={wrap(testBicyclingMultiple)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '详细信息（计算中…）' : '详细信息（含导航）'}
            onPress={wrap(testBicyclingDetailed)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '短途骑行（计算中…）' : '短途骑行'}
            onPress={wrap(testShortDistance)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
        </View>
      </View>

      {/* 电动车路径规划 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>3. 🛵 电动车路径规划</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title={loading ? '单条路线（计算中…）' : '单条路线'}
            onPress={wrap(testElectricBikeSingle)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '3条备选路线（计算中…）' : '3条备选路线'}
            onPress={wrap(testElectricBikeMultiple)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
        </View>
      </View>

      {/* 对比测试 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>4. 🔍 对比测试</Text>
        
        <Button
          title={loading ? '对比中…' : '骑行 vs 电动车'}
          onPress={wrap(testComparison)}
          disabled={loading}
          color={loading ? palette.border : palette.tint}
        />
        
        <Text style={[styles.hint, { color: palette.textMuted }]}>
          💡 查看两种方式的差异
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
          • alternative_route: 1/2/3 返回不同条数的路线{'\n'}
          • show_fields 可选：cost, navi, polyline{'\n'}
          • 骑行路线更适合自行车道和非机动车道{'\n'}
          • 电动车路线可能选择更快的主干道{'\n'}
          • 两种方式返回结果格式相同{'\n'}
          • 适合短中距离出行（一般15公里以内）
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
