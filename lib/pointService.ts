import { supabase } from './supabase';

// 포인트 트랜잭션 타입
export interface PointTransaction {
    id: string;
    user_id: string;
    amount: number;
    type: 'EARN_ADOPTION' | 'EARN_WELCOME' | 'SPEND_CONSULT' | 'SPEND_EXPERT' | 'CASH_OUT';
    description: string;
    related_id?: string;
    created_at: string;
}

/**
 * 현재 포인트 조회
 */
export async function getPoints(): Promise<number> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 0;

    const { data, error } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userData.user.id)
        .single();

    if (error) {
        console.error('포인트 조회 오류:', error.message);
        return 0;
    }

    return data?.points || 0;
}

/**
 * 포인트 내역 조회
 */
export async function getPointHistory(limit = 20): Promise<PointTransaction[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('포인트 내역 조회 오류:', error.message);
        return [];
    }

    return data as PointTransaction[];
}

/**
 * 댓글 채택 (포인트 이동)
 */
export async function adoptComment(commentId: string, postId: string): Promise<{ success: boolean; error?: string }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        return { success: false, error: '로그인이 필요합니다.' };
    }

    // 1. 게시물 작성자 확인
    const { data: post } = await supabase
        .from('feed_posts')
        .select('user_id')
        .eq('id', postId)
        .single();

    if (!post || post.user_id !== userData.user.id) {
        return { success: false, error: '본인 게시물의 댓글만 채택할 수 있습니다.' };
    }

    // 2. 댓글 정보 조회
    const { data: comment } = await supabase
        .from('comments')
        .select('user_id, is_adopted')
        .eq('id', commentId)
        .single();

    if (!comment) {
        return { success: false, error: '댓글을 찾을 수 없습니다.' };
    }

    if (comment.is_adopted) {
        return { success: false, error: '이미 채택된 댓글입니다.' };
    }

    if (comment.user_id === userData.user.id) {
        return { success: false, error: '본인 댓글은 채택할 수 없습니다.' };
    }

    // 3. 댓글 채택 상태 업데이트
    const { error: updateError } = await supabase
        .from('comments')
        .update({ is_adopted: true })
        .eq('id', commentId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    // 4. 댓글 작성자에게 포인트 지급 (10포인트)
    const { error: pointError } = await supabase
        .from('profiles')
        .update({ points: supabase.rpc('increment_points', { user_id: comment.user_id, amount: 10 }) })
        .eq('id', comment.user_id);

    // 5. 포인트 트랜잭션 기록
    await supabase.from('point_transactions').insert({
        user_id: comment.user_id,
        amount: 10,
        type: 'EARN_ADOPTION',
        description: '댓글 채택 보상',
        related_id: commentId,
    });

    return { success: true };
}

/**
 * 포인트 증가 RPC (서버 사이드)
 * Supabase에서 이 함수를 추가해야 합니다
 */
