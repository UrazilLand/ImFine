import { brand } from '@/constants/Colors';
import type { Post } from '@/lib/feedService';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// 감정별 이모지 매핑
const MOOD_EMOJI: Record<string, string> = {
    HAPPY: '😊',
    EXCITED: '🤩',
    PEACEFUL: '😌',
    GRATEFUL: '🥰',
    TIRED: '😩',
    SAD: '😢',
    ANGRY: '😠',
    ANNOYED: '😤',
    ANXIOUS: '😰',
    LONELY: '🥺',
};

interface PostCardProps {
    post: Post;
    onLike?: (postId: string) => void;
}

/**
 * 피드 카드 컴포넌트
 */
export default function PostCard({ post, onLike }: PostCardProps) {
    const router = useRouter();

    const handlePress = () => {
        router.push(`/post/${post.id}`);
    };

    const handleLike = () => {
        if (onLike) {
            onLike(post.id);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        return date.toLocaleDateString('ko-KR');
    };

    const nickname = post.profiles?.nickname || '익명의 마음';
    const emoji = MOOD_EMOJI[post.mood_tag] || '😐';

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
            {/* 작성자 정보 */}
            <View style={styles.header}>
                <View style={styles.authorInfo}>
                    <Text style={styles.emoji}>{emoji}</Text>
                    <View>
                        <Text style={styles.nickname}>{nickname}</Text>
                        {post.profiles?.is_verified && (
                            <View style={styles.verifiedBadge}>
                                <FontAwesome name="check-circle" size={12} color={brand.gold} />
                                <Text style={styles.verifiedText}>전문가</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Text style={styles.timeAgo}>{formatTimeAgo(post.created_at)}</Text>
            </View>

            {/* 본문 */}
            <Text style={styles.content} numberOfLines={4}>
                {post.content}
            </Text>

            {/* 액션 바 */}
            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    <FontAwesome name="heart-o" size={18} color="#888" />
                    <Text style={styles.actionCount}>{post.like_count || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handlePress}>
                    <FontAwesome name="comment-o" size={18} color="#888" />
                    <Text style={styles.actionCount}>{post.comment_count || 0}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
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
    emoji: {
        fontSize: 32,
        marginRight: 12,
    },
    nickname: {
        fontSize: 14,
        color: brand.beige,
        fontWeight: '500',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    verifiedText: {
        fontSize: 11,
        color: brand.gold,
        marginLeft: 4,
    },
    timeAgo: {
        fontSize: 12,
        color: '#888',
    },
    content: {
        fontSize: 15,
        color: brand.beige,
        lineHeight: 24,
        marginBottom: 16,
    },
    actionBar: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#4D4D4D',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    actionCount: {
        fontSize: 14,
        color: '#888',
        marginLeft: 6,
    },
});
