/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-12-10 13:43:05
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-10 13:43:14
 * @FilePath     : /expo-gaode-map-example/components/RouteCard.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */
import { RouteData } from '@/hooks/useRoutePlanning';
import { formatDistance, formatDuration } from '@/utils/routeUtils';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface RouteCardProps {
  route: RouteData;
  isSelected: boolean;
  onPress: () => void;
}

export function RouteCard({ route, isSelected, onPress }: RouteCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={onPress}
    >
      <Text style={[styles.title, isSelected && styles.selectedTitle]}>
        {route.strategyName}
      </Text>
      <Text style={[styles.info, isSelected && styles.selectedInfo]}>
        {formatDistance(route.distance)}
      </Text>
      <Text style={[styles.info, isSelected && styles.selectedInfo]}>
        {formatDuration(route.duration)}
      </Text>
      {route.tolls && route.tolls !== '0' && (
        <Text style={[styles.detail, isSelected && styles.selectedDetail]}>
          💰 过路费 ¥{route.tolls}
        </Text>
      )}
      {route.trafficLights && route.trafficLights !== '0' && (
        <Text style={[styles.detail, isSelected && styles.selectedDetail]}>
          🚦 {route.trafficLights}个红绿灯
        </Text>
      )}
      {route.transitFee && route.transitFee !== '0' && (
        <Text style={[styles.detail, isSelected && styles.selectedDetail]}>
          🚌 公交费 ¥{route.transitFee}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 10,
    minWidth: 110,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedCard: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  selectedTitle: {
    color: '#2196F3',
  },
  info: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
  },
  selectedInfo: {
    color: '#1976D2',
  },
  detail: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  selectedDetail: {
    color: '#64B5F6',
  },
});