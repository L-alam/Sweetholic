import { useState } from 'react';
import { View, Text, Image, ScrollView, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

interface ExpandedPostProps {
  post: {
    id: string;
    username: string;
    userAvatar: string;
    timestamp: string;
    images: string[];
    caption: string;
    location: string;
    address: string;
    rating?: number;
    ratingType?: '3' | '5' | '10';
    reactions: {
      heart: number;
      thumbsUp: number;
      starEyes: number;
      jealous: number;
      sad: number;
    };
  };
  visible: boolean;
  onClose: () => void;
}

const mockComments = [
  { 
    id: '1', 
    username: 'foodie_lover', 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', 
    text: 'Looks amazing! I need to try this place!', 
    timestamp: '1h ago' 
  },
  { 
    id: '2', 
    username: 'sweettooth88', 
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', 
    text: 'The presentation is beautiful 😍', 
    timestamp: '30m ago' 
  },
];

export function ExpandedPost({ post, visible, onClose }: ExpandedPostProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const reactions = [
    { id: 'heart', icon: 'heart', count: post.reactions.heart, color: '#ff6b6b' },
    { id: 'thumbsUp', icon: 'thumbs-up', count: post.reactions.thumbsUp, color: '#6ec2f9' },
    { id: 'starEyes', icon: 'star', count: post.reactions.starEyes, color: '#ffd93d' },
    { id: 'jealous', icon: 'sad', count: post.reactions.jealous, color: '#95e1d3' },
    { id: 'sad', icon: 'thumbs-down', count: post.reactions.sad, color: '#b8b8b8' },
  ];

  const renderRating = () => {
    if (!post.rating || !post.ratingType) return null;
    
    const maxStars = parseInt(post.ratingType);
    
    return (
      <View style={styles.ratingContainer}>
        {Array.from({ length: maxStars }).map((_, index) => (
          <Ionicons
            key={index}
            name={index < post.rating! ? 'star' : 'star-outline'}
            size={16}
            color={index < post.rating! ? '#ffd93d' : '#e0e0e0'}
          />
        ))}
        <Text style={styles.ratingText}>
          {post.rating}/{maxStars}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
            <View>
              <Text style={styles.username}>{post.username}</Text>
              <Text style={styles.timestamp}>{post.timestamp}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Image Carousel */}
          <View style={styles.imageSection}>
            <Image source={{ uri: post.images[currentImageIndex] }} style={styles.image} />
            {post.images.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                  disabled={currentImageIndex === 0}
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={() => setCurrentImageIndex(Math.min(post.images.length - 1, currentImageIndex + 1))}
                  disabled={currentImageIndex === post.images.length - 1}
                >
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.imageIndicators}>
                  {post.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        { backgroundColor: index === currentImageIndex ? '#6ec2f9' : 'rgba(255,255,255,0.6)' }
                      ]}
                    />
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Caption */}
            <View style={styles.section}>
              <Text style={styles.caption}>{post.caption}</Text>
              {renderRating()}
            </View>

            {/* Location */}
            <TouchableOpacity style={styles.locationCard}>
              <Ionicons name="location" size={20} color="#6ec2f9" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{post.location}</Text>
                <Text style={styles.locationAddress}>{post.address}</Text>
              </View>
            </TouchableOpacity>

            {/* Reactions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>React to this post</Text>
              <View style={styles.reactionsContainer}>
                {reactions.map((reaction) => {
                  const isSelected = selectedReaction === reaction.id;
                  return (
                    <TouchableOpacity
                      key={reaction.id}
                      onPress={() => setSelectedReaction(isSelected ? null : reaction.id)}
                      style={[
                        styles.reactionButton,
                        {
                          backgroundColor: isSelected ? `${reaction.color}20` : '#f5f5f5',
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
                      <Text style={styles.reactionCount}>{reaction.count}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Comments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comments</Text>
              <View style={styles.commentsContainer}>
                {mockComments.map((commentItem) => (
                  <View key={commentItem.id} style={styles.commentItem}>
                    <Image source={{ uri: commentItem.avatar }} style={styles.commentAvatar} />
                    <View style={styles.commentContent}>
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentUsername}>{commentItem.username}</Text>
                        <Text style={styles.commentText}>{commentItem.text}</Text>
                      </View>
                      <Text style={styles.commentTimestamp}>{commentItem.timestamp}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={comment}
            onChangeText={setComment}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
    </SafeAreaView>
    </SafeAreaProvider>
    </Modal>
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -20 }],
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  caption: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 24,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
    color: '#666',
  },
  commentsContainer: {
    gap: 16,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  commentTimestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6ec2f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});