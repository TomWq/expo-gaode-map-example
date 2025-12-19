/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-12-13 23:07:07
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-13 23:09:40
 * @FilePath     : /expo-gaode-map-example/mapComponent/Overlays.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */
import { Circle, MapViewRef, Marker, Polygon, Polyline } from 'expo-gaode-map';
import { useEffect, useState } from 'react';

export function Overlays({ mapRef }: { mapRef: React.RefObject<MapViewRef | null> }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return null;

  return (
    <>
      <Marker
        position={{ latitude: 39.92, longitude: 116.42 }}
        title="示例标记"
      />

      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={300}
        fillColor="rgba(0,255,0,0.3)"
        strokeColor="#00FF00"
      />

      <Polyline
        points={[
          { latitude: 39.88, longitude: 116.38 },
          { latitude: 39.9, longitude: 116.4 },
        ]}
        strokeColor="#FF0000"
        strokeWidth={4}
      />

      <Polygon
        points={[
          { latitude: 39.86, longitude: 116.4 },
          { latitude: 39.88, longitude: 116.42 },
          { latitude: 39.84, longitude: 116.44 },
        ]}
        fillColor="rgba(255,0,0,0.3)"
        strokeColor="#FF0000"
      />
    </>
  );
}
