/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 1985-10-26 16:15:00
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-13 22:04:52
 * @FilePath     : /expo-gaode-map-example/app/_layout.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */

import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/store/useAuth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { ExpoGaodeMapModule } from 'expo-gaode-map';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Toaster } from 'sonner-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(map)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
const WEB_API_KEY = process.env.EXPO_PUBLIC_AMAP_WEB_KEY;
export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {

  const colorScheme = useColorScheme();
  const {privacyAgreed} = useAuth()


      useEffect(() => {
  
          if(!privacyAgreed) {
              return
          }
  
          try {
              // 初始化SDK，已经通过 Config Plugin注入 ios 在 Info.plist 中的 key 安卓在 AndroidManifest.xml,保证安全性，
              // 不必要在这里再次注入，如果要用 web-api 从环境变量读取 Key 生产请用 EXPO_PUBLIC_ 前缀或远端下发
              ExpoGaodeMapModule.initSDK({
                  androidKey: '',
                  iosKey: '',
                  webKey: WEB_API_KEY
              })
          } catch (error) {
              console.log(error)
          }
         
      }, [])
 
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
        <Stack.Protected guard={!privacyAgreed}>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={privacyAgreed}>
          <Stack.Screen name="(map)" options={{ headerShown: false }} />
        </Stack.Protected>
        </Stack>
      </ThemeProvider>
       <Toaster invert={true} duration={1500} theme={'light'} position={'top-center'}/>
    </GestureHandlerRootView>
  );
}
 