/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-12-13 23:07:28
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-13 23:07:35
 * @FilePath     : /expo-gaode-map-example/mapComponent/Controls.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */
import { ExpoGaodeMapModule, MapViewRef } from 'expo-gaode-map';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function Controls({ mapRef }: { mapRef: React.RefObject<MapViewRef | null> }) {
  return (
    <View style={styles.panel}>
      <Pressable
        style={styles.btn}
        onPress={async () => {
          const loc = await ExpoGaodeMapModule.getCurrentLocation();
          mapRef.current?.moveCamera({
            target: loc,
            zoom: 15,
          });
        }}
      >
        <Text style={styles.text}>定位</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  btn: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
  },
});
