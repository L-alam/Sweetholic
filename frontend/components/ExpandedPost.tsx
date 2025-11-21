import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI, reactionsAPI, commentsAPI } from '../utils/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Comment {
  id: string;
  user: {
    username: string;
    display_name: string;
    profile_photo_url: string;
  };
  content: string;
  created_at: string;
}

interface FoodItem {
  id: string;
  item_name: string;
  price: number;
  rating: number;
  item_order: number;
}

interface ExpandedPostProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
}

export function ExpandedPost({ postId, visible, onClose }: ExpandedPostProps) {
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState({
    heart: 0,
    thumbsUp: 0,
    starEyes: 0,
    jealous: 0,
    sad: 0,
  });
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const reactions = [
    { id: 'heart', icon: 'heart', apiType: 'heart' as const, color: '#FF6978' },
    { id: 'thumbsUp', icon: 'thumbs-up', apiType: 'thumbs_up' as const, color: '#9562BB' },
    { id: 'starEyes', icon: 'star', apiType: 'star_eyes' as const, color: '#ffd93d' },
    { id: 'jealous', icon: 'sad', apiType: 'jealous' as const, color: '#B1EDE8' },
    { id: 'sad', icon: 'thumbs-down', apiType: 'dislike' as const, color: '#666' },
  ];

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getPost(postId, user?.token);
      if (response.success) {
        setPost(response.data.post);
        setReactionCounts({
          heart: response.data.post.reaction_counts?.heart || 0,
          thumbsUp: response.data.post.reaction_counts?.thumbs_up || 0,
          starEyes: response.data.post.reaction_counts?.star_eyes || 0,
          jealous: response.data.post.reaction_counts?.jealous || 0,
          sad: response.data.post.reaction_counts?.dislike || 0,
        });
        setSelectedReaction(response.data.post.user_reaction);
      }
    } catch (error: any) {
      console.error('Error loading post:', error.message);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentsAPI.getPostComments(postId, 50, 0);
      if (response.success) {
        setComments(response.data.comments);
      }
    } catch (error: any) {
      console.error('Error loading comments:', error.message);
    }
  };

  useEffect(() => {
    if (visible && postId) {
      loadPost();
      loadComments();
    }
  }, [visible, postId]);

  const handleReaction = async (reactionType: typeof reactions[0]['apiType'], reactionId: string) => {
    if (!user?.token) return;

    const wasSelected = selectedReaction === reactionId;
    const previousReaction = selectedReaction;
    const previousCounts = { ...reactionCounts };

    // Optimistic update
    if (wasSelected) {
      setSelectedReaction(null);
      setReactionCounts(prev => ({
        ...prev,
        [reactionId]: Math.max(0, prev[reactionId as keyof typeof prev] - 1),
      }));
    } else {
      setSelectedReaction(reactionId);
      const newCounts = { ...reactionCounts };
      
      if (previousReaction) {
        newCounts[previousReaction as keyof typeof newCounts] = Math.max(
          0,
          newCounts[previousReaction as keyof typeof newCounts] - 1
        );
      }
      
      newCounts[reactionId as keyof typeof newCounts] += 1;
      setReactionCounts(newCounts);
    }

    try {
      if (previousReaction && !wasSelected) {
        const prevReactionType = reactions.find(r => r.id === previousReaction)?.apiType;
        if (prevReactionType) {
          await reactionsAPI.removeReaction(user.token, postId, prevReactionType);
        }
      }

      if (wasSelected) {
        await reactionsAPI.removeReaction(user.token, postId, reactionType);
      } else {
        await reactionsAPI.addReaction(user.token, postId, reactionType);
      }
    } catch (error: any) {
      console.error('Error updating reaction:', error.message);
      setSelectedReaction(previousReaction);
      setReactionCounts(previousCounts);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !user?.token || sendingComment) return;

    setSendingComment(true);
    try {
      const response = await commentsAPI.createComment(user.token, postId, commentText.trim());
      if (response.success) {
        setComments(prev => [...prev, response.data.comment]);
        setCommentText('');
      }
    } catch (error: any) {
      console.error('Error sending comment:', error.message);
      Alert.alert('Error', 'Failed to send comment');
    } finally {
      setSendingComment(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const commentDate = new Date(timestamp);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return commentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentImageIndex && index >= 0 && index < post?.photos?.length) {
      setCurrentImageIndex(index);
    }
  };

  const renderStars = (rating: number, ratingType: string) => {
    const maxRating = parseInt(ratingType.replace('_star', ''));
    return Array.from({ length: maxRating }).map((_, index) => (
      <Ionicons
        key={index}
        name="star"
        size={16}
        color={index < rating ? '#ffd93d' : '#333'}
      />
    ));
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top']}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {post && (
                  <>
                    <Image 
                      source={{ 
                        uri: post.user.profile_photo_url || 'https://ui-avatars.com/api/?name=' + post.user.username 
                      }} 
                      style={styles.avatar} 
                    />
                    <View>
                      <Text style={styles.username}>{post.user.display_name}</Text>
                      <Text style={styles.timestamp}>
                        {formatTimestamp(post.created_at)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#FFFCF9" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9562BB" />
              </View>
            ) : post ? (
              <>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                  {/* Swipeable Image Carousel */}
                  <View style={styles.imageSection}>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onScroll={handleScroll}
                      scrollEventThrottle={16}
                    >
                      {post.photos.map((photo: any, index: number) => (
                        <Image 
                          key={photo.id}
                          source={{ uri: photo.photo_url }} 
                          style={styles.image}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                    
                    {/* Image Indicators */}
                    {post.photos.length > 1 && (
                      <View style={styles.imageIndicators}>
                        {post.photos.map((_: any, index: number) => (
                          <View
                            key={index}
                            style={[
                              styles.indicator,
                              { 
                                backgroundColor: index === currentImageIndex 
                                  ? '#9562BB' 
                                  : 'rgba(255, 255, 255, 0.5)' 
                              }
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.content}>
                    {/* Caption */}
                    <View style={styles.section}>
                      <Text style={styles.caption}>{post.caption}</Text>
                    </View>

                    {/* Food Items - Compact Cards */}
                    {post.food_items && post.food_items.length > 0 && (
                      <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Items Ordered</Text>
                        <View style={styles.foodItemsGrid}>
                          {post.food_items
                            .sort((a: FoodItem, b: FoodItem) => a.item_order - b.item_order)
                            .map((item: FoodItem) => (
                              <View key={item.id} style={styles.foodItemCard}>
                                <View style={styles.foodItemRow}>
                                  <Text style={styles.foodItemName} numberOfLines={1}>
                                    {item.item_name}
                                  </Text>
                                    {item.price > 0 && (
                                      <Text style={styles.foodItemPrice}>
                                        ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}
                                      </Text>
                                    )}
                                </View>
                                {item.rating > 0 && post.rating_type && (
                                  <View style={styles.foodItemRating}>
                                    {renderStars(item.rating, post.rating_type)}
                                  </View>
                                )}
                              </View>
                            ))}
                        </View>
                      </View>
                    )}

                    {/* Location */}
                    {post.location_name && (
                      <View style={styles.locationCard}>
                        <Ionicons name="location" size={20} color="#9562BB" />
                        <View style={styles.locationInfo}>
                          <Text style={styles.locationName}>{post.location_name}</Text>
                          {post.food_type && (
                            <Text style={styles.locationAddress}>{post.food_type}</Text>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Reactions */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>React to this post</Text>
                      <View style={styles.reactionsContainer}>
                        {reactions.map((reaction) => {
                          const isSelected = selectedReaction === reaction.id;
                          const count = reactionCounts[reaction.id as keyof typeof reactionCounts];
                          
                          return (
                            <TouchableOpacity
                              key={reaction.id}
                              onPress={() => handleReaction(reaction.apiType, reaction.id)}
                              style={[
                                styles.reactionButton,
                                {
                                  backgroundColor: isSelected ? `${reaction.color}30` : '#1a1a1a',
                                  borderColor: isSelected ? reaction.color : 'transparent',
                                  borderWidth: 1,
                                }
                              ]}
                            >
                              <Ionicons
                                name={reaction.icon as any}
                                size={20}
                                color={isSelected ? reaction.color : '#666'}
                              />
                              <Text style={[
                                styles.reactionCount,
                                { color: isSelected ? reaction.color : '#999' }
                              ]}>
                                {count}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Comments */}
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        Comments ({comments.length})
                      </Text>
                      <View style={styles.commentsContainer}>
                        {comments.length === 0 ? (
                          <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                        ) : (
                          comments.map((comment) => (
                            <View key={comment.id} style={styles.commentItem}>
                              <Image 
                                source={{ 
                                  uri: comment.user.profile_photo_url || 'https://ui-avatars.com/api/?name=' + comment.user.username 
                                }} 
                                style={styles.commentAvatar} 
                              />
                              <View style={styles.commentContent}>
                                <View style={styles.commentBubble}>
                                  <Text style={styles.commentUsername}>
                                    {comment.user.display_name}
                                  </Text>
                                  <Text style={styles.commentText}>{comment.content}</Text>
                                </View>
                                <Text style={styles.commentTimestamp}>
                                  {formatTimestamp(comment.created_at)}
                                </Text>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Comment Input */}
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholderTextColor="#666"
                    multiline
                    maxLength={1000}
                  />
                  <TouchableOpacity 
                    style={[
                      styles.sendButton,
                      (!commentText.trim() || sendingComment) && styles.sendButtonDisabled
                    ]}
                    onPress={handleSendComment}
                    disabled={!commentText.trim() || sendingComment}
                  >
                    {sendingComment ? (
                      <ActivityIndicator size="small" color="#FFFCF9" />
                    ) : (
                      <Ionicons name="send" size={20} color="#FFFCF9" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </KeyboardAvoidingView>
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
  imageSection: {
    position: 'relative',
  },
  image: {
    width: SCREEN_WIDTH,
    aspectRatio: 5 / 7,
    backgroundColor: '#1a1a1a',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  caption: {
    fontSize: 15,
    color: '#FFFCF9',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
    fontWeight: '600',
  },
  foodItemsGrid: {
    gap: 8,
  },
  foodItemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
  },
  foodItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFCF9',
    flex: 1,
    marginRight: 8,
  },
  foodItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9562BB',
  },
  foodItemRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 6,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#999',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentsContainer: {
    gap: 16,
  },
  noComments: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 24,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#9562BB',
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9562BB',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#FFFCF9',
    lineHeight: 20,
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#000000',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFFCF9',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9562BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
});