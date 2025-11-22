import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { reactionsAPI } from '../utils/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Black spacer bars on sides
const CARD_PADDING = 24;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_PADDING * 2);
const IMAGE_HEIGHT = CARD_WIDTH * (7 / 5); // 5:7 aspect ratio

interface Post {
  id: string;
  username: string;
  displayName: string;
  userAvatar: string;
  timestamp: string;
  images: string[];
  caption: string;
  location: string;
  rating?: number;
  ratingType?: '3' | '5' | '10';
  reactions: {
    heart: number;
    thumbsUp: number;
    starEyes: number;
    jealous: number;
    sad: number;
  };
  userReaction?: string | null;
  commentCount: number;
}

interface PostCardProps {
  post: Post;
  onClick?: () => void;
}

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=9562BB&color=FFFCF9&size=200';

export function PostCard({ post, onClick }: PostCardProps) {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(post.userReaction || null);
  const [reactionCounts, setReactionCounts] = useState(post.reactions);

  const reactions = [
    { id: 'heart', icon: 'heart', apiType: 'heart' as const, color: '#FF6978' },
    { id: 'thumbsUp', icon: 'thumbs-up', apiType: 'thumbs_up' as const, color: '#9562BB' },
    { id: 'starEyes', icon: 'star', apiType: 'star_eyes' as const, color: '#ffd93d' },
    { id: 'jealous', icon: 'sad', apiType: 'jealous' as const, color: '#B1EDE8' },
    { id: 'sad', icon: 'thumbs-down', apiType: 'dislike' as const, color: '#666' },
  ];

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
          await reactionsAPI.removeReaction(user.token, post.id, prevReactionType);
        }
      }

      if (wasSelected) {
        await reactionsAPI.removeReaction(user.token, post.id, reactionType);
      } else {
        await reactionsAPI.addReaction(user.token, post.id, reactionType);
      }
    } catch (error: any) {
      console.error('Error updating reaction:', error.message);
      setSelectedReaction(previousReaction);
      setReactionCounts(previousCounts);
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    if (index !== currentImageIndex && index >= 0 && index < post.images.length) {
      setCurrentImageIndex(index);
    }
  };

  const truncatedCaption = post.caption.length > 120 
    ? post.caption.slice(0, 120) + '...' 
    : post.caption;

  return (
    <View style={styles.container}>
      {/* Header with location */}
      <View style={styles.header}>
        <Image 
          source={{ 
            uri: post.userAvatar || DEFAULT_AVATAR
          }} 
          style={styles.avatar} 
        />
        <View style={styles.headerText}>
          <Text style={styles.displayName}>{post.displayName}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.timestamp}>{post.timestamp}</Text>
            {post.location && (
              <>
                <Text style={styles.dot}>•</Text>
                <Ionicons name="location" size={12} color="#9562BB" />
                <Text style={styles.location} numberOfLines={1}>{post.location}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Clickable side spacers + Image Container */}
      <View style={styles.imageOuterContainer}>
        <View style={styles.imageContainer}>
          {/* Swipeable Image Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH}
            snapToAlignment="center"
            contentContainerStyle={styles.carouselContent}
          >
            {post.images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image 
                  source={{ uri }} 
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          {post.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {post.images.map((_, index) => (
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
      </View>

      {/* Caption - Clickable */}
      <TouchableOpacity onPress={onClick} activeOpacity={0.9}>
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.username}>@{post.username}</Text>
            {' '}
            {expanded ? post.caption : truncatedCaption}
            {post.caption.length > 120 && (
              <Text 
                onPress={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                style={styles.readMore}
              >
                {' '}{expanded ? 'Show less' : 'Read more'}
              </Text>
            )}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Reactions */}
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
                size={16}
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

      {/* Comments indicator */}
      {post.commentCount > 0 && (
        <TouchableOpacity style={styles.commentsIndicator} onPress={onClick}>
          <Ionicons name="chatbubble-outline" size={16} color="#999" />
          <Text style={styles.commentsText}>
            View {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#9562BB',
  },
  headerText: {
    flex: 1,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  dot: {
    fontSize: 12,
    color: '#666',
  },
  location: {
    fontSize: 12,
    color: '#9562BB',
    flex: 1,
    fontWeight: '500',
  },
  
  // Image container with black spacers (clickable)
  imageOuterContainer: {
    marginBottom: 8,
  },
  imageContainer: {
    paddingHorizontal: CARD_PADDING,
  },
  carouselContent: {
    alignItems: 'center',
  },
  imageWrapper: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  postImage: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#1a1a1a',
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  // Caption
  captionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 10,
  },
  caption: {
    fontSize: 16,
    color: '#FFFCF9',
    lineHeight: 18,
  },
  username: {
    fontWeight: '600',
    color: '#9562BB',
  },
  readMore: {
    color: '#999',
    fontWeight: '500',
  },
  
  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  reactionCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  commentsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 6,
  },
  commentsText: {
    fontSize: 13,
    color: '#999',
  },
});