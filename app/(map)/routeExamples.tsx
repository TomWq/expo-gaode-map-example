import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useSafeScrollViewStyle } from '@/hooks/useSafeScrollView';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * 路径规划示例菜单
 * 可以直接作为 App 的根组件使用
 */
export default function RouteExamples() {
  const [currentExample, setCurrentExample] = useState<string | null>(null);

  // 主题与色彩
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const softBg = colorScheme === 'dark' ? '#0c0c0c' : '#f5f5f5';
  const cardBg = colorScheme === 'dark' ? '#121212' : '#ffffff';
  const textColor = colorScheme === 'dark' ? '#f5f5f5' : '#333';
  const muted = colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : '#666';
  const hairline = colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : '#e6e6e6';
  const chipBg = colorScheme === 'dark' ? 'rgba(47,149,220,0.12)' : '#e6f7ff';
  const chipBorder = colorScheme === 'dark' ? 'rgba(47,149,220,0.35)' : '#91d5ff';


  // 显示菜单
  const examples = [
    {
      id: 'driving',
      title: '🚗 驾车路径规划',
      description: '速度优先、躲避拥堵、高速优先等多种策略',
      features: ['策略32-45', '新能源车', '车牌限行', 'show_fields'],
      path:'/drivingRouteExample'
    },
    {
      id: 'walking',
      title: '🚶 步行路径规划',
      description: '单条/多条路线、详细导航、室内算路',
      features: ['1-3条路线', '室内导航', '道路类型', '打车费用'],
      path:'/walkingRouteExample'
    },
    {
      id: 'transit',
      title: '🚌 公交路径规划',
      description: '推荐、最经济、最少换乘等多种模式',
      features: ['9种策略', '地铁优先', '时间短', '多方案对比'],
      path:'/transitRouteExample'
    },
    {
      id: 'bicycling',
      title: '🚴 骑行 & 电动车',
      description: '骑行和电动车路径规划及对比',
      features: ['骑行路线', '电动车路线', '路线对比', '短途测试'],
      path:'/bicyclingRouteExample'
    },
  ];

   const contentStyle = useSafeScrollViewStyle(styles.container);

  return (
    <ScrollView style={[contentStyle, { backgroundColor: softBg }]}>
     
      {examples.map((example) => (
        <Pressable
          key={example.id}
          onPress={() => {
            //@ts-ignore
            router.push(example.path);
          }}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: cardBg, borderColor: hairline },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: textColor }]}>{example.title}</Text>
          </View>

          <Text style={[styles.cardDescription, { color: muted }]}>{example.description}</Text>

          <View style={styles.featuresContainer}>
            {example.features.map((feature, index) => (
              <View key={index} style={[styles.featureTag, { backgroundColor: chipBg, borderColor: chipBorder }]}>
                <Text style={[styles.featureText, { color: primary }]}>{feature}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.tapHint, { color: primary }]}>点击查看示例 →</Text>
        </Pressable>
      ))}

      <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#2a1f0a' : '#fff3e0', borderLeftColor: '#FF9800' }]}>
        <Text style={[styles.infoTitle, { color: colorScheme === 'dark' ? '#FFC107' : '#E65100' }]}>💡 使用提示</Text>
        <Text style={[styles.infoText, { color: muted }]}>
          1. 每个示例都自动解析 Web API Key初始化{'\n'}
          2. 可以自定义起点终点坐标{'\n'}
          3. 所有示例都符合新版 V5 API{'\n'}
          4. 详细说明请查看 README.md
        </Text>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1890ff',
    padding: 24,
    paddingTop: 148,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  backButton: {
    backgroundColor: '#1890ff',
    padding: 12,
    paddingTop: 48,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    borderWidth: 1,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  featureText: {
    fontSize: 11,
    color: '#1890ff',
  },
  tapHint: {
    fontSize: 12,
    color: '#1890ff',
    textAlign: 'right',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#fff3e0',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  spacer: {
    height: 40,
  },
  pressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.96,
  },
});