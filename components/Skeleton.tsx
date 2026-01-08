import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

/**
 * Skeleton 로딩 컴포넌트
 * 애니메이션 펄스 효과로 로딩 상태 표시
 */
export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius, opacity },
                style,
            ]}
        />
    );
}

/**
 * 피드 카드 Skeleton
 */
export function PostCardSkeleton() {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.authorInfo}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <View style={styles.authorText}>
                        <Skeleton width={100} height={14} />
                        <Skeleton width={60} height={12} style={{ marginTop: 6 }} />
                    </View>
                </View>
                <Skeleton width={50} height={12} />
            </View>
            <View style={styles.content}>
                <Skeleton width="100%" height={14} />
                <Skeleton width="90%" height={14} style={{ marginTop: 8 }} />
                <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
            </View>
            <View style={styles.actionBar}>
                <Skeleton width={50} height={18} />
                <Skeleton width={50} height={18} style={{ marginLeft: 24 }} />
            </View>
        </View>
    );
}

/**
 * 피드 Skeleton 리스트
 */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
    return (
        <View style={styles.container}>
            {Array.from({ length: count }).map((_, i) => (
                <PostCardSkeleton key={i} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#4D4D4D',
    },
    container: {
        padding: 16,
    },
    card: {
        backgroundColor: '#3D3D3D',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorText: {
        marginLeft: 12,
    },
    content: {
        marginBottom: 16,
    },
    actionBar: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#4D4D4D',
        paddingTop: 12,
    },
});
