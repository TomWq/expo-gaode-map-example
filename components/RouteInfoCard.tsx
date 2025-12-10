
import { RouteData } from '@/hooks/useRoutePlanning';
import { formatDistance, formatDuration } from '@/utils/routeUtils';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RouteInfoCardProps {
  route: RouteData;
}

export function RouteInfoCard({ route }: RouteInfoCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>路线信息</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>📏 距离:</Text>
        <Text style={styles.value}>{formatDistance(route.distance)}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>⏱️ 预计:</Text>
        <Text style={styles.value}>{formatDuration(route.duration)}</Text>
      </View>
      
      {route.tolls && route.tolls !== '0' && (
        <View style={styles.row}>
          <Text style={styles.label}>💰 过路费:</Text>
          <Text style={styles.value}>¥{route.tolls}</Text>
        </View>
      )}
      
      {route.trafficLights && route.trafficLights !== '0' && (
        <View style={styles.row}>
          <Text style={styles.label}>🚦 红绿灯:</Text>
          <Text style={styles.value}>{route.trafficLights}个</Text>
        </View>
      )}
      
      {route.transitFee && route.transitFee !== '0' && (
        <View style={styles.row}>
          <Text style={styles.label}>🚌 公交费:</Text>
          <Text style={styles.value}>¥{route.transitFee}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});