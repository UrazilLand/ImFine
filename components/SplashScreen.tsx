import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { brand } from '@/constants/Colors';

const { width } = Dimensions.get('window');

/**
 * ImFine 스플래시 스크린
 * 
 * 애니메이션 순서:
 * 1. 필기체 'IF' 등장 (페이드 인 + 스케일)
 * 2. 'IF' → "I'm Fine" 으로 확장
 * 3. 슬로건 등장
 * 4. 메인 화면으로 자동 이동
 */
export default function SplashScreen() {
    const router = useRouter();

    // 애니메이션 값들
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const fullTextOpacity = useRef(new Animated.Value(0)).current;
    const sloganOpacity = useRef(new Animated.Value(0)).current;
    const ifOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // 스플래시 애니메이션 시퀀스
        Animated.sequence([
            // 1. IF 로고 페이드 인 + 스케일 업
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 20,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]),
            // 2. 잠시 대기
            Animated.delay(500),
            // 3. IF 페이드 아웃 + I'm Fine 페이드 인
            Animated.parallel([
                Animated.timing(ifOpacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(fullTextOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            // 4. 슬로건 등장
            Animated.timing(sloganOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            // 5. 잠시 대기 후 메인으로 이동
            Animated.delay(1200),
        ]).start(() => {
            // 애니메이션 완료 후 탭 네비게이션으로 이동
            router.replace('/(tabs)');
        });
    }, []);

    return (
        <View style={styles.container}>
            {/* IF 로고 (필기체 스타일) */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: Animated.multiply(logoOpacity, ifOpacity),
                        transform: [{ scale: logoScale }],
                    },
                ]}
            >
                <Text style={styles.logoText}>IF</Text>
            </Animated.View>

            {/* I'm Fine 전체 텍스트 */}
            <Animated.View
                style={[
                    styles.fullTextContainer,
                    { opacity: fullTextOpacity },
                ]}
            >
                <Text style={styles.fullText}>I'm Fine</Text>
            </Animated.View>

            {/* 슬로건 */}
            <Animated.View
                style={[
                    styles.sloganContainer,
                    { opacity: sloganOpacity },
                ]}
            >
                <Text style={styles.slogan}>
                    만약의 순간을 위한 준비,{'\n'}오늘의 나를 위한 기록
                </Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: brand.charcoal,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        position: 'absolute',
    },
    logoText: {
        fontSize: 120,
        fontWeight: '300',
        fontStyle: 'italic',
        color: brand.orange,
        letterSpacing: -5,
    },
    fullTextContainer: {
        position: 'absolute',
    },
    fullText: {
        fontSize: 56,
        fontWeight: '300',
        fontStyle: 'italic',
        color: brand.beige,
        letterSpacing: 2,
    },
    sloganContainer: {
        position: 'absolute',
        bottom: 120,
        paddingHorizontal: 40,
    },
    slogan: {
        fontSize: 16,
        color: brand.beige,
        textAlign: 'center',
        lineHeight: 26,
        opacity: 0.8,
    },
});
