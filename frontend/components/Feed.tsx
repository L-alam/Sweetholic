import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { PostCard } from './PostCard';
import { ExpandedPost } from './ExpandedPost';
import { getFeed } from '../utils/api';

export function Feed() {
  const [feedMode, setFeedMode] = useState<'friends' | 'public'>('public');
  const [expandedPost, setExpandedPost] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await getFeed(20, 0);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  // Transform backend post format to PostCard format
  const transformPost = (post: any) => {
    // Get rating type from backend format (3_star, 5_star, 10_star)
    const getRatingType = (ratingType: string | null) => {
      if (!ratingType) return '5';
      if (ratingType === '3_star') return '3';
      if (ratingType === '10_star') return '10';
      return '5';
    };

    // Format timestamp
    const getTimeAgo = (timestamp: string) => {
      const now = new Date();
      const postDate = new Date(timestamp);
      const diffMs = now.getTime() - postDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    };

    return {
      id: post.id,
      username: post.user?.username || 'unknown',
      userAvatar: post.user?.profile_photo_url || 'https://via.placeholder.com/100',
      timestamp: getTimeAgo(post.created_at),
      images: post.photos?.map((photo: any) => photo.photo_url) || [],
      caption: post.caption || '',
      location: post.location_name || '',
      address: post.location_name || '',
      rating: post.rating,
      ratingType: getRatingType(post.rating_type) as '3' | '5' | '10',
      reactions: { heart: 0, thumbsUp: 0, starEyes: 0, jealous: 0, sad: 0 }, // Placeholder for now
      // Keep original post data for expanded view
      fullPost: post,
    };
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-add-outline" size={24} color="#000" />
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
            <ActivityIndicator size="large" color="#6ec2f9" />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ice-cream-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share a sweet treat!</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.feed}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#6ec2f9"
              />
            }
          >
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={transformPost(post)}
                onClick={() => setExpandedPost(transformPost(post))}
              />
            ))}
          </ScrollView>
        )}

        {/* Expanded Post Modal */}
        {expandedPost && (
          <ExpandedPost
            post={expandedPost}
            visible={!!expandedPost}
            onClose={() => setExpandedPost(null)}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6ec2f9',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#6ec2f9',
  },
  filterText: {
    fontSize: 14,
    color: '#000',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  feed: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});