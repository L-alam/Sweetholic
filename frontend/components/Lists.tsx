import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { listsAPI, postsAPI } from '../utils/api';
import { ListBuilder } from './ListBuilder';
import { ExpandedList } from './ExpandedList';
import { ExpandedPost } from './ExpandedPost';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - 48) / 3; // 3 images per row with padding

interface List {
  id: string;
  title: string;
  description: string;
  cover_photo_url: string;
  item_count: number;
  is_public: boolean;
  is_ranked: boolean;
  created_at: string;
}

interface Post {
  id: string;
  caption: string;
  location_name: string;
  food_type: string;
  price: number;
  rating: number;
  rating_type: '3' | '5' | '10';
  photos: { photo_url: string }[];
  created_at: string;
}

const DEFAULT_LIST_IMAGE = 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=400&fit=crop';

type ViewMode = 'timeline' | 'lists';

export function Lists() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  
  // Lists data
  const [lists, setLists] = useState<List[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  
  // Timeline data
  const [timelinePosts, setTimelinePosts] = useState<Post[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  
  const [refreshing, setRefreshing] = useState(false);
  const [showListBuilder, setShowListBuilder] = useState(false);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Fetch user's lists
  const fetchLists = async () => {
    if (!user?.username) return;

    try {
      const response = await listsAPI.getUserLists(user.username, 20, 0, user.token);
      if (response.success) {
        const userLists = response.data?.lists || [];
        setLists(userLists);
      }
    } catch (error: any) {
      if (error.message && !error.message.includes('No lists')) {
        console.error('Error fetching lists:', error);
      }
    } finally {
      setLoadingLists(false);
    }
  };

  // Fetch user's posts for timeline
  const fetchTimelinePosts = async () => {
    if (!user?.username) return;

    try {
      const response = await postsAPI.getUserPosts(user.username, 100, 0);
      if (response.success && response.data?.posts) {
        setTimelinePosts(response.data.posts);
      }
    } catch (error: any) {
      console.error('Error fetching timeline posts:', error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    fetchLists();
    fetchTimelinePosts();
  }, [user?.username]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchLists(), fetchTimelinePosts()]).finally(() => {
      setRefreshing(false);
    });
  }, []);

  const renderTimelineGrid = () => {
    if (loadingTimeline) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9562BB" />
        </View>
      );
    }

    if (timelinePosts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No posts yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create your first post to see it here
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {timelinePosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.gridItem}
            onPress={() => setExpandedPostId(post.id)}
          >
            <Image
              source={{ uri: post.photos[0]?.photo_url }}
              style={styles.gridImage}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getListThumbnails = (list: List) => {
    // For now, just use the cover photo
    // In a real implementation, you'd fetch the list's posts
    return [list.cover_photo_url || DEFAULT_LIST_IMAGE];
  };

  const renderListsView = () => {
    if (loadingLists) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9562BB" />
        </View>
      );
    }

    if (lists.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={64} color="#666" />
          <Text style={styles.emptyStateText}>No lists yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create your first list to organize your favorite treats
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.listsContainer}>
        {lists.map((list) => {
          return (
            <TouchableOpacity
              key={list.id}
              style={styles.listCard}
              onPress={() => setExpandedListId(list.id)}
            >
              {/* Photo Thumbnail */}
              <Image
                source={{ uri: list.cover_photo_url || DEFAULT_LIST_IMAGE }}
                style={styles.listThumbnail}
              />

              {/* List Info */}
              <View style={styles.listInfo}>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {list.title}
                  </Text>
                  <View style={styles.listBadges}>
                    {list.is_ranked && (
                      <View style={styles.badge}>
                        <Ionicons name="trophy" size={12} color="#ffd93d" />
                      </View>
                    )}
                    <View style={styles.badge}>
                      <Ionicons 
                        name={list.is_public ? 'globe-outline' : 'lock-closed-outline'} 
                        size={12} 
                        color={list.is_public ? '#4CAF50' : '#999'} 
                      />
                    </View>
                  </View>
                </View>

                {list.description && (
                  <Text style={styles.listDescription} numberOfLines={2}>
                    {list.description}
                  </Text>
                )}

                <Text style={styles.listCount}>
                  {list.item_count} {list.item_count === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Collection</Text>
          {viewMode === 'lists' && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowListBuilder(true)}
            >
              <Ionicons name="add" size={28} color="#FFFCF9" />
            </TouchableOpacity>
          )}
        </View>

        {/* Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'timeline' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('timeline')}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'timeline' && styles.toggleTextActive,
              ]}
            >
              Timeline
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'lists' && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode('lists')}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'lists' && styles.toggleTextActive,
              ]}
            >
              Lists
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#9562BB" 
            />
          }
        >
          {viewMode === 'timeline' ? renderTimelineGrid() : renderListsView()}
        </ScrollView>

        {/* Expanded List Modal */}
        {expandedListId && (
          <ExpandedList
            listId={expandedListId}
            visible={!!expandedListId}
            onClose={() => setExpandedListId(null)}
          />
        )}

        {/* Expanded Post Modal */}
        {expandedPostId && (
          <ExpandedPost
            postId={expandedPostId}
            visible={!!expandedPostId}
            onClose={() => setExpandedPostId(null)}
          />
        )}

        {/* List Builder Modal */}
        <Modal
          visible={showListBuilder}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <ListBuilder
            onComplete={() => {
              setShowListBuilder(false);
              fetchLists();
            }}
            onCancel={() => setShowListBuilder(false)}
          />
        </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9562BB',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9562BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#9562BB',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  toggleTextActive: {
    color: '#FFFCF9',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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

  // Timeline Grid Styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  gridItem: {
    width: IMAGE_SIZE,
    height: (IMAGE_SIZE * 7) / 5, // 5:7 aspect ratio
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },

  // Lists View Styles
  listsContainer: {
    padding: 16,
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    height: 100,
  },
  listThumbnail: {
    width: 80,
    height: '100%',
    backgroundColor: '#000000',
  },
  listInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFCF9',
    flex: 1,
    marginRight: 12,
  },
  listBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 8,
  },
  listCount: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});