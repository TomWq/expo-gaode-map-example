import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthStore {
  // 是否同意隐私协议
  privacyAgreed: boolean;
  // 设置是否同意隐私协议
  setPrivacyAgreed: (privacyAgreed: boolean) => void;
}

// 简单内存存储，作为极端环境（无 localStorage / 无 AsyncStorage）回退，避免报错
const memoryStore: Record<string, string | undefined> = {};
const memoryStorage = {
  getItem: (name: string) => memoryStore[name] ?? null,
  setItem: (name: string, value: string) => {
    memoryStore[name] = value;
  },
  removeItem: (name: string) => {
    delete memoryStore[name];
  },
};

// 选择合适的持久化存储
const selectStorage = () => {
  if (Platform.OS === 'web') {
    try {
      // 可能因隐私/无痕模式不可用，需捕获
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch {
      // ignore and fallback
    }
    return memoryStorage;
  }
  // 原生端使用 AsyncStorage
  return AsyncStorage;
};

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      privacyAgreed: false,
      setPrivacyAgreed: (privacyAgreed: boolean) => set({ privacyAgreed }),
    }),
    {
      name: 'auth',
      version: 1,
      storage: createJSONStorage(selectStorage),
      partialize: (state) => ({
        privacyAgreed: state.privacyAgreed,
      }),
    }
  )
);