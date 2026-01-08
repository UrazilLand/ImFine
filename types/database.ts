/**
 * ImFine 데이터베이스 타입 정의
 * 
 * Supabase 테이블과 1:1 매핑되는 TypeScript 타입들
 */

// 사용자 역할
export type UserRole = 'USER' | 'EXPERT' | 'ADMIN';

// 구독 티어
export type SubscriptionTier = 'FREE' | 'PREMIUM_A' | 'PREMIUM_B';

// 감정 태그
export type MoodTag = 'VERY_HAPPY' | 'HAPPY' | 'NEUTRAL' | 'SAD' | 'VERY_SAD';

// 메시지 상태
export type MessageStatus = 'PENDING' | 'SENT' | 'CANCELED';

// 콘텐츠 타입
export type ContentType = 'TEXT' | 'VIDEO';

// 포인트 트랜잭션 타입
export type PointTransactionType =
    | 'EARN_ADOPTION'      // 채택으로 획득
    | 'EARN_WELCOME'       // 가입 보너스
    | 'SPEND_CONSULT'      // 상담 사용
    | 'SPEND_EXPERT'       // 전문가 상담
    | 'CASH_OUT';          // 환전

/**
 * 사용자 프로필
 */
export interface User {
    id: string;
    email: string;
    nickname: string;
    role: UserRole;
    subscription_tier: SubscriptionTier;
    last_activity_at: string;
    points: number;
    is_verified: boolean;       // 전문가 인증 여부
    expert_category?: string;   // 전문가 분야
    created_at: string;
    updated_at: string;
}

/**
 * 익명 피드 게시글
 */
export interface FeedPost {
    id: string;
    user_id: string;
    mood_tag: MoodTag;
    content: string;
    is_shared: boolean;
    like_count: number;
    comment_count: number;
    created_at: string;
}

/**
 * 댓글
 */
export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    is_adopted: boolean;        // 채택 여부
    is_expert_reply: boolean;   // 전문가 답변 여부
    created_at: string;
}

/**
 * 마음 보관함 메시지 (사후 메시지)
 */
export interface HeartBoxMessage {
    id: string;
    user_id: string;
    recipient_name: string;
    recipient_contact: string;  // 이메일 또는 전화번호
    recipient_relation: string; // 관계 (가족, 친구 등)
    content_type: ContentType;
    content: string;            // 텍스트 내용
    media_path?: string;        // 영상 저장 경로
    inactivity_days: number;    // 미접속 기간 (일)
    send_at?: string;           // 발송 예정일
    status: MessageStatus;
    created_at: string;
    updated_at: string;
}

/**
 * 포인트 트랜잭션
 */
export interface PointTransaction {
    id: string;
    user_id: string;
    amount: number;             // 양수: 획득, 음수: 사용
    type: PointTransactionType;
    description: string;
    related_id?: string;        // 관련 댓글/게시글 ID
    created_at: string;
}

/**
 * 오늘의 기분 기록
 */
export interface MoodEntry {
    id: string;
    user_id: string;
    mood_tag: MoodTag;
    diary?: string;             // 오늘의 한마디
    is_shared: boolean;         // 피드 공유 여부
    created_at: string;
}

// 감정 이모티콘 상수
export const MOOD_EMOJIS: Record<MoodTag, { emoji: string; label: string; color: string }> = {
    VERY_HAPPY: { emoji: '😄', label: '매우 좋음', color: '#FFD93D' },
    HAPPY: { emoji: '😊', label: '좋음', color: '#6BCB77' },
    NEUTRAL: { emoji: '😐', label: '보통', color: '#4D96FF' },
    SAD: { emoji: '😔', label: '나쁨', color: '#A0C4E8' },
    VERY_SAD: { emoji: '😢', label: '매우 나쁨', color: '#9D65C9' },
};

// 전문가 카테고리
export const EXPERT_CATEGORIES = [
    { id: 'psychiatrist', label: '정신건강의학과 전문의' },
    { id: 'psychologist', label: '심리상담사' },
    { id: 'lawyer', label: '변호사' },
    { id: 'counselor', label: '사회복지사' },
] as const;
