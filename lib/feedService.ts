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
 * 게시물 좋아요 토글 (별도 테이블 사용)
 */
export async function toggleLike(postId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        return { liked: false, error: new Error('로그인이 필요합니다.') };
    }

    // 이미 좋아요했는지 확인
    const { data: existing } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userData.user.id)
        .single();

    if (existing) {
        // 좋아요 취소
        await supabase.from('post_likes').delete().eq('id', existing.id);
        await supabase.rpc('decrement_like_count', { target_post_id: postId });
        return { liked: false, error: null };
    } else {
        // 좋아요 추가
        await supabase.from('post_likes').insert({
            post_id: postId,
            user_id: userData.user.id,
        });
        await supabase.rpc('increment_like_count', { target_post_id: postId });
        return { liked: true, error: null };
    }
}

/**
 * 게시물 조회 기록 저장
 */
export async function recordPostView(postId: string, durationMs: number = 0) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return; // 비로그인은 기록 안 함

    await supabase.from('post_views').insert({
        post_id: postId,
        user_id: userData.user.id,
        view_duration_ms: durationMs,
    });
}

/**
 * 고급 추천 피드 조회
 * 
 * 점수 계산:
 * - 오늘의 기분과 동일: 5점
 * - 좋아요한 글의 mood_tag: 3점
 * - 체류시간 5초 이상인 글의 mood_tag: 2점
 * - 클릭한 글의 mood_tag: 1점
 */
export async function fetchRecommendedPosts(options: {
    page?: number;
    limit?: number;
    todayMood?: string;  // 오늘의 기분
} = {}) {
    const { page = 0, limit = 10, todayMood } = options;
    const from = page * limit;
    const to = from + limit - 1;

    const { data: userData } = await supabase.auth.getUser();

    // 비로그인 시 최신순 반환
    if (!userData.user) {
        return fetchPosts({ page, limit });
    }

    // 점수 계산용 객체
    const moodScores: Record<string, number> = {};

    // 1. 오늘의 기분 (가중치 5) - 가장 중요!
    if (todayMood) {
        moodScores[todayMood] = (moodScores[todayMood] || 0) + 5;
    }

    // 2. 좋아요한 글들 (가중치 3)
    const { data: likedPosts } = await supabase
        .from('post_likes')
        .select('post_id, feed_posts!inner(mood_tag)')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(30);

    likedPosts?.forEach((like: any) => {
        const tag = like.feed_posts?.mood_tag;
        if (tag) {
            moodScores[tag] = (moodScores[tag] || 0) + 3;
        }
    });

    // 3. 체류시간 긴 글들 (가중치 2) - 5초 이상만
    const { data: engagedViews } = await supabase
        .from('post_views')
        .select('post_id, view_duration_ms, feed_posts!inner(mood_tag)')
        .eq('user_id', userData.user.id)
        .gte('view_duration_ms', 5000)  // 5초 이상
        .order('view_duration_ms', { ascending: false })
        .limit(30);

    engagedViews?.forEach((view: any) => {
        const tag = view.feed_posts?.mood_tag;
        if (tag) {
            // 체류시간에 따라 추가 점수 (10초당 +1, 최대 +3)
            const bonus = Math.min(Math.floor(view.view_duration_ms / 10000), 3);
            moodScores[tag] = (moodScores[tag] || 0) + 2 + bonus;
        }
    });

    // 4. 단순 클릭한 글들 (가중치 1)
    const { data: clickedPosts } = await supabase
        .from('post_views')
        .select('post_id, feed_posts!inner(mood_tag)')
        .eq('user_id', userData.user.id)
        .lt('view_duration_ms', 5000)  // 5초 미만
        .order('created_at', { ascending: false })
        .limit(50);

    clickedPosts?.forEach((view: any) => {
        const tag = view.feed_posts?.mood_tag;
        if (tag) {
            moodScores[tag] = (moodScores[tag] || 0) + 1;
        }
    });

    // 활동 기록이 없으면 최신순
    if (Object.keys(moodScores).length === 0) {
        return fetchPosts({ page, limit });
    }

    // 상위 5개 mood_tag 선택
    const topMoods = Object.entries(moodScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([mood]) => mood);

    // 해당 mood_tag의 글 우선 조회 + 인기도 가중치
    const { data, error } = await supabase
        .from('feed_posts')
        .select(`
            *,
            profiles:user_id (nickname, is_verified)
        `)
        .eq('is_shared', true)
        .in('mood_tag', topMoods)
        .neq('user_id', userData.user.id) // 내 글 제외
        .order('like_count', { ascending: false }) // 인기순
        .order('created_at', { ascending: false }) // 최신순
        .range(from, to);

    if (error) {
        console.error('추천 피드 조회 오류:', error.message);
        return { posts: [], error };
    }

    return { posts: data as Post[], error: null };
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
