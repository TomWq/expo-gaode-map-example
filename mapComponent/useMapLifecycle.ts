
import { ExpoGaodeMapModule, MapViewRef, type CameraPosition } from 'expo-gaode-map';
import { RefObject, useEffect, useState } from 'react';

export function useMapLifecycle(mapRef: RefObject<MapViewRef | null>) {
  const [initialCamera, setInitialCamera] = useState<CameraPosition | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // 页面 mount 时，只给一个兜底相机
    setInitialCamera({
      target: { latitude: 39.9, longitude: 116.4 },
      zoom: 12,
    });
  }, []);

  const onMapLoad = () => {
    setMapReady(true);

    // 地图 ready 后再启动定位
    requestAnimationFrame(() => {
      startLocation();
    });
  };

  const startLocation = async () => {
    try {
      const loc = await ExpoGaodeMapModule.getCurrentLocation();

      mapRef?.current?.moveCamera(
        {
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 15,
        },
        300
      );

      // 延迟打开定位展示，避免首帧抖动
      setTimeout(() => {
        // mapRef.current?.setMyLocationEnabled?.(true);
      }, 400);
    } catch {}
  };

  return {
    initialCamera,
    mapReady,
    onMapLoad,
  };
}
