
import { CameraEvent } from 'expo-gaode-map';
import { useRef, useState } from 'react';
import { NativeSyntheticEvent } from 'react-native';

export function useCameraInfo() {
  const [cameraInfo, setCameraInfo] = useState('');
  const infoRef = useRef('');
  const rafId = useRef<number | null>(null);

  const onCameraMove = ({ nativeEvent }:NativeSyntheticEvent<CameraEvent>) => {
    const pos = nativeEvent.cameraPosition;
    infoRef.current =
      `移动中 · ${pos.target?.latitude.toFixed(4)}, ${pos.target?.longitude.toFixed(4)}`;

    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(() => {
        setCameraInfo(infoRef.current);
        rafId.current = null;
      });
    }
  };

  const onCameraIdle = ({ nativeEvent }:NativeSyntheticEvent<CameraEvent>) => {
    const pos = nativeEvent.cameraPosition;
    setCameraInfo(
      `已停止 · ${pos.target?.latitude.toFixed(4)}, ${pos.target?.longitude.toFixed(4)}`
    );
  };

  return { cameraInfo, onCameraMove, onCameraIdle };
}
