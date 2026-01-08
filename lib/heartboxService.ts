import { supabase } from './supabase';

// 마음함 메시지 타입
export interface HeartMessage {
    id: string;
    user_id: string;
    recipient_name: string;
    recipient_contact: string;
    recipient_relation?: string;
    content_type: 'TEXT' | 'VIDEO';
    content?: string;
    media_path?: string;
    inactivity_days: number;
    send_at?: string;
    status: 'PENDING' | 'SENT' | 'CANCELED';
    created_at: string;
    updated_at: string;
}

/**
 * 마음함 메시지 목록 조회
 */
export async function getHeartMessages(): Promise<HeartMessage[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
        .from('heart_box_messages')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('마음함 조회 오류:', error.message);
        return [];
    }

    return data as HeartMessage[];
}

/**
 * 마음함 메시지 생성
 */
export async function createHeartMessage(data: {
    recipient_name: string;
    recipient_contact: string;
    recipient_relation?: string;
    content: string;
    inactivity_days?: number;
}): Promise<{ message: HeartMessage | null; error?: string }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        return { message: null, error: '로그인이 필요합니다.' };
    }

    const { data: message, error } = await supabase
        .from('heart_box_messages')
        .insert({
            user_id: userData.user.id,
            recipient_name: data.recipient_name,
            recipient_contact: data.recipient_contact,
            recipient_relation: data.recipient_relation,
            content_type: 'TEXT',
            content: data.content,
            inactivity_days: data.inactivity_days || 30,
        })
        .select()
        .single();

    if (error) {
        console.error('마음함 생성 오류:', error.message);
        return { message: null, error: error.message };
    }

    return { message: message as HeartMessage };
}

/**
 * 마음함 메시지 수정
 */
export async function updateHeartMessage(
    messageId: string,
    updates: Partial<Pick<HeartMessage, 'recipient_name' | 'recipient_contact' | 'recipient_relation' | 'content' | 'inactivity_days'>>
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('heart_box_messages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', messageId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * 마음함 메시지 삭제
 */
export async function deleteHeartMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('heart_box_messages')
        .delete()
        .eq('id', messageId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * 마음함 메시지 취소
 */
export async function cancelHeartMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('heart_box_messages')
        .update({ status: 'CANCELED', updated_at: new Date().toISOString() })
        .eq('id', messageId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
