import Button from '@/components/UnifiedButton';
import { useSafeScrollViewStyle } from '@/hooks/useSafeScrollView';
import { useAuth } from "@/store/useAuth";
import { ExpoGaodeMapModule } from 'expo-gaode-map';
import { router } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet } from "react-native";
const WEB_API_KEY = process.env.EXPO_PUBLIC_AMAP_WEB_KEY;
export default function MainScreen() {

    const {privacyAgreed} = useAuth()
    const contentStyle = useSafeScrollViewStyle(styles.content);

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
        <ScrollView
            style={styles.container}
            contentContainerStyle={contentStyle}
        >

            <Button title='基础地图使用' onPress={() => {
                router.push('/map')
             }} />
            <Button title='📍 POI 搜索(web-api)' onPress={() => {
                router.push('/poiSearch')
            }} />
            <Button title='📍 POI 搜索(native)' onPress={() => {
                router.push('/poiSearchNativeExample')
            }} />
            <Button title='📍 POI 搜索带地图(web-api)' onPress={() => {
                router.push('/poiMapSearch')
            }} />
            <Button title='📍 POI 搜索带地图(native)' onPress={() => {
                router.push('/poiSearchMapNativeExample')
            }} />
            <Button title="💡 输入提示(web-api)" onPress={()=>{
                router.push('/inputTips')
            }}/>
            <Button title="📍 地址选择器(web-api)" onPress={()=>{
                router.push('/addressPickerExample')
            }}/>
            <Button title="📍 地址选择器(native)" onPress={()=>{
                router.push('/addressPickerNativeExample')
            }}/>
            <Button title="🚗 路径规划示例(web-api)" onPress={()=>{
                router.push('/routeExamples')
            }}/>
            <Button title='🚗 web API 路线规划带地图' onPress={()=>{
                router.push('/webAPINavigationTest')
            }}/>
          
        </ScrollView>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    button: {
        width: '100%',
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        // borderWidth: 1,
    },
    content: {
        padding: 20,
        gap:15,
        flexGrow:1
    },
    pressed: {
        opacity: 0.85,
    },
    btnText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },
});