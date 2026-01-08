import { fetchPosts, Post, toggleLike } from '@/lib/feedService';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const POSTS_PER_PAGE = 10;

interface UseFeedOptions {
    filter?: 'ALL' | 'SAME' | 'NEED_COMFORT';
    todayMood?: string;
}

const COMFORT_MOODS = ['SAD', 'LONELY', 'ANXIOUS', 'TIRED'];

/**
 * 피드 데이터 캐싱 훅
 * 
 * - 캐시된 데이터 먼저 표시
 * - 백그라운드에서 새 데이터 가져옴
 * - 무한 스크롤 지원
 */
export function useFeed({ filter = 'ALL', todayMood }: UseFeedOptions = {}) {
    const queryClient = useQueryClient();

    // 무한 스크롤 쿼리
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isRefetching,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['posts', filter, todayMood],
        queryFn: async ({ pageParam = 0 }) => {
            // moodFilter 설정
            let moodFilter: string | undefined;
            if (filter === 'SAME' && todayMood) {
                moodFilter = todayMood;
            }

            const { posts, error } = await fetchPosts({
                page: pageParam,
                limit: POSTS_PER_PAGE,
                moodFilter,
            });

            if (error) throw error;
            return posts;
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === POSTS_PER_PAGE ? allPages.length : undefined;
        },
        initialPageParam: 0,
        staleTime: 30000, // 30초 동안 캐시 유효
        gcTime: 5 * 60 * 1000, // 5분 동안 가비지 컬렉션 안 함
    });

    // 모든 페이지의 posts 합치기 + 필터링
    const posts: Post[] = data?.pages.flat() || [];
    const filteredPosts = filter === 'NEED_COMFORT'
        ? posts.filter(p => COMFORT_MOODS.includes(p.mood_tag))
        : posts;

    // 좋아요 Optimistic Update
    const likeMutation = useMutation({
        mutationFn: toggleLike,
        onMutate: async (postId) => {
            // 이전 쿼리 취소
            await queryClient.cancelQueries({ queryKey: ['posts'] });

            // 이전 데이터 스냅샷
            const previousData = queryClient.getQueryData(['posts', filter, todayMood]);

            // Optimistic update
            queryClient.setQueryData(['posts', filter, todayMood], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: Post[]) =>
                        page.map(post =>
                            post.id === postId
                                ? { ...post, like_count: (post.like_count || 0) + 1 }
                                : post
                        )
                    ),
                };
            });

            return { previousData };
        },
        onError: (err, postId, context) => {
            // 에러 시 롤백
            if (context?.previousData) {
                queryClient.setQueryData(['posts', filter, todayMood], context.previousData);
            }
        },
    });

    return {
        posts: filteredPosts,
        isLoading,
        isRefetching,
        isFetchingNextPage,
        hasNextPage: hasNextPage ?? false,
        fetchNextPage,
        refetch,
        handleLike: likeMutation.mutate,
    };
}
