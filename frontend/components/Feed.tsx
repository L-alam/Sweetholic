import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from './PostCard';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

const mockPosts = [
  {
    id: '1',
    username: 'sweetlover123',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    timestamp: '2h ago',
    images: [
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop',
    ],
    caption: 'Amazing matcha tiramisu at Sweet Dreams Cafe! The layers were perfectly balanced and not too sweet. The matcha flavor really came through without being bitter. Definitely coming back for more!',
    location: 'Sweet Dreams Cafe',
    address: '123 Main St, New York, NY',
    rating: 5,
    ratingType: '5' as const,
    reactions: { heart: 24, thumbsUp: 12, starEyes: 8, jealous: 3, sad: 0 }
  },
  {
    id: '2',
    username: 'dessertqueen',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    timestamp: '5h ago',
    images: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop',
    ],
    caption: 'This strawberry shortcake is pure heaven! Light, fluffy, and loaded with fresh berries. Perfect afternoon treat.',
    location: 'Bake & Bloom',
    address: '456 Park Ave, New York, NY',
    rating: 9,
    ratingType: '10' as const,
    reactions: { heart: 42, thumbsUp: 18, starEyes: 15, jealous: 7, sad: 1 }
  },
  {
    id: '3',
    username: 'chocolatechaser',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    timestamp: '1d ago',
    images: [
      'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&h=600&fit=crop',
    ],
    caption: 'Triple chocolate brownies that are absolutely divine! Rich, fudgy, and intensely chocolatey.',
    location: 'Cocoa Corner',
    address: '789 Sweet Street, Brooklyn, NY',
    rating: 3,
    ratingType: '3' as const,
    reactions: { heart: 31, thumbsUp: 14, starEyes: 11, jealous: 5, sad: 0 }
  },
];

export function Feed() {
  const [feedMode, setFeedMode] = useState<'friends' | 'public'>('friends');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="person-add-outline" size={24} color="#000" />
            </TouchableOpacity>
            
            <Text style={styles.title}>SweetHolic</Text>
            
            <View style={styles.filterButtons}>
              <TouchableOpacity
                onPress={() => setFeedMode('friends')}
                style={[
                  styles.filterButton,
                  feedMode === 'friends' && styles.filterButtonActive
                ]}
              >
                <Text style={[
                  styles.filterText,
                  feedMode === 'friends' && styles.filterTextActive
                ]}>
                  Friends
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setFeedMode('public')}
                style={[
                  styles.filterButton,
                  feedMode === 'public' && styles.filterButtonActive
                ]}
              >
                <Text style={[
                  styles.filterText,
                  feedMode === 'public' && styles.filterTextActive
                ]}>
                  Public
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Feed */}
          <ScrollView style={styles.feed}>
            {mockPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => console.log('Post clicked:', post.id)}
              />
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6ec2f9',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#6ec2f9',
  },
  filterText: {
    fontSize: 14,
    color: '#000',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  feed: {
    flex: 1,
  },
});