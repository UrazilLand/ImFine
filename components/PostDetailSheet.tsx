import { brand } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import type { Comment, Post } from '@/lib/feedService';
import { createComment, fetchComments, fetchPost, recordPostView, toggleLike } from '@/lib/feedService';
import { adoptComment } from '@/lib/pointService';
import { FontAwesome } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// 감정별 이모지 매핑
const MOOD_EMOJI: Record<string, string> = {
    HAPPY: '😊', EXCITED: '🤩', PEACEFUL: '😌', GRATEFUL: '🥰', TIRED: '😩',
    SAD: '😢', ANGRY: '😠', ANNOYED: '😤', ANXIOUS: '😰', LONELY: '🥺',
};

interface PostDetailSheetProps {
    postId: string | null;
    onClose: () => void;
}

export type PostDetailSheetRef = BottomSheet;

/**
 * 게시물 상세 Bottom Sheet
 */
const PostDetailSheet = forwardRef<BottomSheet, PostDetailSheetProps>(
    ({ postId, onClose }, ref) => {
        const { user } = useAuth();
        const [post, setPost] = useState<Post | null>(null);
        const [comments, setComments] = useState<Comment[]>([]);
        const [newComment, setNewComment] = useState('');
        const [loading, setLoading] = useState(true);
        const [submitting, setSubmitting] = useState(false);

        // 조회 시작 시간 기록
        const viewStartTime = useRef<number>(0);

        // Bottom Sheet 스냅 포인트
        const snapPoints = useMemo(() => ['85%'], []);

        // 데이터 로드
        useEffect(() => {
            if (postId) {
                loadData();
                viewStartTime.current = Date.now(); // 조회 시작 시간 기록
            }
        }, [postId]);

        const loadData = async () => {
            if (!postId) return;
            setLoading(true);

            const [postResult, commentsResult] = await Promise.all([
                fetchPost(postId),
                fetchComments(postId),
            ]);

            setPost(postResult.post);
            setComments(commentsResult.comments);
            setLoading(false);

            // 조회 기록 저장 (비동기)
            recordPostView(postId, 0);
        };

        const handleLike = async () => {
            if (!post) return;
            await toggleLike(post.id);
            setPost(prev => prev ? { ...prev, like_count: (prev.like_count || 0) + 1 } : null);
        };

        const handleSubmitComment = async () => {
            if (!newComment.trim() || !postId || !user) return;

            setSubmitting(true);
            const { comment, error } = await createComment(postId, newComment.trim());

            if (!error && comment) {
                setComments(prev => [...prev, comment as Comment]);
                setNewComment('');
                setPost(prev => prev ? { ...prev, comment_count: (prev.comment_count || 0) + 1 } : null);
            }
            setSubmitting(false);
        };

        const handleAdoptComment = async (commentId: string) => {
            if (!postId) return;
            const { success, error } = await adoptComment(commentId, postId);
            if (success) {
                setComments(prev => prev.map(c => c.id === commentId ? { ...c, is_adopted: true } : c));
                alert('댓글이 채택되었습니다! 포인트가 지급되었습니다.');
            } else if (error) {
                alert(error);
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

        // Backdrop 렌더링
        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.6}
                />
            ),
            []
        );

        const handleSheetChanges = useCallback((index: number) => {
            if (index === -1) {
                // 시트가 닫힐 때 체류시간 기록 (현재 시간 - 시작 시간)
                const duration = Date.now() - viewStartTime.current;
                if (postId) {
                    recordPostView(postId, duration);
                }
                onClose();
            }
        }, [onClose, postId]);

        const emoji = post ? MOOD_EMOJI[post.mood_tag] || '😐' : '';
        const nickname = post?.profiles?.nickname || '익명의 마음';

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                onChange={handleSheetChanges}
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={brand.orange} />
                        </View>
                    ) : !post ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.errorText}>게시물을 찾을 수 없습니다.</Text>
                        </View>
                    ) : (
                        <>
                            <BottomSheetScrollView style={styles.scrollView}>
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
                                                <View style={styles.userInfoSide}>
                                                    <Text style={styles.commentNickname}>
                                                        {comment.profiles?.nickname || '익명'}
                                                    </Text>
                                                    {comment.is_adopted && (
                                                        <View style={styles.adoptedBadge}>
                                                            <Text style={styles.adoptedText}>채택됨</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={styles.commentTime}>
                                                    {formatTimeAgo(comment.created_at)}
                                                </Text>
                                            </View>
                                            <Text style={styles.commentContent}>{comment.content}</Text>

                                            {/* 보이기 조건: 내 글 + 채택되지 않은 타인의 댓글 + 로그인 상태 */}
                                            {post.user_id === user?.id && !comment.is_adopted && comment.user_id !== user?.id && (
                                                <TouchableOpacity
                                                    style={styles.adoptButton}
                                                    onPress={() => handleAdoptComment(comment.id)}
                                                >
                                                    <Text style={styles.adoptButtonText}>채택하기</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                    {comments.length === 0 && (
                                        <Text style={styles.noComments}>아직 댓글이 없어요</Text>
                                    )}
                                </View>
                            </BottomSheetScrollView>

                            {/* 댓글 입력 */}
                            <View style={styles.commentInputContainer}>
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder={user ? "댓글을 입력하세요..." : "로그인 후 댓글 작성"}
                                    placeholderTextColor="#888"
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    editable={!!user}
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
                        </>
                    )}
                </KeyboardAvoidingView>
            </BottomSheet>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sheetBackground: {
        backgroundColor: brand.charcoal,
    },
    handleIndicator: {
        backgroundColor: '#666',
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    errorText: {
        color: '#888',
        fontSize: 16,
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
        alignItems: 'center',
        marginBottom: 6,
    },
    userInfoSide: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    adoptedBadge: {
        backgroundColor: brand.orange,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    adoptedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
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
    adoptButton: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(238, 109, 65, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: brand.orange,
        marginTop: 8,
    },
    adoptButtonText: {
        color: brand.orange,
        fontSize: 12,
        fontWeight: '600',
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

export default PostDetailSheet;
