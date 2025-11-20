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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { listsAPI } from '../utils/api';
import { ExpandedPost } from './ExpandedPost';

interface Post {
  id: string;
  caption: string;
  location_name: string;
  food_type: string;
  price: number;
  rating: number;
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

  const formatTimestamp = (dateString: string) => {
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
                    <Text style={styles.timestamp}>
                      {formatDate(list.created_at)} · {list.is_public ? 'Public' : 'Private'}
                    </Text>
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
                      <View style={styles.metaItem}>
                        <Ionicons 
                          name={list.is_public ? 'globe-outline' : 'lock-closed-outline'} 
                          size={16} 
                          color="#999" 
                        />
                        <Text style={styles.metaText}>
                          {list.is_public ? 'Public' : 'Private'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Posts List */}
                <View style={styles.postsSection}>
                  <Text style={styles.sectionTitle}>Items in this list</Text>
                  
                  {list.posts.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="images-outline" size={64} color="#666" />
                      <Text style={styles.emptyStateText}>No items yet</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Add posts to this list to see them here
                      </Text>
                    </View>
                  ) : (
                    list.posts.map((post, index) => {
                      const maxRating = parseInt(post.rating_type);
                      return (
                        <TouchableOpacity
                          key={post.id}
                          style={styles.postCard}
                          onPress={() => setExpandedPostId(post.id)}
                        >
                          <View style={styles.postNumber}>
                            <Text style={styles.postNumberText}>{index + 1}</Text>
                          </View>

                          <Image 
                            source={{ uri: post.photos[0]?.photo_url }} 
                            style={styles.postImage} 
                          />

                          <View style={styles.postInfo}>
                            <Text style={styles.postCaption} numberOfLines={2}>
                              {post.caption || post.food_type}
                            </Text>
                            
                            {post.location_name && (
                              <View style={styles.postLocation}>
                                <Ionicons name="location" size={14} color="#999" />
                                <Text style={styles.locationText} numberOfLines={1}>
                                  {post.location_name}
                                </Text>
                              </View>
                            )}

                            <View style={styles.postMeta}>
                              {/* Rating */}
                              <View style={styles.ratingContainer}>
                                {Array.from({ length: maxRating }).map((_, i) => (
                                  <Ionicons
                                    key={i}
                                    name={i < post.rating ? 'star' : 'star-outline'}
                                    size={12}
                                    color={i < post.rating ? '#ffd93d' : '#333'}
                                  />
                                ))}
                                <Text style={styles.ratingText}>
                                  {post.rating}/{post.rating_type}
                                </Text>
                              </View>

                              {/* Price */}
                              {post.price && (
                                <Text style={styles.priceText}>${post.price}</Text>
                              )}
                            </View>

                            <Text style={styles.addedDate}>
                              Added {formatTimestamp(post.added_at)}
                            </Text>
                          </View>

                          <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                      );
                    })
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
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
  coverImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
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
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  postNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9562BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFCF9',
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  postInfo: {
    flex: 1,
  },
  postCaption: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 4,
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#999',
    flex: 1,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  addedDate: {
    fontSize: 11,
    color: '#666',
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