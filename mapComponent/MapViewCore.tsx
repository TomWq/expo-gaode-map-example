/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-12-13 23:04:31
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-13 23:08:39
 * @FilePath     : /expo-gaode-map-example/mapComponent/MapViewCore.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */
import { MapView, type CameraPosition, type MapViewRef } from 'expo-gaode-map';
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useCameraInfo } from './useCameraInfo';


type Props = {
  initialCamera: CameraPosition;
  onLoad: () => void;
};

export const MapViewCore = forwardRef<MapViewRef, Props>(
  ({ initialCamera, onLoad }, ref) => {
    const { cameraInfo, onCameraMove, onCameraIdle } = useCameraInfo();

    return (
      <>
        <MapView
          ref={ref}
          style={{ flex: 1 }}
          initialCameraPosition={initialCamera}

          /* 首帧最小化配置 */
          myLocationEnabled={false}
          trafficEnabled={false}
          indoorViewEnabled={false}

          compassEnabled
          tiltGesturesEnabled

          onLoad={onLoad}
          onCameraMove={onCameraMove}
          onCameraIdle={onCameraIdle}
        />

        {!!cameraInfo && (
          <View style={styles.cameraInfo}>
            <Text style={styles.cameraText}>{cameraInfo}</Text>
          </View>
        )}
      </>
    );
  }
);

const styles = StyleSheet.create({
  cameraInfo: {
    position: 'absolute',
    top: 60,
    left: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraText: {
    color: '#fff',
    fontSize: 12,
  },
});
