import { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

const mockLists = [
  {
    id: '1',
    name: 'Best Matcha Treats',
    count: 12,
    coverImage: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop',
    ratingType: '5' as const,
  },
  {
    id: '2',
    name: 'NYC Chocolate Must-Try',
    count: 8,
    coverImage: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&h=400&fit=crop',
    ratingType: '10' as const,
  },
  {
    id: '3',
    name: 'Weekend Favorites',
    count: 15,
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
    ratingType: '3' as const,
  },
];

const mockTimelineItems = [
  {
    id: '1',
    name: 'Matcha Tiramisu',
    location: 'Sweet Dreams Cafe',
    rating: 5,
    ratingType: '5' as const,
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&h=200&fit=crop',
    caption: 'Perfect balance of matcha and cream',
    addedDate: '2 days ago',
  },
  {
    id: '2',
    name: 'Triple Chocolate Brownie',
    location: 'Cocoa Corner',
    rating: 3,
    ratingType: '3' as const,
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=200&h=200&fit=crop',
    caption: 'Rich, fudgy, intensely chocolatey',
    addedDate: '5 days ago',
  },
  {
    id: '3',
    name: 'Strawberry Shortcake',
    location: 'Bake & Bloom',
    rating: 9,
    ratingType: '10' as const,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop',
    caption: 'Light, fluffy, loaded with berries',
    addedDate: '1 week ago',
  },
];

export function Lists() {
  const [selectedList, setSelectedList] = useState(mockLists[0].id);
  const [sortBy, setSortBy] = useState<'rating' | 'item' | 'recent'>('recent');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Lists</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Lists Carousel */}
          <View style={styles.listsSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listsCarousel}
            >
              {mockLists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  onPress={() => setSelectedList(list.id)}
                  style={styles.listCard}
                >
                  <View style={[
                    styles.listImageContainer,
                    selectedList === list.id && styles.listImageContainerActive
                  ]}>
                    <Image source={{ uri: list.coverImage }} style={styles.listImage} />
                  </View>
                  <Text style={[
                    styles.listName,
                    selectedList === list.id && styles.listNameActive
                  ]} numberOfLines={2}>
                    {list.name}
                  </Text>
                  <Text style={styles.listCount}>{list.count} items</Text>
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
                  // In real app, would show a picker modal
                  const options: Array<'rating' | 'item' | 'recent'> = ['rating', 'item', 'recent'];
                  const currentIndex = options.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setSortBy(options[nextIndex]);
                }}
              >
                <Text style={styles.sortText}>
                  {sortBy === 'recent' ? 'Recent' : sortBy === 'rating' ? 'Rating' : 'Item Name'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timelineSection}>
            {mockTimelineItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemLocation}>{item.location}</Text>
                    <Text style={styles.itemCaption}>{item.caption}</Text>
                    
                    {/* Rating Stars */}
                    <View style={styles.ratingContainer}>
                      {Array.from({ length: parseInt(item.ratingType) }).map((_, index) => (
                        <Ionicons
                          key={index}
                          name={index < item.rating ? 'star' : 'star-outline'}
                          size={14}
                          color={index < item.rating ? '#ffd93d' : '#e0e0e0'}
                        />
                      ))}
                      <Text style={styles.ratingText}>
                        {item.rating}/{item.ratingType}
                      </Text>
                    </View>
                    
                    <Text style={styles.itemDate}>{item.addedDate}</Text>
                  </View>
                  
                  <Image source={{ uri: item.image }} style={styles.timelineImage} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Share List Button */}
        <View style={styles.bottomButton}>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share List</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6ec2f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    borderWidth: 4,
    borderColor: 'transparent',
  },
  listImageContainerActive: {
    borderColor: '#6ec2f9',
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
  },
  listNameActive: {
    fontWeight: '700',
  },
  listCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sortSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
  },
  sortPicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  sortText: {
    fontSize: 14,
    color: '#000',
  },
  timelineSection: {
    padding: 16,
    gap: 12,
  },
  timelineItem: {
    backgroundColor: '#f5f5f5',
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
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemCaption: {
    fontSize: 13,
    color: '#666',
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
    color: '#666',
    marginLeft: 4,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
  timelineImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
  },
  bottomButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  shareButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#6ec2f9',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});