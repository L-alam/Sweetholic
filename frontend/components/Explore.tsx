import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

const mockPins = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&h=100&fit=crop',
    visits: 3,
    location: 'Sweet Dreams Cafe',
    position: { top: '20%', left: '30%' },
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop',
    visits: 1,
    location: 'Bake & Bloom',
    position: { top: '40%', left: '60%' },
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=100&h=100&fit=crop',
    visits: 5,
    location: 'Cocoa Corner',
    position: { top: '60%', left: '40%' },
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100&h=100&fit=crop',
    visits: 2,
    location: 'Sugar Rush',
    position: { top: '35%', left: '75%' },
  },
];

export function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'my' | 'friends'>('my');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with Search */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurants, cafes, treats..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.filterButtons}>
            <TouchableOpacity
              onPress={() => setViewMode('my')}
              style={[
                styles.filterButton,
                viewMode === 'my' && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterText,
                viewMode === 'my' && styles.filterTextActive
              ]}>
                My Posts
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setViewMode('friends')}
              style={[
                styles.filterButton,
                viewMode === 'friends' && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterText,
                viewMode === 'friends' && styles.filterTextActive
              ]}>
                Friends' Posts
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          {/* Mock Map Background with Grid */}
          <View style={styles.mapBackground}>
            {/* Grid lines */}
            <View style={styles.gridOverlay} />
          </View>

          {/* Map Pins */}
          {mockPins.map((pin) => (
            <TouchableOpacity
              key={pin.id}
              style={[styles.pin, { top: pin.position.top, left: pin.position.left }]}
              onPress={() => console.log('Pin clicked:', pin.location)}
            >
              <View style={styles.pinContainer}>
                <Image source={{ uri: pin.image }} style={styles.pinImage} />
                <View style={styles.visitBadge}>
                  <Text style={styles.visitText}>{pin.visits}</Text>
                </View>
                <View style={styles.pinPointer} />
              </View>
            </TouchableOpacity>
          ))}

          {/* Legend */}
          <View style={styles.legend}>
            <Ionicons name="location" size={20} color="#6ec2f9" />
            <Text style={styles.legendText}>Tap any pin to view post details</Text>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#e8f4f8',
  },
  gridOverlay: {
    flex: 1,
    opacity: 0.1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#000',
  },
  pin: {
    position: 'absolute',
    transform: [{ translateX: -24 }, { translateY: -60 }],
  },
  pinContainer: {
    alignItems: 'center',
  },
  pinImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#fff',
  },
  visitBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#6ec2f9',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pinPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -2,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  legendText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});