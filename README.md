# Expo 高德地图使用示例

这是一个基于 Expo 的高德地图完整使用示例项目，展示了如何在 React Native 应用中集成和使用高德地图的各种功能。

## 📦 项目概述

本项目是 `expo-gaode-map` 系列库的综合示例，包含了地图展示、POI 搜索、路径规划、地址选择等常见地图功能的实现。

## 🚀 主要功能

### 地图功能
- ✅ 基础地图展示
- 📍 POI 搜索（支持 Web API 和原生 SDK 两种方式）
- 📍 POI 搜索带地图展示
- 💡 输入提示（自动补全）
- 📍 地址选择器
- 🚗 路径规划（驾车、步行、骑行、公交）
- 🗺️ Web API 路线规划带地图展示

## 🛠️ 技术栈

- **Expo SDK**: ~54.0.27
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Expo Router**: ~6.0.17（文件路由）
- **TypeScript**: ~5.9.2

### 核心依赖库

- `expo-gaode-map`: ^2.2.0 - 高德地图核心库
- `expo-gaode-map-search`: ^1.3.0 - 地图搜索功能
- `expo-gaode-map-web-api`: ^1.1.0 - Web API 接口
- `zustand`: ^5.0.9 - 状态管理
- `sonner-native`: ^0.21.2 - Toast 提示

## 📋 环境要求

- Node.js 18+
- Expo CLI
- iOS 开发需要 Xcode
- Android 开发需要 Android Studio

## 🔧 安装配置

### 1. 安装依赖

```bash
npm install
# 或
yarn install
```

### 2. 配置高德地图 API Key

