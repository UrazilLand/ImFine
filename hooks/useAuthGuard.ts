import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';

/**
 * 인증 가드 훅
 * 
 * 로그인이 필요한 액션 시 사용
 * - 비로그인 → 로그인 화면 이동
 * - 로그인 → 액션 수행
 */
export function useAuthGuard() {
    const { user, loading } = useAuth();
    const router = useRouter();

    /**
     * 로그인이 필요한 액션 실행
     * @param action 로그인 후 실행할 함수
     * @param message 로그인 요청 메시지 (선택)
     */
    const requireAuth = (action?: () => void, message?: string) => {
        if (loading) return false;

        if (!user) {
            if (Platform.OS === 'web') {
                // 웹에서는 바로 로그인 화면으로 이동
                router.push('/(auth)/login');
            } else {
                // 네이티브에서는 Alert 사용
                Alert.alert(
                    '로그인 필요',
                    message || '이 기능을 사용하려면 로그인이 필요합니다.',
                    [
                        { text: '취소', style: 'cancel' },
                        { text: '로그인', onPress: () => router.push('/(auth)/login') },
                    ]
                );
            }
            return false;
        }

        if (action) {
            action();
        }
        return true;
    };

    return {
        isAuthenticated: !!user,
        isLoading: loading,
        user,
        requireAuth,
    };
}
