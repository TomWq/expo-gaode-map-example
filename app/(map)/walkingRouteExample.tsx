import Button from '@/components/UnifiedButton';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeScrollViewStyle } from '@/hooks/useSafeScrollView';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Colors from '../../constants/Colors';
/**
 * 步行路径规划示例
 * 展示新版 V5 API 的各种参数
 */
export default function WalkingRouteExample() {
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
  const [origin, setOrigin] = useState('116.481028,39.989643'); // 望京
  const [destination, setDestination] = useState('116.484527,39.990893'); // 望京附近
  
  // 结果 + 加载
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

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

  // 单条路线
  const testSingleRoute = async () => {
    try {
      const res = await api.route.walking(origin, destination, {
        show_fields: 'cost',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚶 步行路径规划（单条路线）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
🚕 打车费用：约${path.taxi || '未知'} 元

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 多备选路线（2条）
  const testTwoRoutes = async () => {
    try {
      const res = await api.route.walking(origin, destination, {
        alternative_route: 2,
        show_fields: 'cost',
      });

      const routeText = res.route.paths.map((path, i) => {
        const cost = path.cost;
        return `
--- 路线 ${i + 1} ---
📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
🚕 打车费用：约${path.taxi || 'API未返回'} 元

导航步骤：
${path.steps.map((step, j) =>
  `${j + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `;
      }).join('\n');

      setResult(`
🚶 步行路径规划（2条备选路线）

${routeText}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 多备选路线（3条）
  const testThreeRoutes = async () => {
    try {
      const res = await api.route.walking(origin, destination, {
        alternative_route: 3,
        show_fields: 'cost',
      });

      const routeText = res.route.paths.map((path, i) => {
        const cost = path.cost;
        return `
路线${i + 1}：${(parseInt(path.distance) / 1000).toFixed(2)}公里 | ${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + '分钟' : '未返回'} | 打车约${path.taxi || 'API未返回'}元
      `;
      }).join('');

      setResult(`
🚶 步行路径规划（3条备选路线）

${routeText}

💡 提示：选择最适合您的路线
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 详细导航信息（包含 navi）
  const testDetailedNavi = async () => {
    try {
      const res = await api.route.walking(origin, destination, {
        show_fields: 'cost,navi',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚶 步行路径规划（详细导航）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
🚕 打车费用：约${path.taxi || 'API未返回'} 元

详细导航：
${path.steps.map((step, i) => {
  let text = `${i + 1}. ${step.instruction} (${step.step_distance}米)`;
  if (step.action) {
    text += `\n   动作：${step.action}`;
  }
  if (step.assistant_action) {
    text += `\n   辅助：${step.assistant_action}`;
  }
  if (step.walk_type) {
    const walkTypes: Record<string, string> = {
      '0': '普通道路', '1': '人行横道', '3': '地下通道', '4': '过街天桥',
      '5': '地铁通道', '20': '阶梯', '21': '斜坡', '22': '桥', '23': '隧道'
    };
    text += `\n   道路类型：${walkTypes[step.walk_type] || step.walk_type}`;
  }
  return text;
}).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 室内算路
  const testIndoorRoute = async () => {
    try {
      const res = await api.route.walking(origin, destination, {
        isindoor: 1,
        show_fields: 'cost,navi',
      });

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚶 步行路径规划（室内算路）

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
🚕 打车费用：约${path.taxi || 'API未返回'} 元

💡 特点：包含室内路径规划（如商场、地铁站内部）

导航步骤：
${path.steps.map((step, i) =>
  `${i + 1}. ${step.instruction} (${step.step_distance}米)`
).join('\n')}
      `.trim());
    } catch (error) {
      Alert.alert('错误', error instanceof Error ? error.message : '未知错误');
    }
  };

  // 长距离步行（望京 → 天安门）
  const testLongDistance = async () => {
    try {
      const res = await api.route.walking(
        '116.481028,39.989643',
        '116.397477,39.908692',
        {
          alternative_route: 2,
          show_fields: 'cost',
        }
      );

      const path = res.route.paths[0];
      const cost = path.cost;
      
      setResult(`
🚶 步行路径规划（长距离）

起点：望京
终点：天安门

📏 距离：${(parseInt(path.distance) / 1000).toFixed(2)} 公里
⏱️ 预计时间：${cost?.duration ? Math.floor(parseInt(cost.duration) / 60) + ' 分钟' : '未返回'}
🚕 建议打车费用：约${path.taxi || 'API未返回'} 元

⚠️ 距离较长，建议选择公共交通或打车

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
          💡 默认：望京附近短途步行
        </Text>
      </View>

      {/* 基础测试 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>2. 基础路径规划</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title={loading ? '单条路线（计算中…）' : '单条路线'}
            onPress={wrap(testSingleRoute)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '2条备选路线（计算中…）' : '2条备选路线'}
            onPress={wrap(testTwoRoutes)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '3条备选路线（计算中…）' : '3条备选路线'}
            onPress={wrap(testThreeRoutes)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
        </View>
      </View>

      {/* 高级功能 */}
      <View style={[styles.section, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>3. 高级功能</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title={loading ? '详细导航信息（计算中…）' : '详细导航信息'}
            onPress={wrap(testDetailedNavi)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '室内算路（计算中…）' : '室内算路'}
            onPress={wrap(testIndoorRoute)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
          <View style={styles.buttonSpacer} />
          
          <Button
            title={loading ? '长距离步行（计算中…）' : '长距离步行（望京→天安门）'}
            onPress={wrap(testLongDistance)}
            disabled={loading}
            color={loading ? palette.border : palette.tint}
          />
        </View>
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
          • show_fields=cost 返回时间和打车费用{'\n'}
          • show_fields=navi 返回详细导航信息{'\n'}
          • isindoor=1 启用室内路径规划{'\n'}
          • 支持 POI ID 提升路径准确性{'\n'}
          • walk_type 字段标识道路类型（天桥、地下通道等）
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
