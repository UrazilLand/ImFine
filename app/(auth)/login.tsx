import { brand } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

/**
 * 로그인/회원가입 화면
 * 
 * ImFine 브랜드 스타일의 인증 화면
 */
export default function LoginScreen() {
    const router = useRouter();
    const { signInWithEmail, signUpWithEmail } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email || !password) {
            Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다.');
            return;
        }

        setLoading(true);

        try {
            const { error } = isLogin
                ? await signInWithEmail(email, password)
                : await signUpWithEmail(email, password);

            if (error) {
                // 로그인 실패 시 회원가입 유도
                if (isLogin && error.message.includes('Invalid login credentials')) {
                    Alert.alert(
                        '로그인 실패',
                        '계정을 찾을 수 없습니다. 회원가입하시겠습니까?',
                        [
                            { text: '취소', style: 'cancel' },
                            { text: '회원가입', onPress: () => setIsLogin(false) },
                        ]
                    );
                } else {
                    Alert.alert('오류', error.message);
                }
            } else if (!isLogin) {
                Alert.alert('가입 완료', '이메일을 확인해주세요!');
                setIsLogin(true);
            } else {
                // 로그인 성공 - 메인 화면으로 이동
                router.replace('/(tabs)');
            }
        } catch (e) {
            Alert.alert('오류', '네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                {/* 로고 영역 */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>IF</Text>
                    <Text style={styles.subtitle}>I'm Fine</Text>
                </View>

                {/* 입력 폼 */}
                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="이메일"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="비밀번호"
                        placeholderTextColor="#888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {/* 제출 버튼 */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {isLogin ? '로그인' : '가입하기'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* 모드 전환 */}
                    <TouchableOpacity
                        style={styles.switchButton}
                        onPress={() => setIsLogin(!isLogin)}
                    >
                        <Text style={styles.switchButtonText}>
                            {isLogin ? '계정이 없으신가요? 가입하기' : '이미 계정이 있으신가요? 로그인'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 소셜 로그인 (추후 구현) */}
                <View style={styles.socialContainer}>
                    <Text style={styles.dividerText}>또는</Text>
                    <View style={styles.socialButtons}>
                        <TouchableOpacity style={[styles.socialButton, styles.kakaoButton]}>
                            <Text style={styles.socialButtonText}>카카오</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
                            <Text style={styles.socialButtonText}>Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.socialButton, styles.appleButton]}>
                            <Text style={[styles.socialButtonText, { color: '#fff' }]}>Apple</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: brand.charcoal,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        fontSize: 80,
        fontWeight: '300',
        fontStyle: 'italic',
        color: brand.orange,
        letterSpacing: -3,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '300',
        color: brand.beige,
        marginTop: 8,
    },
    formContainer: {
        gap: 16,
    },
    input: {
        backgroundColor: '#3D3D3D',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: brand.beige,
    },
    submitButton: {
        backgroundColor: brand.orange,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    switchButton: {
        alignItems: 'center',
        marginTop: 8,
    },
    switchButtonText: {
        color: brand.beige,
        fontSize: 14,
        opacity: 0.8,
    },
    socialContainer: {
        marginTop: 48,
        alignItems: 'center',
    },
    dividerText: {
        color: brand.beige,
        opacity: 0.6,
        marginBottom: 16,
    },
    socialButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    kakaoButton: {
        backgroundColor: '#FEE500',
    },
    googleButton: {
        backgroundColor: '#fff',
    },
    appleButton: {
        backgroundColor: '#000',
    },
    socialButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
});
