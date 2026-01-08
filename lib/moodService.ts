import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// 기분 기록 타입
export interface MoodEntry {
    id: string;
    user_id: string;
    mood_tag: string;
    diary?: string;
    is_shared: boolean;
    created_at: string;
}

/**
 * 오늘의 기분 기록 저장
 */
export async function saveMoodEntry(data: {
    mood_tag: string;
    diary?: string;
    is_shared?: boolean;
}) {
    const { data: userData } = await supabase.auth.getUser();

    // 로컬에 오늘 날짜 저장 (게스트용)
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(`mood_${today}`, data.mood_tag);

    // 로그인 된 경우 DB에도 저장
    if (userData.user) {
        const { data: entry, error } = await supabase
            .from('mood_entries')
            .insert({
                user_id: userData.user.id,
                mood_tag: data.mood_tag,
                diary: data.diary,
                is_shared: data.is_shared ?? false,
            })
            .select()
            .single();

        if (error) {
            console.error('기분 저장 오류:', error.message);
            return { entry: null, error };
        }

        return { entry, error: null };
    }

    return { entry: null, error: null };
}

/**
 * 오늘 기분 기록 확인
 */
export async function checkTodayMood(): Promise<{
    hasRecorded: boolean;
    mood?: string;
}> {
    const today = new Date().toISOString().split('T')[0];

    // 먼저 로컬 확인
    const localMood = await AsyncStorage.getItem(`mood_${today}`);
    const skipped = await AsyncStorage.getItem(`mood_skipped_${today}`);

    if (localMood || skipped) {
        return { hasRecorded: true, mood: localMood || undefined };
    }

    // 로그인 된 경우 DB도 확인
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
        const startOfDay = new Date(today).toISOString();
        const endOfDay = new Date(today + 'T23:59:59').toISOString();

        const { data } = await supabase
            .from('mood_entries')
            .select('mood_tag')
            .eq('user_id', userData.user.id)
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay)
            .limit(1)
            .single();

        if (data) {
            // 로컬에도 동기화
            await AsyncStorage.setItem(`mood_${today}`, data.mood_tag);
            return { hasRecorded: true, mood: data.mood_tag };
        }
    }

    return { hasRecorded: false };
}

/**
 * 사용자의 최근 기분 기록 조회
 */
export async function getRecentMoods(limit = 7): Promise<MoodEntry[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('기분 기록 조회 오류:', error.message);
        return [];
    }

    return data as MoodEntry[];
}
