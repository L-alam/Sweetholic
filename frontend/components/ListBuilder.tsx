import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { listsAPI, postsAPI } from '../utils/api';
import { ExpandedPost } from './ExpandedPost';

interface Post {
  id: string;
  caption: string;
  location_name: string;
  food_type: string;
  photos: { photo_url: string }[];
  rating: number;
  created_at: string;
}

interface ListBuilderProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function ListBuilder({ onComplete, onCancel }: ListBuilderProps) {
  const { user } = useAuth();
  
  // List details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isRanked, setIsRanked] = useState(false);
  
  // Posts data
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Fetch user's posts
  useEffect(() => {
    fetchUserPosts();
  }, []);

  const fetchUserPosts = async () => {
    if (!user?.username) return;

    try {
      const response = await postsAPI.getUserPosts(user.username, 50, 0);
      if (response.success && response.data?.posts) {
        setPosts(response.data.posts);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load your posts');
    } finally {
      setLoading(false);
    }
  };

  const togglePostSelection = (postId: string) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleCreateList = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a list title');
      return;
    }

    if (title.length > 255) {
      Alert.alert('Error', 'Title must be 255 characters or less');
      return;
    }

    if (!user?.token) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    setCreating(true);

    try {
      // Step 1: Create the list
      const coverPhoto = selectedPosts.size > 0 
        ? posts.find(p => selectedPosts.has(p.id))?.photos[0]?.photo_url 
        : undefined;

      const createResponse = await listsAPI.createList(user.token, {
        title: title.trim(),
        description: description.trim() || undefined,
        cover_photo_url: coverPhoto,
        is_public: isPublic,
        is_ranked: isRanked,
      });

      if (!createResponse.success) {
        throw new Error(createResponse.message || 'Failed to create list');
      }

      const listId = createResponse.data.list.id;

      // Step 2: Add selected posts to the list
      if (selectedPosts.size > 0) {
        const postIds = Array.from(selectedPosts);
        
        // Add posts in order
        for (let i = 0; i < postIds.length; i++) {
          await listsAPI.addPostToList(user.token, listId, postIds[i], i);
        }
      }

      Alert.alert('Success', 'List created successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Error creating list:', error);
      Alert.alert('Error', error.message || 'Failed to create list');
    } finally {
      setCreating(false);
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
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={onCancel}
            >
              <Ionicons name="close" size={28} color="#FFFCF9" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create List</Text>
            <View style={styles.headerButton} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* List Details Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>List Details</Text>
              
              {/* Title Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Best Matcha in Boston"
                  placeholderTextColor="#666"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={255}
                />
                <Text style={styles.charCount}>{title.length}/255</Text>
              </View>

              {/* Description Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Add a description for your list..."
                  placeholderTextColor="#666"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Privacy Toggle */}
              <View style={styles.privacySection}>
                <View style={styles.privacyInfo}>
                  <Ionicons 
                    name={isPublic ? 'globe-outline' : 'lock-closed-outline'} 
                    size={20} 
                    color="#FFFCF9" 
                  />
                  <Text style={styles.privacyLabel}>
                    {isPublic ? 'Public' : 'Private'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleButton, isPublic && styles.toggleButtonActive]}
                  onPress={() => setIsPublic(!isPublic)}
                >
                  <View style={[styles.toggleCircle, isPublic && styles.toggleCircleActive]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.privacyDescription}>
                {isPublic 
                  ? 'Anyone can see this list on your profile' 
                  : 'Only you can see this list'}
              </Text>

              {/* Ranked Toggle */}
              <View style={[styles.privacySection, { marginTop: 16 }]}>
                <View style={styles.privacyInfo}>
                  <Ionicons 
                    name="trophy" 
                    size={20} 
                    color={isRanked ? '#ffd93d' : '#FFFCF9'} 
                  />
                  <Text style={styles.privacyLabel}>
                    Ranked List
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggleButton, isRanked && styles.toggleButtonActive]}
                  onPress={() => setIsRanked(!isRanked)}
                >
                  <View style={[styles.toggleCircle, isRanked && styles.toggleCircleActive]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.privacyDescription}>
                {isRanked 
                  ? 'Items will be numbered in order from 1 to ' + (selectedPosts.size || 'N')
                  : 'Items will not be ranked'}
              </Text>
            </View>

            {/* Posts Selection Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Select Posts ({selectedPosts.size})
              </Text>
              <Text style={styles.sectionSubtitle}>
                {isRanked 
                  ? 'Select posts in the order you want them ranked'
                  : 'Choose which posts to add to your list'}
              </Text>

              {posts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="images-outline" size={64} color="#666" />
                  <Text style={styles.emptyStateText}>No posts yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Create some posts first to add them to lists
                  </Text>
                </View>
              ) : (
                <View style={styles.postsGrid}>
                  {posts.map((post) => {
                    const isSelected = selectedPosts.has(post.id);
                    // Calculate rank if this post is selected
                    const rank = isSelected && isRanked
                      ? Array.from(selectedPosts).indexOf(post.id) + 1
                      : null;
                    
                    return (
                      <TouchableOpacity
                        key={post.id}
                        style={[
                          styles.postCard,
                          isSelected && styles.postCardSelected
                        ]}
                        onPress={() => togglePostSelection(post.id)}
                        onLongPress={() => setExpandedPostId(post.id)}
                        delayLongPress={500}
                      >
                        <Image
                          source={{ uri: post.photos[0]?.photo_url }}
                          style={styles.postImage}
                        />
                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            {isRanked ? (
                              <View style={styles.rankBadge}>
                                <Text style={styles.rankText}>{rank}</Text>
                              </View>
                            ) : (
                              <Ionicons name="checkmark-circle" size={28} color="#9562BB" />
                            )}
                          </View>
                        )}
                        <View style={styles.postInfo}>
                          <Text style={styles.postCaption} numberOfLines={1}>
                            {post.caption || post.food_type}
                          </Text>
                          <View style={styles.postMeta}>
                            <Ionicons name="star" size={12} color="#ffd93d" />
                            <Text style={styles.postRating}>{post.rating}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Create Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.createButton,
                (!title.trim() || creating) && styles.createButtonDisabled
              ]}
              onPress={handleCreateList}
              disabled={!title.trim() || creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#FFFCF9" />
              ) : (
                <Text style={styles.createButtonText}>
                  Create List
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

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
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9562BB',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFCF9',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFCF9',
    borderWidth: 1,
    borderColor: '#333',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  privacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
  },
  privacyDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    padding: 2,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#9562BB',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFCF9',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
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
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  postCard: {
    width: '31%',
    margin: '1%',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  postCardSelected: {
    borderColor: '#9562BB',
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFCF9',
    borderRadius: 14,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9562BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFCF9',
  },
  postInfo: {
    padding: 8,
  },
  postCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 4,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postRating: {
    fontSize: 11,
    color: '#999',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  createButton: {
    backgroundColor: '#9562BB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
  },
});