#### 获取 API Key
1. 访问[高德开放平台](https://console.amap.com/)
2. 注册并创建应用
3. 分别获取 iOS、Android 和 Web 的 API Key

#### 配置方式

**方式一：通过 app.json 配置（推荐）**

在 [`app.json`](app.json) 中配置：

```json
{
  "plugins": [
    [
      "expo-gaode-map",
      {
        "iosApiKey": "你的iOS Key",
        "androidApiKey": "你的Android Key",
        "enableLocation": true,
        "locationDescription": "我们需要访问您的位置信息以提供地图服务"
      }
    ]
  ]
}
```

**方式二：配置 Web API Key**

创建 [`.env`](.env) 文件：

```env
EXPO_PUBLIC_AMAP_WEB_KEY=你的Web服务Key
```

### 3. 预构建

由于使用了 Config Plugin，需要进行预构建：

```bash
# iOS
npx expo prebuild --platform ios

# Android
npx expo prebuild --platform android

# 或同时构建两个平台
npx expo prebuild
```

## 🚀 运行项目

### 开发模式

```bash
# 启动开发服务器
npm start

# 运行 iOS
npm run ios

# 运行 Android
npm run android

# 运行 Web
npm run web
```

## 📁 项目结构

```
expo-gaode-map-example/
├── app/                          # 应用页面（使用 Expo Router）
│   ├── (map)/                    # 地图功能页面组
│   │   ├── _layout.tsx           # 地图页面布局
│   │   ├── index.tsx             # 功能列表首页
│   │   ├── map.tsx               # 基础地图
│   │   ├── poiSearch.tsx         # POI搜索(Web API)
│   │   ├── poiSearchNativeExample.tsx    # POI搜索(原生)
│   │   ├── poiMapSearch.tsx      # POI搜索带地图(Web API)
│   │   ├── poiSearchMapNativeExample.tsx # POI搜索带地图(原生)
│   │   ├── inputTips.tsx         # 输入提示
│   │   ├── addressPickerExample.tsx      # 地址选择器(Web API)
│   │   ├── addressPickerNativeExample.tsx # 地址选择器(原生)
│   │   ├── routeExamples.tsx     # 路径规划示例列表
│   │   ├── drivingRouteExample.tsx       # 驾车路径规划
│   │   ├── walkingRouteExample.tsx       # 步行路径规划
│   │   ├── bicyclingRouteExample.tsx     # 骑行路径规划
│   │   ├── transitRouteExample.tsx       # 公交路径规划
│   │   └── webAPINavigationTest.tsx      # Web API路线规划
│   ├── _layout.tsx               # 根布局
│   └── auth.tsx                  # 隐私授权页面
├── components/                   # 公共组件
│   ├── IntroModal.tsx            # 介绍弹窗
│   ├── RouteCard.tsx             # 路线卡片
│   ├── RouteInfoCard.tsx         # 路线信息卡片
│   ├── SafeContentView.tsx       # 安全区域视图
│   └── UnifiedButton.tsx         # 统一按钮组件
├── hooks/                        # 自定义 Hooks
│   ├── useAddressSearch.ts       # 地址搜索 Hook
│   ├── useDeviceVersion.ts       # 设备版本检测
│   ├── useRoutePlanning.ts       # 路径规划 Hook
│   └── useSafeScrollView.ts      # 安全滚动视图
├── store/                        # 状态管理
│   └── useAuth.ts                # 授权状态
├── utils/                        # 工具函数
│   └── routeUtils.ts             # 路线工具函数
├── constants/                    # 常量配置
│   └── Colors.ts                 # 颜色配置
├── assets/                       # 资源文件
├── .env                          # 环境变量
├── app.json                      # Expo 配置
├── package.json                  # 项目依赖
└── tsconfig.json                 # TypeScript 配置
```

## 💡 主要功能说明

### 1. SDK 初始化

在 [`app/(map)/index.tsx`](app/(map)/index.tsx) 中初始化 SDK：

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

ExpoGaodeMapModule.initSDK({
  androidKey: '', // 通过 Config Plugin 注入，这里留空
  iosKey: '',     // 通过 Config Plugin 注入，这里留空
  webKey: process.env.EXPO_PUBLIC_AMAP_WEB_KEY // Web API Key
});
```

### 2. POI 搜索

支持两种搜索方式：

**Web API 方式**（适用于跨平台）
- 使用 `expo-gaode-map-web-api` 库
- 需要配置 Web 服务 Key

**原生 SDK 方式**（推荐，性能更好）
- 使用 `expo-gaode-map-search` 库
- 直接调用原生 SDK

### 3. 路径规划

支持多种出行方式：
- 🚗 驾车路径规划
- 🚶 步行路径规划
- 🚴 骑行/电动车路径规划
- 🚌 公交路径规划

### 4. 地址选择器

提供完整的地址选择功能：
- 搜索地址
- 地图选点
- 逆地理编码
- 输入提示

## 🔐 隐私合规

项目包含隐私政策弹窗（[`components/IntroModal.tsx`](components/IntroModal.tsx)），符合高德地图隐私合规要求。用户必须同意隐私政策后才能使用地图功能。

## 📱 平台支持

- ✅ iOS
- ✅ Android
- ⚠️ Web（部分功能支持）

> 注意：Web 平台仅支持使用 Web API 的功能，不支持原生 SDK 功能。

## 🐛 常见问题

### 1. 地图无法显示

- 检查 API Key 是否正确配置
- 确认已经执行 `expo prebuild`
- 检查网络连接

### 2. iOS 真机无法定位

- 在 Info.plist 中配置定位权限描述
- 已在 Config Plugin 中自动配置

### 3. Android 编译失败

- 检查 Android SDK 版本
- 清理构建缓存：`cd android && ./gradlew clean`

## 📚 相关文档

- [expo-gaode-map 文档](https://github.com/yourusername/expo-gaode-map)
- [高德开放平台](https://lbs.amap.com/)
- [Expo 文档](https://docs.expo.dev/)

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 👨‍💻 作者

如有问题，欢迎联系。

---

⭐ 如果这个项目对你有帮助，请给个 Star！