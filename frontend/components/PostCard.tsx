import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { reactionsAPI } from '../utils/api';

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
      // Remove reaction
      setSelectedReaction(null);
      setReactionCounts(prev => ({
        ...prev,
        [reactionId]: Math.max(0, prev[reactionId as keyof typeof prev] - 1),
      }));
    } else {
      // Add new reaction (and remove old one if exists)
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
      // Remove previous reaction if exists
      if (previousReaction && !wasSelected) {
        const prevReactionType = reactions.find(r => r.id === previousReaction)?.apiType;
        if (prevReactionType) {
          await reactionsAPI.removeReaction(user.token, post.id, prevReactionType);
        }
      }

      if (wasSelected) {
        // Remove current reaction
        await reactionsAPI.removeReaction(user.token, post.id, reactionType);
      } else {
        // Add new reaction
        await reactionsAPI.addReaction(user.token, post.id, reactionType);
      }
    } catch (error: any) {
      console.error('Error updating reaction:', error.message);
      // Revert on error
      setSelectedReaction(previousReaction);
      setReactionCounts(previousCounts);
    }
  };

  const truncatedCaption = post.caption.length > 120 
    ? post.caption.slice(0, 120) + '...' 
    : post.caption;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={{ 
            uri: post.userAvatar || 'https://ui-avatars.com/api/?name=' + post.username 
          }} 
          style={styles.avatar} 
        />
        <View style={styles.headerText}>
          <Text style={styles.displayName}>{post.displayName}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>

      {/* Images */}
      <TouchableOpacity onPress={onClick} activeOpacity={0.9}>
        <Image 
          source={{ uri: post.images[currentImageIndex] }} 
          style={styles.postImage}
        />
        {post.images.length > 1 && (
          <View style={styles.imageIndicators}>
            {post.images.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
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
      </TouchableOpacity>

      {/* Caption & Location */}
      <View style={styles.content}>
        {post.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color="#9562BB" />
            <Text style={styles.location}>{post.location}</Text>
          </View>
        )}

        <Text style={styles.caption}>
          <Text style={styles.username}>@{post.username}</Text>
          {' '}
          {expanded ? post.caption : truncatedCaption}
          {post.caption.length > 120 && (
            <Text 
              onPress={() => setExpanded(!expanded)}
              style={styles.readMore}
            >
              {' '}{expanded ? 'Show less' : 'Read more'}
            </Text>
          )}
        </Text>

        {/* Rating */}
        {post.rating && post.ratingType && (
          <View style={styles.ratingContainer}>
            {Array.from({ length: parseInt(post.ratingType) }).map((_, index) => (
              <Ionicons
                key={index}
                name="star"
                size={14}
                color={index < post.rating! ? '#ffd93d' : '#333'}
              />
            ))}
            <Text style={styles.ratingText}>
              {post.rating}/{post.ratingType}
            </Text>
          </View>
        )}
      </View>

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
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#9562BB',
  },
  headerText: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
  },
  username: {
    fontWeight: '600',
    color: '#9562BB',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
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
  content: {
    padding: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 13,
    color: '#9562BB',
    marginLeft: 4,
    fontWeight: '500',
  },
  caption: {
    fontSize: 14,
    color: '#FFFCF9',
    lineHeight: 20,
  },
  readMore: {
    color: '#9562BB',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },
  commentsText: {
    fontSize: 13,
    color: '#999',
  },
});