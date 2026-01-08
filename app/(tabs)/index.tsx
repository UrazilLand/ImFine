import MoodModal from '@/components/MoodModal';
import PostCard from '@/components/PostCard';
import { brand } from '@/constants/Colors';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchPosts, Post, toggleLike } from '@/lib/feedService';
import { checkTodayMood, saveMoodEntry } from '@/lib/moodService';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type FilterType = 'ALL' | 'SAME' | 'NEED_COMFORT';

// 위로 필요 기분 태그
const COMFORT_MOODS = ['SAD', 'LONELY', 'ANXIOUS', 'TIRED'];

/**
 * 메인 피드 화면
 * 
 * - Supabase 연동 피드
 * - 무한 스크롤
 * - 비로그인도 열람 가능
 */
export default function FeedScreen() {
  const router = useRouter();
  const { requireAuth } = useAuthGuard();

  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');

  const [showMoodModal, setShowMoodModal] = useState(false);
  const [todayMood, setTodayMood] = useState<string | undefined>();

  // 초기 로딩
  useEffect(() => {
    loadInitialData();
  }, []);

  // 필터 변경 시 재로딩
  useEffect(() => {
    loadPosts(true);
  }, [filter]);

  const loadInitialData = async () => {
    // 오늘 기분 체크
    const { hasRecorded, mood } = await checkTodayMood();
    setTodayMood(mood);

    if (!hasRecorded) {
      setTimeout(() => setShowMoodModal(true), 500);
    }

    // 피드 로딩
    await loadPosts(true);
  };

  const loadPosts = async (refresh = false) => {
    if (refresh) {
      setLoading(true);
      setPage(0);
    }

    const currentPage = refresh ? 0 : page;

    // 필터 처리
    let moodFilter: string | undefined;
    if (filter === 'SAME' && todayMood) {
      moodFilter = todayMood;
    }

    const { posts: newPosts, error } = await fetchPosts({
      page: currentPage,
      limit: 10,
      moodFilter,
    });

    if (error) {
      console.error('피드 로딩 실패:', error);
    } else {
      if (refresh) {
        // 위로 필요 필터 적용
        if (filter === 'NEED_COMFORT') {
          setPosts(newPosts.filter(p => COMFORT_MOODS.includes(p.mood_tag)));
        } else {
          setPosts(newPosts);
        }
      } else {
        if (filter === 'NEED_COMFORT') {
          setPosts(prev => [...prev, ...newPosts.filter(p => COMFORT_MOODS.includes(p.mood_tag))]);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
      }
      setHasMore(newPosts.length === 10);
    }

    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts(true);
  }, [filter, todayMood]);

  const onEndReached = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    setPage(prev => prev + 1);
    await loadPosts(false);
  }, [loadingMore, hasMore, loading, page, filter]);

  const handleMoodSubmit = async (mood: string, diary: string, isShared: boolean) => {
    setShowMoodModal(false);
    setTodayMood(mood);

    await saveMoodEntry({ mood_tag: mood, diary, is_shared: isShared });

    // 공유한 경우 피드 새로고침
    if (isShared) {
      await loadPosts(true);
    }
  };

  const handleWritePress = () => {
    requireAuth(() => {
      router.push('/post/create');
    });
  };

  const handleLike = async (postId: string) => {
    await toggleLike(postId);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, like_count: (p.like_count || 0) + 1 } : p
    ));
  };

  const handleFilterChange = (newFilter: FilterType) => {
    if (filter === newFilter) return;
    setFilter(newFilter);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={brand.orange} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {filter === 'SAME'
            ? '같은 기분의 글이 없어요'
            : filter === 'NEED_COMFORT'
              ? '위로가 필요한 글이 없어요'
              : '아직 글이 없어요'}
        </Text>
        <Text style={styles.emptySubtext}>첫 번째 글을 작성해보세요!</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 필터 탭 */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'ALL' && styles.filterTabActive]}
          onPress={() => handleFilterChange('ALL')}
        >
          <Text style={[styles.filterTabText, filter === 'ALL' && styles.filterTabTextActive]}>
            전체
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'SAME' && styles.filterTabActive]}
          onPress={() => handleFilterChange('SAME')}
        >
          <Text style={[styles.filterTabText, filter === 'SAME' && styles.filterTabTextActive]}>
            같은 기분
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'NEED_COMFORT' && styles.filterTabActive]}
          onPress={() => handleFilterChange('NEED_COMFORT')}
        >
          <Text style={[styles.filterTabText, filter === 'NEED_COMFORT' && styles.filterTabTextActive]}>
            위로 필요
          </Text>
        </TouchableOpacity>
      </View>

      {/* 피드 리스트 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.orange} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} onLike={handleLike} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={brand.orange}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
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
