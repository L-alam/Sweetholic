import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { listsAPI } from '../utils/api';
import { ExpandedPost } from './ExpandedPost';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - 48) / 3; // 3 images per row with padding

interface Post {
  id: string;
  caption: string;
  location_name: string;
  food_type: string;
  rating_type: '3' | '5' | '10';
  created_at: string;
  photos: { 
    id: string;
    photo_url: string;
    photo_order: number;
  }[];
  item_order: number;
  added_at: string;
}

interface ListDetails {
  id: string;
  title: string;
  description: string;
  cover_photo_url: string;
  is_public: boolean;
  is_ranked: boolean;
  created_at: string;
  item_count: number;
  user: {
    username: string;
    display_name: string;
    profile_photo_url: string;
  };
  posts: Post[];
}

interface ExpandedListProps {
  listId: string;
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_PROFILE_IMAGE = 'https://ui-avatars.com/api/?name=User&background=9562BB&color=FFFCF9&size=200';

export function ExpandedList({ listId, visible, onClose }: ExpandedListProps) {
  const { user } = useAuth();
  const [list, setList] = useState<ListDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && listId) {
      fetchList();
    }
  }, [visible, listId]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await listsAPI.getList(listId, user?.token);
      if (response.success && response.data.list) {
        setList(response.data.list);
      } else {
        Alert.alert('Error', 'Failed to load list');
        onClose();
      }
    } catch (error: any) {
      console.error('Error fetching list:', error);
      Alert.alert('Error', 'Failed to load list');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top']}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9562BB" />
            </View>
          ) : list ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Image 
                    source={{ uri: list.user.profile_photo_url || DEFAULT_PROFILE_IMAGE }} 
                    style={styles.avatar} 
                  />
                  <View>
                    <Text style={styles.username}>{list.user.display_name}</Text>
                    <View style={styles.headerMeta}>
                      <Text style={styles.timestamp}>
                        {formatDate(list.created_at)}
                      </Text>
                      <View style={styles.metaBadges}>
                        {list.is_ranked && (
                          <View style={styles.headerBadge}>
                            <Ionicons name="trophy" size={12} color="#ffd93d" />
                          </View>
                        )}
                        <View style={styles.headerBadge}>
                          <Ionicons 
                            name={list.is_public ? 'globe-outline' : 'lock-closed-outline'} 
                            size={12} 
                            color={list.is_public ? '#4CAF50' : '#999'} 
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={28} color="#FFFCF9" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* List Header Info */}
                <View style={styles.listHeader}>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{list.title}</Text>
                    {list.description && (
                      <Text style={styles.listDescription}>{list.description}</Text>
                    )}
                    <View style={styles.listMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="list" size={16} color="#999" />
                        <Text style={styles.metaText}>{list.item_count} items</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Posts Grid */}
                <View style={styles.postsSection}>
                  <Text style={styles.sectionTitle}>
                    {list.is_ranked ? 'Ranked Items' : 'Items in this list'}
                  </Text>
                  
                  {list.posts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="images-outline" size={64} color="#666" />
                      <Text style={styles.emptyStateText}>No items yet</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Add posts to this list to see them here
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.gridContainer}>
                      {list.posts.map((post, index) => (
                        <TouchableOpacity
                          key={post.id}
                          style={styles.gridItem}
                          onPress={() => setExpandedPostId(post.id)}
                        >
                          <Image
                            source={{ uri: post.photos[0]?.photo_url }}
                            style={styles.gridImage}
                          />
                          {list.is_ranked && (
                            <View style={styles.rankBadge}>
                              <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Share Section */}
                {list.posts.length > 0 && (
                  <View style={styles.shareSection}>
                    <TouchableOpacity 
                      style={styles.shareButton}
                      onPress={() => Alert.alert('Coming Soon', 'List sharing feature coming soon!')}
                    >
                      <Ionicons name="share-outline" size={20} color="#FFFCF9" />
                      <Text style={styles.shareButtonText}>Share This List</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </>
          ) : null}

          {/* Expanded Post Modal */}
          {expandedPostId && (
            <ExpandedPost
              postId={expandedPostId}
              visible={!!expandedPostId}
              onClose={() => setExpandedPostId(null)}
            />
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#9562BB',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  metaBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  listInfo: {
    padding: 16,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFCF9',
    marginBottom: 8,
  },
  listDescription: {
    fontSize: 15,
    color: '#FFFCF9',
    lineHeight: 22,
    marginBottom: 12,
  },
  listMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#999',
  },
  postsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFCF9',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridItem: {
    width: IMAGE_SIZE,
    height: (IMAGE_SIZE * 7) / 5, // 5:7 aspect ratio
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9562BB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFCF9',
  },
  shareSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9562BB',
    paddingVertical: 16,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
  },
});