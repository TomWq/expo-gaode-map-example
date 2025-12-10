import { useHeaderHeight } from '@react-navigation/elements';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface SafeContentViewProps extends ViewProps {
  children: React.ReactNode;
  /** 是否禁用自动 padding，默认 false */
  disablePadding?: boolean;
}

/**
 * 安全内容视图组件
 * 自动处理 iOS 透明导航栏下的内容偏移
 * 
 * 注意：为了保持 headerBlurEffect 的模糊效果，
 * 此组件仅提供容器，实际的 paddingTop 应该应用在 ScrollView 的 contentContainerStyle 上
 */
export default function SafeContentView({ 
  children, 
  style, 
  disablePadding = false,
  ...props 
}: SafeContentViewProps) {
  const headerHeight = useHeaderHeight();
  
  // 将 headerHeight 通过 context 或其他方式传递给子组件
  // 这里我们简单地通过 View 包裹，让子组件可以通过 useHeaderHeight 自己获取
  
  return (
    <View 
      style={[styles.container, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});