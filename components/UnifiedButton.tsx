import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string; // 背景色（等价于原生 Button 的 color）
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
};

/**
 * 统一 iOS/Android 外观的按钮
 * - 圆角、按压态、禁用态一致
 * - 支持 color 背景色（兼容原 Button API）
 * - Android 使用 ripple，iOS 使用透明度
 */
export default function UnifiedButton({
  title,
  onPress,
  disabled,
  color,
  style,
  textStyle,
  testID,
}: Props) {
  const bg = useMemo(() => {
    if (disabled) return 'rgba(0,0,0,0.12)';
    return color ?? '#3B82F6';
  }, [disabled, color]);

  const textColor = useMemo(() => {
    if (disabled) return '#888';
    // 简单亮度估算：hex 或 rgba，亮色用深文字，暗色用浅文字
    try {
      const c = toRgb(bg);
      const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
      return lum > 0.7 ? '#111' : '#fff';
    } catch {
      return '#fff';
    }
  }, [bg, disabled]);

  return (
    <View style={[styles.wrapper, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        onPress={onPress}
        disabled={disabled}
        android_ripple={{ color: 'rgba(0,0,0,0.12)', borderless: false }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: bg, opacity: pressed && !disabled && Platform.OS === 'ios' ? 0.85 : 1 },
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.text, { color: textColor }, textStyle]} numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

function toRgb(input: string): { r: number; g: number; b: number } {
  const s = input.trim();
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((ch) => ch + ch).join('');
    }
    const num = parseInt(hex.slice(0, 6), 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  const rgba = s.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const [r, g, b] = rgba[1].split(',').map((v) => parseFloat(v.trim()));
    return { r: clamp255(r), g: clamp255(g), b: clamp255(b) };
  }
  // fallback 蓝色
  return { r: 59, g: 130, b: 246 };
}

function clamp255(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: 10,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    // 统一禁用视觉
  },
});