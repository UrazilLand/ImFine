-- ImFine 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 사용자 테이블 확장 (auth.users와 연동)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  nickname TEXT NOT NULL DEFAULT '익명의 마음',
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'EXPERT', 'ADMIN')),
  subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PREMIUM_A', 'PREMIUM_B')),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  points INTEGER NOT NULL DEFAULT 100,  -- 가입 보너스
  is_verified BOOLEAN DEFAULT FALSE,
  expert_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 오늘의 기분 기록
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood_tag TEXT NOT NULL CHECK (mood_tag IN ('HAPPY', 'EXCITED', 'PEACEFUL', 'GRATEFUL', 'TIRED', 'SAD', 'ANGRY', 'ANNOYED', 'ANXIOUS', 'LONELY')),
  diary TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 익명 피드 게시글
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood_tag TEXT NOT NULL CHECK (mood_tag IN ('HAPPY', 'EXCITED', 'PEACEFUL', 'GRATEFUL', 'TIRED', 'SAD', 'ANGRY', 'ANNOYED', 'ANXIOUS', 'LONELY')),
  content TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT TRUE,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 댓글
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_adopted BOOLEAN DEFAULT FALSE,
  is_expert_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 마음 보관함 메시지
CREATE TABLE IF NOT EXISTS public.heart_box_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_contact TEXT NOT NULL,
  recipient_relation TEXT,
  content_type TEXT NOT NULL DEFAULT 'TEXT' CHECK (content_type IN ('TEXT', 'VIDEO')),
  content TEXT,
  media_path TEXT,
  inactivity_days INTEGER NOT NULL DEFAULT 30,
  send_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'CANCELED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 포인트 트랜잭션
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('EARN_ADOPTION', 'EARN_WELCOME', 'SPEND_CONSULT', 'SPEND_EXPERT', 'CASH_OUT')),
  description TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 좋아요 테이블 (활동 기반 추천용)
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 8. 조회 기록 테이블 (클릭 기반 추천용)
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  view_duration_ms INTEGER DEFAULT 0,  -- 체류 시간 (밀리초)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON public.mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON public.mood_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_mood_tag ON public.feed_posts(mood_tag);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_heart_box_user_id ON public.heart_box_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON public.post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created_at ON public.post_views(created_at DESC);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heart_box_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- 프로필: 본인 것만 수정 가능, 모두 조회 가능
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 피드: 공유된 것은 모두 조회 가능
CREATE POLICY "Shared posts are viewable by everyone" ON public.feed_posts FOR SELECT USING (is_shared = true);
CREATE POLICY "Users can insert own posts" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.feed_posts FOR UPDATE USING (auth.uid() = user_id);

-- 마음 보관함: 본인 것만 접근 가능
CREATE POLICY "Users can view own messages" ON public.heart_box_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.heart_box_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON public.heart_box_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.heart_box_messages FOR DELETE USING (auth.uid() = user_id);

-- 새 사용자 생성 시 자동으로 프로필 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname)
  VALUES (NEW.id, NEW.email, '따뜻한 마음 ' || FLOOR(RANDOM() * 1000)::TEXT);
  
  -- 가입 보너스 포인트 트랜잭션 기록
  INSERT INTO public.point_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 100, 'EARN_WELCOME', '가입 환영 보너스');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 좋아요 카운트 증가 함수
CREATE OR REPLACE FUNCTION public.increment_like_count(target_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.feed_posts
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 좋아요 카운트 감소 함수
CREATE OR REPLACE FUNCTION public.decrement_like_count(target_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.feed_posts
  SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
  WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 댓글 카운트 증가 함수
CREATE OR REPLACE FUNCTION public.increment_comment_count(target_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.feed_posts
  SET comment_count = COALESCE(comment_count, 0) + 1
  WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- post_likes RLS 정책
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- 포인트 증가 함수 (profiles 테이블 업데이트용)
CREATE OR REPLACE FUNCTION public.increment_points(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET points = COALESCE(points, 0) + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- post_views RLS 정책
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own views" ON public.post_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own views" ON public.post_views FOR INSERT WITH CHECK (auth.uid() = user_id);
