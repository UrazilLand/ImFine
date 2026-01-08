import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

/**
 * Supabase 클라이언트 설정
 * 
 * 환경변수 또는 직접 설정으로 Supabase URL과 Anon Key를 입력하세요.
 * 실제 배포 시에는 환경변수로 관리하는 것을 권장합니다.
 */

// TODO: 실제 Supabase 프로젝트 정보로 교체하세요
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// 플랫폼별 스토리지 설정
const getStorage = () => {
    if (Platform.OS === 'web') {
        // 웹 환경: localStorage 사용
        return {
            getItem: (key: string) => {
                if (typeof window !== 'undefined') {
                    return Promise.resolve(window.localStorage.getItem(key));
                }
                return Promise.resolve(null);
            },
            setItem: (key: string, value: string) => {
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, value);
                }
                return Promise.resolve();
            },
            removeItem: (key: string) => {
                if (typeof window !== 'undefined') {
                    window.localStorage.removeItem(key);
                }
                return Promise.resolve();
            },
        };
    } else {
        // 네이티브 환경: AsyncStorage 사용 (지연 로딩)
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return AsyncStorage;
    }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: getStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
    },
});

/**
 * 현재 세션 확인
 */
export async function getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('세션 확인 오류:', error.message);
        return null;
    }
    return session;
}

/**
 * 현재 사용자 확인
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('사용자 확인 오류:', error.message);
        return null;
    }
    return user;
}
