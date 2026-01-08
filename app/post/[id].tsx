import { brand } from '@/constants/Colors';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import type { Comment, Post } from '@/lib/feedService';
import { createComment, fetchComments, fetchPost, toggleLike } from '@/lib/feedService';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 감정별 이모지 매핑
const MOOD_EMOJI: Record<string, string> = {
    HAPPY: '😊', EXCITED: '🤩', PEACEFUL: '😌', GRATEFUL: '🥰', TIRED: '😩',
    SAD: '😢', ANGRY: '😠', ANNOYED: '😤', ANXIOUS: '😰', LONELY: '🥺',
};

/**
 * 게시물 상세 화면
 */
export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { requireAuth, isAuthenticated } = useAuthGuard();

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        setLoading(true);

        const [postResult, commentsResult] = await Promise.all([
            fetchPost(id),
            fetchComments(id),
        ]);

        setPost(postResult.post);
        setComments(commentsResult.comments);
        setLoading(false);
    };

    const handleLike = async () => {
        if (!post) return;
        await toggleLike(post.id);
        setPost(prev => prev ? { ...prev, like_count: (prev.like_count || 0) + 1 } : null);
    };

    const handleSubmitComment = () => {
        if (!newComment.trim()) return;

        requireAuth(async () => {
            if (!id) return;
            setSubmitting(true);

            const { comment, error } = await createComment(id, newComment.trim());

            if (error) {
                Alert.alert('오류', error.message);
            } else if (comment) {
                setComments(prev => [...prev, comment as Comment]);
                setNewComment('');
                setPost(prev => prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : null);
            }

            setSubmitting(false);
        });
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={brand.orange} />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>게시물을 찾을 수 없습니다.</Text>
            </View>
        );
    }

    const emoji = MOOD_EMOJI[post.mood_tag] || '😐';
    const nickname = post.profiles?.nickname || '익명의 마음';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <FontAwesome name="arrow-left" size={20} color={brand.beige} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>게시물</Text>
                    <View style={{ width: 20 }} />
                </View>

                <ScrollView style={styles.scrollView}>
                    {/* 게시물 본문 */}
                    <View style={styles.postSection}>
                        <View style={styles.authorRow}>
                            <Text style={styles.emoji}>{emoji}</Text>
                            <View>
                                <Text style={styles.nickname}>{nickname}</Text>
                                <Text style={styles.timeAgo}>{formatTimeAgo(post.created_at)}</Text>
                            </View>
                        </View>
                        <Text style={styles.content}>{post.content}</Text>

                        {/* 액션 바 */}
                        <View style={styles.actionBar}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                                <FontAwesome name="heart-o" size={20} color={brand.orange} />
                                <Text style={styles.actionCount}>{post.like_count || 0}</Text>
                            </TouchableOpacity>
                            <View style={styles.actionButton}>
                                <FontAwesome name="comment-o" size={20} color="#888" />
                                <Text style={styles.actionCount}>{post.comment_count || 0}</Text>
                            </View>
                        </View>
                    </View>

                    {/* 댓글 목록 */}
                    <View style={styles.commentsSection}>
                        <Text style={styles.commentsTitle}>댓글 {comments.length}개</Text>
                        {comments.map((comment) => (
                            <View key={comment.id} style={styles.commentItem}>
                                <View style={styles.commentHeader}>
                                    <Text style={styles.commentNickname}>
                                        {comment.profiles?.nickname || '익명'}
                                    </Text>
                                    <Text style={styles.commentTime}>
                                        {formatTimeAgo(comment.created_at)}
                                    </Text>
                                </View>
                                <Text style={styles.commentContent}>{comment.content}</Text>
                            </View>
                        ))}
                        {comments.length === 0 && (
                            <Text style={styles.noComments}>아직 댓글이 없어요. 첫 댓글을 남겨보세요!</Text>
                        )}
                    </View>
                </ScrollView>

                {/* 댓글 입력 */}
                <View style={styles.commentInputContainer}>
                    <TextInput
                        style={styles.commentInput}
                        placeholder={isAuthenticated ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있어요"}
                        placeholderTextColor="#888"
                        value={newComment}
                        onChangeText={setNewComment}
                        editable={isAuthenticated}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
                        onPress={handleSubmitComment}
                        disabled={!newComment.trim() || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <FontAwesome name="send" size={16} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: brand.charcoal,
    },
    keyboardView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: brand.charcoal,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#888',
        fontSize: 16,
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
    scrollView: {
        flex: 1,
    },
    postSection: {
        padding: 16,
        borderBottomWidth: 8,
        borderBottomColor: '#2D2D2D',
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    emoji: {
        fontSize: 40,
        marginRight: 12,
    },
    nickname: {
        fontSize: 16,
        fontWeight: '600',
        color: brand.beige,
    },
    timeAgo: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    content: {
        fontSize: 16,
        color: brand.beige,
        lineHeight: 26,
        marginBottom: 20,
    },
    actionBar: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#3D3D3D',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    actionCount: {
        fontSize: 15,
        color: '#888',
        marginLeft: 8,
    },
    commentsSection: {
        padding: 16,
    },
    commentsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: brand.beige,
        marginBottom: 16,
    },
    commentItem: {
        backgroundColor: '#3D3D3D',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    commentNickname: {
        fontSize: 13,
        fontWeight: '600',
        color: brand.beige,
    },
    commentTime: {
        fontSize: 11,
        color: '#888',
    },
    commentContent: {
        fontSize: 14,
        color: brand.beige,
        lineHeight: 20,
    },
    noComments: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    commentInputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#3D3D3D',
        backgroundColor: brand.charcoal,
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#3D3D3D',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: brand.beige,
        fontSize: 14,
        marginRight: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: brand.orange,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
