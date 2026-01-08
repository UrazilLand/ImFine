import { brand } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { deleteHeartMessage, getHeartMessages, HeartMessage } from '@/lib/heartboxService';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

/**
 * 마음 보관함 탭 화면
 */
export default function HeartBoxTabScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [messages, setMessages] = useState<HeartMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                loadMessages();
            } else {
                setLoading(false);
            }
        }, [user])
    );

    const loadMessages = async () => {
        setLoading(true);
        const data = await getHeartMessages();
        setMessages(data);
        setLoading(false);
    };

    const handleDelete = (messageId: string) => {
        Alert.alert(
            '메시지 삭제',
            '정말 이 메시지를 삭제하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        const { success } = await deleteHeartMessage(messageId);
                        if (success) {
                            setMessages(prev => prev.filter(m => m.id !== messageId));
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return { label: '대기 중', color: brand.orange };
            case 'SENT':
                return { label: '전송됨', color: '#4CAF50' };
            case 'CANCELED':
                return { label: '취소됨', color: '#888' };
            default:
                return { label: status, color: '#888' };
        }
    };

    // 비로그인 상태
    if (!user) {
        return (
            <View style={styles.container}>
                <View style={styles.guestContainer}>
                    <FontAwesome name="heart-o" size={64} color="#555" />
                    <Text style={styles.guestTitle}>마음 보관함</Text>
                    <Text style={styles.guestSubtitle}>
                        소중한 사람에게 전할 메시지를{'\n'}미리 작성해두세요.
                    </Text>
                    <Text style={styles.guestNote}>
                        일정 기간 앱에 접속하지 않으면{'\n'}자동으로 전달됩니다.
                    </Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push('/(auth)/login')}
                    >
                        <Text style={styles.loginButtonText}>로그인하고 시작하기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const renderMessage = ({ item }: { item: HeartMessage }) => {
        const statusBadge = getStatusBadge(item.status);

        return (
            <TouchableOpacity
                style={styles.messageCard}
                onPress={() => router.push(`/heartbox/${item.id}`)}
            >
                <View style={styles.messageHeader}>
                    <View style={styles.recipientInfo}>
                        <FontAwesome name="heart" size={18} color={brand.orange} />
                        <Text style={styles.recipientName}>{item.recipient_name}</Text>
                        {item.recipient_relation && (
                            <Text style={styles.recipientRelation}>({item.recipient_relation})</Text>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusBadge.color}20` }]}>
                        <Text style={[styles.statusText, { color: statusBadge.color }]}>
                            {statusBadge.label}
                        </Text>
                    </View>
                </View>

                <Text style={styles.messagePreview} numberOfLines={2}>
                    {item.content || '(내용 없음)'}
                </Text>

                <View style={styles.messageFooter}>
                    <Text style={styles.inactivityDays}>
                        {item.inactivity_days}일 미접속 시 전송
                    </Text>
                    <Text style={styles.createdAt}>{formatDate(item.created_at)}</Text>
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                >
                    <FontAwesome name="trash-o" size={16} color="#888" />
                </TouchableOpacity>
            </TouchableOpacity>
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
        <View style={styles.container}>
            {/* 안내 메시지 */}
            <View style={styles.infoBox}>
                <FontAwesome name="info-circle" size={16} color={brand.gold} />
                <Text style={styles.infoText}>
                    일정 기간 앱에 접속하지 않으면{'\n'}소중한 사람에게 메시지가 전달됩니다
                </Text>
            </View>

            {/* 메시지 목록 */}
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome name="heart-o" size={48} color="#888" />
                        <Text style={styles.emptyText}>아직 작성한 메시지가 없어요</Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push('/heartbox/create')}
                        >
                            <Text style={styles.createButtonText}>첫 메시지 작성하기</Text>
                        </TouchableOpacity>
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />

            {/* FAB */}
            {messages.length > 0 && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push('/heartbox/create')}
                >
                    <FontAwesome name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
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
    guestContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    guestTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: brand.beige,
        marginTop: 20,
    },
    guestSubtitle: {
        fontSize: 15,
        color: '#aaa',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    guestNote: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    loginButton: {
        backgroundColor: brand.orange,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 32,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        padding: 12,
        backgroundColor: `${brand.gold}15`,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${brand.gold}30`,
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        color: brand.beige,
        lineHeight: 20,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
        flexGrow: 1,
    },
    messageCard: {
        backgroundColor: '#3D3D3D',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        position: 'relative',
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recipientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recipientName: {
        fontSize: 16,
        fontWeight: '600',
        color: brand.beige,
        marginLeft: 8,
    },
    recipientRelation: {
        fontSize: 14,
        color: '#888',
        marginLeft: 6,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    messagePreview: {
        fontSize: 14,
        color: '#aaa',
        lineHeight: 20,
        marginBottom: 12,
    },
    messageFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inactivityDays: {
        fontSize: 12,
        color: brand.orange,
    },
    createdAt: {
        fontSize: 12,
        color: '#888',
    },
    deleteButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        marginTop: 16,
        marginBottom: 24,
    },
    createButton: {
        backgroundColor: brand.orange,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: brand.orange,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});
