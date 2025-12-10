import { useHeaderHeight } from '@react-navigation/elements';
import { Platform } from 'react-native';

/**
 * 为 ScrollView contentContainerStyle 提供安全的 paddingTop
 * 用于处理 iOS 透明导航栏的内容偏移问题
 * 
 * 使用方法：
 * const contentStyle = useSafeScrollViewStyle(styles.content);
 * <ScrollView contentContainerStyle={contentStyle}>
 */
export function useSafeScrollViewStyle(baseStyle?: any) {
  const headerHeight = useHeaderHeight();
  
  // 仅在 iOS 上添加 paddingTop
  const paddingTop = Platform.OS === 'ios' ? headerHeight : 10;
  
  return [baseStyle, { paddingTop }];
}

/**
 * 获取安全的 padding 值
 */
export function useSafeAreaPadding() {
  const headerHeight = useHeaderHeight();
  
  return {
    paddingTop: Platform.OS === 'ios' ? headerHeight : 0,
  };
}