import { ExpoGaodeMapModule } from 'expo-gaode-map';
import { DrivingStrategy, GaodeWebAPI, TransitStrategy } from 'expo-gaode-map-web-api';
import { useState } from 'react';
import { toast } from 'sonner-native';
import { generateRouteColor } from '../utils/routeUtils';
export interface RouteData {
  id: number;
  distance: number;
  duration: number;
  tolls?: string;
  trafficLights?: string;
  transitFee?: string;
  walkingDistance?: number;
  polyline: Array<{ latitude: number; longitude: number }>;
  strategyName: string;
  strategy?: number;
  color: string;
  segments?: any;
}

export type RouteType = 'driving' | 'walking' | 'bicycling' | 'transit';

export function useRoutePlanning(api: GaodeWebAPI | null) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [allRoutes, setAllRoutes] = useState<RouteData[]>([]);
  const [routeType, setRouteType] = useState<RouteType>('driving');

  const calculateRoute = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ) => {
    if (!api) {
      toast.error('API 未初始化');
      return null;
    }

    setIsCalculating(true);

    const originStr = `${origin.longitude},${origin.latitude}`;
    const destStr = `${destination.longitude},${destination.latitude}`;

    console.log(`[RoutePlanning] 开始计算${routeType}路径...`);

    try {
      let routes: RouteData[] = [];

      switch (routeType) {
        case 'driving':
          routes = await calculateDrivingRoutes(api, originStr, destStr);
          break;
        case 'walking':
          routes = await calculateWalkingRoutes(api, originStr, destStr);
          break;
        case 'bicycling':
          routes = await calculateBicyclingRoutes(api, originStr, destStr);
          break;
        case 'transit':
          routes = await calculateTransitRoutes(api, originStr, destStr);
          break;
      }

      if (routes.length === 0) {
        toast.error('未找到路径');
        return null;
      }

      setAllRoutes(routes);
      toast.success(`路径规划成功！找到 ${routes.length} 条路线方案，请选择一条查看`);
      return routes;
    } catch (error) {
      console.error('[RoutePlanning] 路径规划失败:', error);
      toast.error(`路径规划失败: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    } finally {
      setIsCalculating(false);
    }
  };

  const clearRoutes = () => {
    setAllRoutes([]);
  };

  return {
    isCalculating,
    allRoutes,
    routeType,
    setRouteType,
    calculateRoute,
    clearRoutes,
  };
}

// 驾车路径规划
async function calculateDrivingRoutes(api: GaodeWebAPI, origin: string, dest: string): Promise<RouteData[]> {
  const strategies = [
    { value: DrivingStrategy.DEFAULT, name: '速度优先' },
    { value: DrivingStrategy.AVOID_JAM, name: '躲避拥堵' },
    { value: DrivingStrategy.HIGHWAY_FIRST, name: '高速优先' },
    { value: DrivingStrategy.NO_HIGHWAY, name: '不走高速' },
    { value: DrivingStrategy.LESS_TOLL, name: '少收费' },
  ];

  const allRoutes: RouteData[] = [];
  let routeId = 0;

  for (const strategy of strategies) {
    try {
      const result = await api.route.driving(origin, dest, {
        strategy: strategy.value,
        show_fields: 'cost,polyline',
      });

      if (result.route?.paths && result.route.paths.length > 0) {
        // 每个策略只取第一条路径,确保每种策略都能展示
        const path = result.route.paths[0];
        allRoutes.push({
          id: routeId++,
          distance: parseInt(path.distance),
          duration: parseInt(path.cost?.duration || '0'),
          tolls: path.cost?.tolls || '0',
          trafficLights: path.cost?.traffic_lights || '0',
          polyline: path.steps?.flatMap((step: any) =>
            ExpoGaodeMapModule.parsePolyline(step.polyline)
          ) || [],
          strategyName: strategy.name,
          strategy: strategy.value,
          color: generateRouteColor(routeId - 1),
        });
        
        // 如果有备选路径,只添加明显不同的方案
        for (let i = 1; i < result.route.paths.length; i++) {
          const altPath = result.route.paths[i];
          const altDistance = parseInt(altPath.distance);
          const altDuration = parseInt(altPath.cost?.duration || '0');
          
          // 检查是否与已有路线有明显差异(距离差>500m 或时长差>150s)
          const isDifferent = !allRoutes.some(r =>
            Math.abs(r.distance - altDistance) < 500 &&
            Math.abs(r.duration - altDuration) < 150
          );
          
          if (isDifferent && allRoutes.length < 10) {
            allRoutes.push({
              id: routeId++,
              distance: altDistance,
              duration: altDuration,
              tolls: altPath.cost?.tolls || '0',
              trafficLights: altPath.cost?.traffic_lights || '0',
              polyline: altPath.steps?.flatMap((step: any) =>
                ExpoGaodeMapModule.parsePolyline(step.polyline)
              ) || [],
              strategyName: `${strategy.name}备选${i}`,
              strategy: strategy.value,
              color: generateRouteColor(routeId - 1),
            });
          }
        }
      }
    } catch (error) {
      console.warn(`策略 ${strategy.name} 请求失败:`, error);
    }
  }

  console.log(`[驾车路径] 返回 ${allRoutes.length} 条路线`);
  return allRoutes;
}

// 步行路径规划
async function calculateWalkingRoutes(api: GaodeWebAPI, origin: string, dest: string): Promise<RouteData[]> {
  const result = await api.route.walking(origin, dest, {
    alternative_route: 3,
    show_fields: 'cost,polyline',
  });

  if (!result.route?.paths) return [];

  console.log(`[步行路径] 返回 ${result.route.paths.length} 条路径`);

  return result.route.paths.map((path: any, index: number) => ({
    id: index,
    distance: parseInt(path.distance),
    duration: parseInt(path.cost?.duration || '0'),
    polyline: path.steps?.flatMap((step: any) =>
      ExpoGaodeMapModule.parsePolyline(step.polyline)
    ) || [],
    strategyName: index === 0 ? '推荐' : `方案${index + 1}`,
    color: generateRouteColor(index),
  } as RouteData));
}

// 骑行路径规划
async function calculateBicyclingRoutes(api: GaodeWebAPI, origin: string, dest: string): Promise<RouteData[]> {
  try {
    const result = await api.route.bicycling(origin, dest, {
      alternative_route: 3, // 获取3条备选路线
      show_fields: 'cost,polyline',
    });

    if (!result.route?.paths || result.route.paths.length === 0) {
      console.log('[骑行路径] 未找到路线');
      return [];
    }

    console.log(`[骑行路径] 返回 ${result.route.paths.length} 条路径`);

    const allRoutes: RouteData[] = [];
    
    result.route.paths.forEach((path: any, index: number) => {
      const distance = parseInt(path.distance);
      const duration = parseInt(path.cost?.duration || path.duration || '0');
      
      console.log(`[骑行方案${index + 1}] 距离=${distance}m, 时长=${duration}s`);
      
      allRoutes.push({
        id: index,
        distance,
        duration,
        polyline: path.steps?.flatMap((step: any) =>
          ExpoGaodeMapModule.parsePolyline(step.polyline)
        ) || [],
        strategyName: index === 0 ? '推荐' : `方案${index + 1}`,
        color: generateRouteColor(index),
      });
    });

    return allRoutes;
  } catch (error) {
    console.error('[骑行路径] 规划失败:', error);
    return [];
  }
}

// 公交路径规划
async function calculateTransitRoutes(api: GaodeWebAPI, origin: string, dest: string): Promise<RouteData[]> {
  try {
    // 只使用推荐策略,但获取多个方案
    const result = await api.route.transit(
      origin,
      dest,
      '010', // 北京
      '010',
      {
        strategy: TransitStrategy.RECOMMENDED,
        AlternativeRoute: 5, // 获取5个备选方案
        show_fields: 'cost,polyline',
      }
    );

    if (!result.route?.transits || result.route.transits.length === 0) {
      console.log('[公交路径] 未找到路线');
      return [];
    }

    console.log(`[公交路径] 返回 ${result.route.transits.length} 条方案`);

    const allRoutes: RouteData[] = [];
    
    result.route.transits.forEach((transit: any, index: number) => {
      const routeData = processTransitRoute(transit, index, index === 0 ? '推荐' : `方案${index + 1}`);
      if (routeData) {
        console.log(`[公交方案${index + 1}] 距离=${routeData.distance}m, 时长=${routeData.duration}s, 费用=${routeData.transitFee}元, 步行=${routeData.walkingDistance}m`);
        allRoutes.push(routeData);
      }
    });

    return allRoutes;
  } catch (error) {
    console.error('[公交路径] 规划失败:', error);
    return [];
  }
}

// 处理单条公交路线数据
function processTransitRoute(transit: any, id: number, strategyName: string): RouteData | null {
  if (!transit) return null;

  const allPoints: any[] = [];

  transit.segments?.forEach((segment: any) => {
    // 步行段
    segment.walking?.steps?.forEach((step: any) => {
      allPoints.push(...ExpoGaodeMapModule.parsePolyline(step.polyline));
    });

    // 公交段
    segment.bus?.buslines?.forEach((busline: any) => {
      allPoints.push(...ExpoGaodeMapModule.parsePolyline(busline.polyline));
    });

    // 地铁段
    segment.railway?.buslines?.forEach((busline: any) => {
      allPoints.push(...ExpoGaodeMapModule.parsePolyline(busline.polyline));
    });
  });

  return {
    id,
    distance: parseInt(transit.distance),
    duration: parseInt(transit.cost?.duration || '0'),
    transitFee: transit.cost?.transit_fee || '0',
    walkingDistance: parseInt(transit.walking_distance || '0'),
    polyline: allPoints,
    strategyName,
    color: generateRouteColor(id),
    segments: transit.segments,
  } as RouteData;
}