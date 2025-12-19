/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-12-10 12:51:09
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-10 12:54:32
 * @FilePath     : /expo-gaode-map-example/hooks/useDeviceVersion.ts
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */
import { Platform } from 'react-native';

/**
 * 获取 iOS 版本号
 * @returns "iOS 17.2" 或 null (非iOS设备)
 */
export function useIOSVersion() {
  if (Platform.OS !== 'ios') return null;
  return `iOS ${Platform.Version}`;
}

/**
 * 获取完整设备信息
 */
export function useDeviceInfo() {
  return {
    os: Platform.OS,
    version: Platform.Version.toString(),
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    // iOS 版本号
    iosVersion: Platform.OS === 'ios' ? Platform.Version : null,
    // Android API Level
    androidApiLevel: Platform.OS === 'android' ? Platform.Version : null,
  };
}

/**
 * 检查 iOS 版本是否满足最低要求
 * @param minVersion 最低版本号，如 16 或 16.5
 */
export function useIOSVersionCheck(minVersion: number) {
  if (Platform.OS !== 'ios') return false;
  const version = Platform.Version;
  if (typeof version === 'string') {
    return parseFloat(version) >= minVersion;
  }
  return version >= minVersion;
}

/**
 * 获取 iOS 版本号（数字）
 * @returns iOS 版本号或 null (非iOS设备)
 */
export function useIOSVersionNumber(): number | null {
  if (Platform.OS !== 'ios') return null;
  const version = Platform.Version;
  // if (typeof version === 'string') {
  //   return parseFloat(version);
  // }
  // return version;
  return parseInt(Platform.Version as string, 10);
}