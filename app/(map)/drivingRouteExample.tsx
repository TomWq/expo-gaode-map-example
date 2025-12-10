import { useColorScheme } from '@/components/useColorScheme';
import { DrivingStrategy, GaodeWebAPI } from 'expo-gaode-map-web-api';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '../../constants/Colors';
import Button from '@/components/UnifiedButton';
import { useSafeScrollViewStyle } from '@/hooks/useSafeScrollView';
/**
 * 驾车路径规划示例
 * 展示新版 V5 API 的各种策略和参数
 */
export default function DrivingRouteExample() {
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

  const api = useMemo(() => new GaodeWebAPI({ key: '' }), []);
  
  // 起点终点
  const [origin, setOrigin] = useState('116.481028,39.989643');
  const [destination, setDestination] = useState('116.397477,39.908692');
  
  // 结果 + 加载
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // 通用包装：统一加载与清空旧结果
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

  // 策略 32：速度优先（默认）
  const testSpeedFirst = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.DEFAULT,
        show_fields: 'cost,polyline',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚗 速度优先（策略32）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元
🚦 红绿灯：${cost?.traffic_lights || '0'} 个
🚫 限行：${path.restriction === '0' ? '未限行' : '限行'}

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 33：躲避拥堵
  const testAvoidJam = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.AVOID_JAM,
        show_fields: 'cost,polyline',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚗 躲避拥堵（策略33）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元
🚦 红绿灯：${cost?.traffic_lights || '0'} 个

💡 特点：根据实时路况躲避拥堵路段

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 34：高速优先
  const testHighwayFirst = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.HIGHWAY_FIRST,
        show_fields: 'cost',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚗 高速优先（策略34）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元

💡 特点：优先选择高速公路

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 策略 35：不走高速
  const testAvoidHighway = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.NO_HIGHWAY,
        show_fields: 'cost',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚗 不走高速（策略35）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元（应该为0）

💡 特点：完全避开高速公路

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 新能源车（纯电）
  const testElectricCar = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.DEFAULT,
        cartype: 1,
        show_fields: 'cost',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🔋 纯电动车路径规划

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元

💡 特点：考虑电动车特性，如充电站位置

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 避免收费
  const testAvoidFee = async () => {
    try {
      const res = await api.route.driving(origin, destination, {
        strategy: DrivingStrategy.LESS_TOLL,
        show_fields: 'cost',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚗 少收费（策略36）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
💰 过路费：${cost?.tolls || '0'} 元（尽量为0）

💡 特点：尽量避开收费路段

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
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
        <TextInput
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          value={origin}
          onChangeText={setOrigin}
          placeholder='起点坐标（经度,纬度）'
          placeholderTextColor={palette.textMuted}
        />
        <TextInput
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          value={destination}
          onChangeText={setDestination}
          placeholder='终点坐标（经度,纬度）'
          placeholderTextColor={palette.textMuted}
        />
        <Text style={[styles.hint, { color: palette.textMuted }]}>
          💡 默认：望京 → 天安门
        </Text>
      </View>

      {/* 策略测试 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>2. 测试不同策略</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title={loading ? '策略32：速度优先（计算中…）' : '策略32：速度优先（默认）'}
            onPress={wrap(testSpeedFirst)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '策略33：躲避拥堵（计算中…）' : '策略33：躲避拥堵'}
            onPress={wrap(testAvoidJam)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '策略34：高速优先（计算中…）' : '策略34：高速优先'}
            onPress={wrap(testHighwayFirst)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '策略35：不走高速（计算中…）' : '策略35：不走高速'}
            onPress={wrap(testAvoidHighway)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '策略36：避免收费（计算中…）' : '策略36：避免收费'}
            onPress={wrap(testAvoidFee)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
        </View>
      </View>

      {/* 车辆类型测试 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>3. 车辆类型</Text>
        
        <Button
          title={loading ? '🔋 纯电动车路径（计算中…）' : '🔋 纯电动车路径'}
          onPress={wrap(testElectricCar)}
          disabled={loading}
          color={loading ? palette.border : palette.tint}
        />
        
        <Text style={[styles.hint, { color: palette.textMuted }]}>
          💡 cartype: 0=燃油 1=纯电 2=插混
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
          • 策略编号从32-45（旧版0-9已废弃）{'\n'}
          • 支持 show_fields 控制返回字段{'\n'}
          • 支持车牌号（plate）避开限行{'\n'}
          • 支持车辆类型（cartype）{'\n'}
          • 支持轮渡控制（ferry）{'\n'}
          • 支持 POI ID 提升准确性
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
