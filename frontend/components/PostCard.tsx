import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Post {
  id: string;
  username: string;
  userAvatar: string;
  timestamp: string;
  images: string[];
  caption: string;
  location: string;
  reactions: {
    heart: number;
    thumbsUp: number;
    starEyes: number;
    jealous: number;
    sad: number;
  };
}

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  const reactions = [
    { id: 'heart', icon: 'heart', count: post.reactions.heart, color: '#ff6b6b' },
    { id: 'thumbsUp', icon: 'thumbs-up', count: post.reactions.thumbsUp, color: '#6ec2f9' },
    { id: 'starEyes', icon: 'star', count: post.reactions.starEyes, color: '#ffd93d' },
    { id: 'jealous', icon: 'sad', count: post.reactions.jealous, color: '#95e1d3' },
    { id: 'sad', icon: 'thumbs-down', count: post.reactions.sad, color: '#b8b8b8' },
  ];

  const truncatedCaption = post.caption.length > 120 
    ? post.caption.slice(0, 120) + '...' 
    : post.caption;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>

      {/* Image */}
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
                onPress={() => setCurrentImageIndex(index)}
                style={[
                  styles.indicator,
                  { backgroundColor: index === currentImageIndex ? '#6ec2f9' : 'rgba(255,255,255,0.6)' }
                ]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>
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
      </View>

      {/* Reactions */}
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
                size={16}
                color={isSelected ? reaction.color : '#666'}
              />
              <Text style={styles.reactionCount}>{reaction.count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
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
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
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
  captionContainer: {
    padding: 12,
  },
  caption: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  readMore: {
    color: '#6ec2f9',
    fontWeight: '600',
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
    fontSize: 14,
    color: '#666',
  },
});