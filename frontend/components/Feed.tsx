import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI } from '../utils/api';
import { PostCard } from './PostCard';

interface Post {
  id: string;
  user: {
    username: string;
    display_name: string;
    profile_photo_url: string;
  };
  caption: string;
  location_name?: string;
  food_type?: string;
  price?: string;
  rating?: number;
  rating_type?: string;
  is_public: boolean;
  created_at: string;
  photos: {
    id: string;
    photo_url: string;
    photo_order: number;
    individual_description?: string;
    individual_rating?: number;
  }[];
  reaction_counts: {
    heart: number;
    thumbs_up: number;
    star_eyes: number;
    jealous: number;
    dislike: number;
  };
  user_reaction?: string | null;
  comment_count: number;
}

export function Feed() {
  const { user } = useAuth();
  const [feedMode, setFeedMode] = useState<'friends' | 'public'>('public');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const LIMIT = 10;

  const fetchPosts = async (isRefresh = false) => {
    try {
      const currentOffset = isRefresh ? 0 : offset;
      const response = await postsAPI.getFeed(LIMIT, currentOffset, user?.token);
      
      if (isRefresh) {
        setPosts(response);
        setOffset(LIMIT);
      } else {
        setPosts(prev => [...prev, ...response]);
        setOffset(currentOffset + LIMIT);
      }
      
      setHasMore(response.length === LIMIT);
    } catch (error: any) {
      console.error('Error fetching posts:', error.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchPosts(true);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts(true);
    setRefreshing(false);
  }, [user]);

  const loadMore = async () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      await fetchPosts(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={{
        id: item.id,
        username: item.user.username,
        displayName: item.user.display_name,
        userAvatar: item.user.profile_photo_url,
        timestamp: formatTimestamp(item.created_at),
        images: item.photos.sort((a, b) => a.photo_order - b.photo_order).map(p => p.photo_url),
        caption: item.caption || '',
        location: item.location_name || '',
        rating: item.rating,
        ratingType: item.rating_type?.replace('_star', '') as '3' | '5' | '10',
        reactions: {
          heart: item.reaction_counts?.heart || 0,
          thumbsUp: item.reaction_counts?.thumbs_up || 0,
          starEyes: item.reaction_counts?.star_eyes || 0,
          jealous: item.reaction_counts?.jealous || 0,
          sad: item.reaction_counts?.dislike || 0,
        },
        userReaction: item.user_reaction,
        commentCount: item.comment_count || 0,
      }}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="images-outline" size={64} color="#666" />
        <Text style={styles.emptyStateText}>No posts yet</Text>
        <Text style={styles.emptyStateSubtext}>
          {feedMode === 'friends' 
            ? 'Follow people to see their posts here' 
            : 'Be the first to share a sweet treat!'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#9562BB" />
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-add-outline" size={24} color="#FFFCF9" />
          </TouchableOpacity>
          
          <Text style={styles.title}>SweetHolic</Text>
          
          <View style={styles.filterButtons}>
            <TouchableOpacity
              onPress={() => setFeedMode('friends')}
              style={[
                styles.filterButton,
                feedMode === 'friends' && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterText,
                feedMode === 'friends' && styles.filterTextActive
              ]}>
                Friends
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setFeedMode('public')}
              style={[
                styles.filterButton,
                feedMode === 'public' && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterText,
                feedMode === 'public' && styles.filterTextActive
              ]}>
                Public
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feed */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9562BB" />
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={item => item.id}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#9562BB"
              />
            }
            contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#000000',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9562BB',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  filterButtonActive: {
    backgroundColor: '#9562BB',
  },
  filterText: {
    fontSize: 14,
    color: '#999',
  },
  filterTextActive: {
    color: '#FFFCF9',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFCF9',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});