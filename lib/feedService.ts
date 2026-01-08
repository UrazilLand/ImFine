import { supabase } from './supabase';

// 게시물 타입
export interface Post {
    id: string;
    user_id: string;
    mood_tag: string;
    content: string;
    is_shared: boolean;
    like_count: number;
    comment_count: number;
    created_at: string;
    // 조인된 데이터
    profiles?: {
        nickname: string;
        is_verified: boolean;
    };
}

// 댓글 타입
export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    is_adopted: boolean;
    is_expert_reply: boolean;
    created_at: string;
    profiles?: {
        nickname: string;
        is_verified: boolean;
    };
}

/**
 * 피드 목록 조회 (페이지네이션)
 */
export async function fetchPosts(options: {
    page?: number;
    limit?: number;
    moodFilter?: string;
} = {}) {
    const { page = 0, limit = 10, moodFilter } = options;
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('feed_posts')
        .select(`
            *,
            profiles:user_id (nickname, is_verified)
        `)
        .eq('is_shared', true)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (moodFilter && moodFilter !== 'ALL') {
        query = query.eq('mood_tag', moodFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error('피드 조회 오류:', error.message);
        return { posts: [], error };
    }

    return { posts: data as Post[], error: null };
}

/**
 * 단일 게시물 조회
 */
export async function fetchPost(postId: string) {
    const { data, error } = await supabase
        .from('feed_posts')
        .select(`
            *,
            profiles:user_id (nickname, is_verified)
        `)
        .eq('id', postId)
        .single();

    if (error) {
        console.error('게시물 조회 오류:', error.message);
        return { post: null, error };
    }

    return { post: data as Post, error: null };
}

/**
 * 새 게시물 작성
 */
export async function createPost(data: {
    mood_tag: string;
    content: string;
    is_shared?: boolean;
}) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        return { post: null, error: new Error('로그인이 필요합니다.') };
    }

    const { data: post, error } = await supabase
        .from('feed_posts')
        .insert({
            user_id: userData.user.id,
            mood_tag: data.mood_tag,
            content: data.content,
            is_shared: data.is_shared ?? true,
        })
        .select()
        .single();

    if (error) {
        console.error('게시물 작성 오류:', error.message);
        return { post: null, error };
    }

    return { post, error: null };
}

/**
 * 게시물 좋아요 토글
 */
export async function toggleLike(postId: string) {
    // 현재는 간단히 like_count 증가 (실제로는 별도 테이블 필요)
    const { data: post } = await supabase
        .from('feed_posts')
        .select('like_count')
        .eq('id', postId)
        .single();

    if (!post) return { error: new Error('게시물을 찾을 수 없습니다.') };

    const { error } = await supabase
        .from('feed_posts')
        .update({ like_count: (post.like_count || 0) + 1 })
        .eq('id', postId);

    return { error };
}

/**
 * 댓글 목록 조회
 */
export async function fetchComments(postId: string) {
    const { data, error } = await supabase
        .from('comments')
        .select(`
            *,
            profiles:user_id (nickname, is_verified)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('댓글 조회 오류:', error.message);
        return { comments: [], error };
    }

    return { comments: data as Comment[], error: null };
}

/**
 * 댓글 작성
 */
export async function createComment(postId: string, content: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        return { comment: null, error: new Error('로그인이 필요합니다.') };
    }

    const { data: comment, error } = await supabase
        .from('comments')
        .insert({
            post_id: postId,
            user_id: userData.user.id,
            content,
        })
        .select()
        .single();

    if (error) {
        console.error('댓글 작성 오류:', error.message);
        return { comment: null, error };
    }

    // 게시물의 comment_count 증가
    await supabase.rpc('increment_comment_count', { post_id: postId });

    return { comment, error: null };
}
