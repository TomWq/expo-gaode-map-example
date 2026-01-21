/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-12-09 13:35:35
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-24 11:39:04
 * @FilePath     : /expo-gaode-map-example/app/(map)/index.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */
import Button from '@/components/UnifiedButton';
import { useSafeScrollViewStyle } from '@/hooks/useSafeScrollView';
import { useAuth } from "@/store/useAuth";
import { ExpoGaodeMapModule } from 'expo-gaode-map';
import { router } from "expo-router";
import { useEffect } from 'react';
import { ScrollView, StyleSheet } from "react-native";
export default function MainScreen() {

    const {privacyAgreed} = useAuth()
    const contentStyle = useSafeScrollViewStyle(styles.content);

    // const { isReady, stats } = useMapPreload({ poolSize: 1, delay: 0, strategy: 'native' }, true);

    useEffect(()=>{
        ExpoGaodeMapModule.initSDK({
            webKey:''
        })
    },[])
  
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            contentInsetAdjustmentBehavior='automatic'
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
            <Button title='离线地图下载' onPress={() =>{
                router.push('/offlineMapExample')
            }}/>
            <Button title='几何计算' onPress={
                () => {
                    router.push('/geometryUtilsExample')
                }
            }/>
            <Button title='🏃 轨迹回放示例' onPress={() => {
              
                router.push('/trackPlaybackExample')
            }}/>
            <Button title='📍 位置签到打卡' onPress={() => {
              
                router.push('/checkInExample')
            }}/>
            <Button title='🏢 行业场景综合示例' onPress={() => {
             
                router.push('/industrySceneExample')
            }}/>
            <Button title='🚗 路径规划与定位平滑移动示例' onPress={() => {
               
                router.push('/navigationWithLocation')
            }}/>
            <Button title='🚕 出租车上车点选择器' onPress={() => {
             
                router.push('/taxiLocationPicker')
            }}/>
            <Button title='🏢 企微考勤打卡示例' onPress={() => {
             
                router.push('/enterpriseCheckIn')
            }} />
            <Button title='🍕 外卖选址界面示例' onPress={() => {
             
                router.push('/deliveryAddressPicker')
            }} />
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
