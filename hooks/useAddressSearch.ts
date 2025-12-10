import type { InputTip } from 'expo-gaode-map-search';
import ExpoGaodeMapSearch from 'expo-gaode-map-search';
import { useRef, useState } from 'react';
import { toast } from 'sonner-native';

export interface Suggestion {
  id: string;
  name: string;
  district: string;
  address: string;
  latitude?: number;
  longitude?: number;
  adcode?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

export function useAddressSearch() {
  const [searchSuggestions, setSearchSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState<'origin' | 'destination' | null>(null);
  
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 搜索输入提示（使用原生 SDK）
  const searchInputTips = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const result = await ExpoGaodeMapSearch.getInputTips({
        keyword: keyword,
        city: '北京', // 可以使用城市名称
      });

      const tips: Suggestion[] = result.tips.map((tip: InputTip) => ({
        id: tip.id,
        name: tip.name,
        district: tip.adName || '',
        address: tip.address || tip.adName || '',
        latitude: tip.location?.latitude,
        longitude: tip.location?.longitude,
        adcode: tip.cityName,
      }));

      setSearchSuggestions(tips);
      setShowSuggestions(true);
    } catch (error) {
      console.error('搜索失败:', error);
      toast.error('搜索失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化（带防抖）
  const handleSearchChange = (text: string, inputType: 'origin' | 'destination') => {
    setActiveInput(inputType);

    // 清除之前的定时器
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // 设置新的防抖定时器
    searchTimeout.current = setTimeout(() => {
      searchInputTips(text);
    }, 500);
  };

  // 选择建议项并获取坐标
  const selectSuggestion = async (suggestion: Suggestion): Promise<LocationData | null> => {
    try {
      // 如果有坐标，直接使用
      if (suggestion.latitude !== undefined && suggestion.longitude !== undefined) {
        setShowSuggestions(false);
        return {
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          name: suggestion.name,
          address: suggestion.address,
        };
      } else {
        // 没有坐标，尝试通过 POI 搜索获取
        try {
          const result = await ExpoGaodeMapSearch.searchPOI({
            keyword: suggestion.name,
            city: suggestion.adcode || '北京',
            pageSize: 1,
            pageNum: 1,
          });

          if (result.pois && result.pois.length > 0) {
            const poi = result.pois[0];
            setShowSuggestions(false);
            return {
              latitude: poi.location.latitude,
              longitude: poi.location.longitude,
              name: suggestion.name,
              address: suggestion.address,
            };
          }

          toast.error('未找到该地址的坐标信息');
          return null;
        } catch (error) {
          console.error('获取坐标失败:', error);
          toast.error('获取坐标失败');
          return null;
        }
      }
    } catch (error) {
      console.error('选择地址失败:', error);
      toast.error('选择地址失败');
      return null;
    }
  };

  const clearSearch = () => {
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  return {
    searchSuggestions,
    showSuggestions,
    loading,
    activeInput,
    setActiveInput,
    handleSearchChange,
    selectSuggestion,
    clearSearch,
    setShowSuggestions,
  };
}