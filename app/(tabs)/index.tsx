import MoodModal from '@/components/MoodModal';
import { brand } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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

// 테스트용 더미 데이터
const DUMMY_POSTS = [
  { id: '1', mood_tag: 'SAD', content: '오늘 하루가 너무 힘들었어요. 아무 이유 없이 눈물이 나네요.', nickname: '따뜻한 마음 123', like_count: 24, comment_count: 8, created_at: new Date().toISOString() },
  { id: '2', mood_tag: 'PEACEFUL', content: '그냥 그런 하루. 특별한 일은 없었지만, 그래도 괜찮아요.', nickname: '평온한 바람 456', like_count: 15, comment_count: 3, created_at: new Date().toISOString() },
  { id: '3', mood_tag: 'HAPPY', content: '오랜만에 친구를 만났어요. 웃다 보니 시간이 훌쩍 지나갔네요 😊', nickname: '밝은 햇살 789', like_count: 42, comment_count: 12, created_at: new Date().toISOString() },
  { id: '4', mood_tag: 'LONELY', content: '혼자라는 게 너무 외로워요. 누군가 제 이야기를 들어줬으면 좋겠어요.', nickname: '조용한 별 012', like_count: 67, comment_count: 28, created_at: new Date().toISOString() },
  { id: '5', mood_tag: 'GRATEFUL', content: '작은 일에도 감사함을 느끼려고 해요. 오늘 맛있는 커피 한 잔의 행복 ☕', nickname: '포근한 구름 345', like_count: 31, comment_count: 5, created_at: new Date().toISOString() },
  { id: '6', mood_tag: 'ANNOYED', content: '사소한 일에도 자꾸 짜증이 나요. 마음을 다잡아야 하는데...', nickname: '흐린 하늘 678', like_count: 18, comment_count: 6, created_at: new Date().toISOString() },
  { id: '7', mood_tag: 'ANXIOUS', content: '내일 있을 면접이 너무 걱정돼요. 잘 할 수 있을까요?', nickname: '떨리는 손 901', like_count: 53, comment_count: 21, created_at: new Date().toISOString() },
];

interface Post {
  id: string;
  mood_tag: string;
  content: string;
  nickname: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

/**
 * 메인 피드 화면
 * 
 * - 익명 사용자들의 기분 공유 글 표시
 * - 비로그인도 열람 가능
 * - 글 작성은 로그인 필요
 */
export default function FeedScreen() {
  const { user } = useAuth();
  const { requireAuth, isAuthenticated } = useAuthGuard();
  const [posts, setPosts] = useState<Post[]>(DUMMY_POSTS);
  const [refreshing, setRefreshing] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [todayMoodRecorded, setTodayMoodRecorded] = useState(false);

  // 앱 진입 시 오늘의 기분 기록 체크
  useEffect(() => {
    checkTodayMood();
  }, []);

  const checkTodayMood = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const mood = await AsyncStorage.getItem(`mood_${today}`);
      const skipped = await AsyncStorage.getItem(`mood_skipped_${today}`);
      if (!mood && !skipped) {
        // 오늘 기록 없음 → 모달 표시
        setTimeout(() => setShowMoodModal(true), 500);
      } else {
        setTodayMoodRecorded(true);
      }
    } catch (e) {
      console.error('기분 체크 실패:', e);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Supabase에서 실제 데이터 가져오기
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleMoodSubmit = async (mood: string, diary: string, isShared: boolean) => {
    setShowMoodModal(false);
    setTodayMoodRecorded(true);

    if (isShared && user) {
      // TODO: Supabase에 저장
      console.log('피드에 공유:', { mood, diary });
    }
  };

  const handleWritePress = () => {
    requireAuth(
      () => {
        // 로그인 된 경우 글 작성 화면으로
        // TODO: 글 작성 화면 구현
        console.log('글 작성 화면으로 이동');
      },
      '글을 작성하려면 로그인이 필요합니다.'
    );
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      {/* 작성자 정보 */}
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <Text style={styles.moodEmoji}>{MOOD_EMOJI[item.mood_tag] || '😐'}</Text>
          <Text style={styles.nickname}>{item.nickname}</Text>
        </View>
        <Text style={styles.timeAgo}>방금 전</Text>
      </View>

      {/* 본문 */}
      <Text style={styles.postContent}>{item.content}</Text>

      {/* 액션 버튼 */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name="heart-o" size={18} color="#888" />
          <Text style={styles.actionCount}>{item.like_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name="comment-o" size={18} color="#888" />
          <Text style={styles.actionCount}>{item.comment_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 필터 탭 */}
      <View style={styles.filterTabs}>
        <TouchableOpacity style={[styles.filterTab, styles.filterTabActive]}>
          <Text style={[styles.filterTabText, styles.filterTabTextActive]}>전체</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterTabText}>같은 기분</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterTabText}>위로 필요</Text>
        </TouchableOpacity>
      </View>

      {/* 피드 리스트 */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brand.orange}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* 글 작성 FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleWritePress}>
        <FontAwesome name="pencil" size={24} color="#fff" />
      </TouchableOpacity>

      {/* 기분 기록 모달 */}
      <MoodModal
        visible={showMoodModal}
        onClose={() => setShowMoodModal(false)}
        onSubmit={handleMoodSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brand.charcoal,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#3D3D3D',
  },
  filterTabActive: {
    backgroundColor: brand.orange,
  },
  filterTabText: {
    fontSize: 14,
    color: '#888',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#3D3D3D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  nickname: {
    fontSize: 14,
    color: brand.beige,
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
    color: '#888',
  },
  postContent: {
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
