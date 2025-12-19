
import { MapViewRef } from 'expo-gaode-map';
import { useRef } from 'react';
import { View } from 'react-native';

import { Controls } from '../../mapComponent/Controls';
import { MapViewCore } from '../../mapComponent/MapViewCore';
import { Overlays } from '../../mapComponent/Overlays';
import { useMapLifecycle } from '../../mapComponent/useMapLifecycle';

export default function MapScreen() {
  const mapRef = useRef<MapViewRef>(null);

  const {
    initialCamera,
    mapReady,
    onMapLoad,
  } = useMapLifecycle(mapRef);

  if (!initialCamera) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <MapViewCore
        ref={mapRef}
        initialCamera={initialCamera}
        onLoad={onMapLoad}
      />

      {mapReady && <Overlays mapRef={mapRef} />}
      <Controls mapRef={mapRef} />
    </View>
  );
}
