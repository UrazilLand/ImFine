import { brand } from '@/constants/Colors';
import { getPointHistory, getPoints, PointTransaction } from '@/lib/pointService';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 트랜잭션 타입별 라벨
const TYPE_LABELS: Record<string, { label: string; color: string; prefix: string }> = {
    EARN_ADOPTION: { label: '댓글 채택', color: '#4CAF50', prefix: '+' },
    EARN_WELCOME: { label: '가입 보너스', color: '#4CAF50', prefix: '+' },
    SPEND_CONSULT: { label: '상담 이용', color: '#F44336', prefix: '-' },
    SPEND_EXPERT: { label: '전문가 답변', color: '#F44336', prefix: '-' },
    CASH_OUT: { label: '포인트 환전', color: '#FF9800', prefix: '-' },
};

/**
 * 포인트 잔액 및 내역 화면
 */
export default function PointsScreen() {
    const router = useRouter();
    const [points, setPoints] = useState<number>(0);
    const [history, setHistory] = useState<PointTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [pts, hist] = await Promise.all([getPoints(), getPointHistory()]);
        setPoints(pts);
        setHistory(hist);
        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderTransaction = ({ item }: { item: PointTransaction }) => {
        const typeInfo = TYPE_LABELS[item.type] || { label: '기타', color: '#888', prefix: '' };

        return (
            <View style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                    <Text style={styles.transactionLabel}>{typeInfo.label}</Text>
                    <Text style={styles.transactionDesc}>{item.description}</Text>
                    <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: typeInfo.color }]}>
                    {typeInfo.prefix}{Math.abs(item.amount)}P
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={brand.orange} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <FontAwesome name="arrow-left" size={20} color={brand.beige} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>내 포인트</Text>
                <View style={{ width: 20 }} />
            </View>

            {/* 포인트 잔액 */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>현재 보유 포인트</Text>
                <View style={styles.balanceRow}>
                    <FontAwesome name="star" size={28} color={brand.gold} />
                    <Text style={styles.balanceAmount}>{points.toLocaleString()}</Text>
                    <Text style={styles.balanceUnit}>P</Text>
                </View>
            </View>

            {/* 포인트 내역 */}
            <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>포인트 내역</Text>
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTransaction}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>아직 포인트 내역이 없어요</Text>
                    }
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: brand.charcoal,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: brand.charcoal,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#3D3D3D',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: brand.beige,
    },
    balanceCard: {
        margin: 16,
        padding: 24,
        backgroundColor: '#3D3D3D',
        borderRadius: 16,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 12,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '700',
        color: brand.beige,
        marginLeft: 12,
    },
    balanceUnit: {
        fontSize: 24,
        fontWeight: '500',
        color: '#888',
        marginLeft: 4,
    },
    historySection: {
        flex: 1,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: brand.beige,
        marginBottom: 12,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#3D3D3D',
    },
    transactionLeft: {
        flex: 1,
    },
    transactionLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: brand.beige,
    },
    transactionDesc: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    transactionDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
    },
    emptyText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 40,
    },
});
