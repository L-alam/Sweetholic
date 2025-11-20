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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { listsAPI } from '../utils/api';
import { ListBuilder } from './ListBuilder';

interface List {
  id: string;
  title: string;  // Backend returns 'title' not 'name'
  description: string;
  cover_photo_url: string;
  item_count: number;
  is_public: boolean;
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

export function Lists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<List[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [listPosts, setListPosts] = useState<Post[]>([]);
  const [sortBy, setSortBy] = useState<'rating' | 'item' | 'recent'>('recent');
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showListBuilder, setShowListBuilder] = useState(false);

  // Fetch user's lists
  const fetchLists = async () => {
    if (!user?.username) return;

    try {
      // Pass token to see private lists when viewing own profile
      const response = await listsAPI.getUserLists(user.username, 20, 0, user.token);
      if (response.success) {
        // Handle empty lists array - this is normal, not an error
        const userLists = response.data?.lists || [];
        setLists(userLists);
        // Auto-select first list if available
        if (userLists.length > 0 && !selectedList) {
          setSelectedList(userLists[0].id);
        }
      }
    } catch (error: any) {
      // Only log/alert for actual errors, not empty results
      if (error.message && !error.message.includes('No lists')) {
        console.error('Error fetching lists:', error);
        // Don't show alert for empty lists
        if (error.message !== 'Server error fetching user lists') {
          Alert.alert('Error', 'Failed to load lists');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch posts for selected list
  const fetchListPosts = async (listId: string) => {
    if (!user?.token) return;

    setLoadingPosts(true);
    try {
      const response = await listsAPI.getList(listId, user.token);
      if (response.success && response.data.list.posts) {
        setListPosts(response.data.list.posts);
      }
    } catch (error: any) {
      console.error('Error fetching list posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [user?.username]);

  useEffect(() => {
    if (selectedList) {
      fetchListPosts(selectedList);
    }
  }, [selectedList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLists();
  }, []);

  const handleListSelect = (listId: string) => {
    setSelectedList(listId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const sortPosts = (posts: Post[]) => {
    const sorted = [...posts];
    switch (sortBy) {
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'item':
        return sorted.sort((a, b) => (a.caption || '').localeCompare(b.caption || ''));
      case 'recent':
      default:
        return sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9562BB" />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Lists</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowListBuilder(true)}
          >
            <Ionicons name="add" size={28} color="#FFFCF9" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9562BB" />
          }
        >
          {lists.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={64} color="#666" />
              <Text style={styles.emptyStateText}>No lists yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create your first list to organize your favorite treats
              </Text>
            </View>
          ) : (
            <>
              {/* Lists Carousel */}
              <View style={styles.listsSection}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.listsCarousel}
                >
                  {lists.map((list) => (
                    <TouchableOpacity
                      key={list.id}
                      onPress={() => handleListSelect(list.id)}
                      style={styles.listCard}
                    >
                      <View style={[
                        styles.listImageContainer,
                        selectedList === list.id && styles.listImageContainerActive
                      ]}>
                        <Image 
                          source={{ uri: list.cover_photo_url || DEFAULT_LIST_IMAGE }} 
                          style={styles.listImage} 
                        />
                      </View>
                      <Text style={[
                        styles.listName,
                        selectedList === list.id && styles.listNameActive
                      ]} numberOfLines={2}>
                        {list.title}
                      </Text>
                      <Text style={styles.listCount}>{list.item_count} items</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Sort Options */}
              <View style={styles.sortSection}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <View style={styles.sortPicker}>
                  <TouchableOpacity 
                    style={styles.sortButton}
                    onPress={() => {
                      const options: Array<'rating' | 'item' | 'recent'> = ['rating', 'item', 'recent'];
                      const currentIndex = options.indexOf(sortBy);
                      const nextIndex = (currentIndex + 1) % options.length;
                      setSortBy(options[nextIndex]);
                    }}
                  >
                    <Text style={styles.sortText}>
                      {sortBy === 'recent' ? 'Recent' : sortBy === 'rating' ? 'Rating' : 'Item Name'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Timeline */}
              {loadingPosts ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#9562BB" />
                </View>
              ) : listPosts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="image-outline" size={48} color="#666" />
                  <Text style={styles.emptyStateSubtext}>
                    No posts in this list yet
                  </Text>
                </View>
              ) : (
                <View style={styles.timelineSection}>
                  {sortPosts(listPosts).map((post) => {
                    const maxRating = parseInt(post.rating_type);
                    return (
                      <TouchableOpacity key={post.id} style={styles.timelineItem}>
                        <View style={styles.timelineContent}>
                          <View style={styles.timelineInfo}>
                            <Text style={styles.itemName}>{post.caption || post.food_type}</Text>
                            <Text style={styles.itemLocation}>{post.location_name}</Text>
                            {post.caption && post.caption !== post.food_type && (
                              <Text style={styles.itemCaption}>{post.food_type}</Text>
                            )}
                            
                            {/* Rating Stars */}
                            <View style={styles.ratingContainer}>
                              {Array.from({ length: maxRating }).map((_, index) => (
                                <Ionicons
                                  key={index}
                                  name={index < post.rating ? 'star' : 'star-outline'}
                                  size={14}
                                  color={index < post.rating ? '#ffd93d' : '#333'}
                                />
                              ))}
                              <Text style={styles.ratingText}>
                                {post.rating}/{post.rating_type}
                              </Text>
                            </View>
                            
                            <Text style={styles.itemDate}>{formatDate(post.created_at)}</Text>
                          </View>
                          
                          {post.photos && post.photos.length > 0 && (
                            <Image 
                              source={{ uri: post.photos[0].photo_url }} 
                              style={styles.timelineImage} 
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Share List Button */}
        {lists.length > 0 && selectedList && (
          <View style={styles.bottomButton}>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={() => Alert.alert('Coming Soon', 'List sharing feature coming soon!')}
            >
              <Text style={styles.shareButtonText}>Share List</Text>
            </TouchableOpacity>
          </View>
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
              fetchLists(); // Refresh lists after creating
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
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
  listsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  listsCarousel: {
    paddingHorizontal: 16,
    gap: 12,
  },
  listCard: {
    width: 128,
  },
  listImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  listImageContainerActive: {
    borderColor: '#9562BB',
  },
  listImage: {
    width: '100%',
    aspectRatio: 1,
  },
  listName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
    color: '#FFFCF9',
  },
  listNameActive: {
    fontWeight: '700',
    color: '#9562BB',
  },
  listCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  sortSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  sortLabel: {
    fontSize: 14,
    color: '#999',
  },
  sortPicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  sortText: {
    fontSize: 14,
    color: '#FFFCF9',
  },
  timelineSection: {
    padding: 16,
    gap: 12,
  },
  timelineItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
  },
  timelineContent: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  itemCaption: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
  timelineImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
  },
  bottomButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#000000',
  },
  shareButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#9562BB',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
  },
});