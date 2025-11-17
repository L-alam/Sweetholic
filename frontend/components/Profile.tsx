import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

const mockProfile = {
  username: 'sweetlover123',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
  stats: {
    posts: 42,
    following: 328,
    followers: 1254,
  },
};

const mockDisplayLists = [
  {
    id: '1',
    name: 'Best Matcha Treats',
    coverImage: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop',
    count: 12,
  },
  {
    id: '2',
    name: 'NYC Chocolate Must-Try',
    coverImage: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&h=400&fit=crop',
    count: 8,
  },
  {
    id: '3',
    name: 'Weekend Favorites',
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
    count: 15,
  },
  {
    id: '4',
    name: 'Hidden Gems',
    coverImage: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop',
    count: 6,
  },
];

export function Profile() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-add-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Image source={{ uri: mockProfile.avatar }} style={styles.avatar} />
            <Text style={styles.username}>{mockProfile.username}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockProfile.stats.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockProfile.stats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockProfile.stats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Lists Section */}
          <View style={styles.listsSection}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>My Lists</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listsGrid}>
              {mockDisplayLists.map((list) => (
                <TouchableOpacity key={list.id} style={styles.listCard}>
                  <Image source={{ uri: list.coverImage }} style={styles.listImage} />
                  <View style={styles.listInfo}>
                    <Text style={styles.listName} numberOfLines={1}>{list.name}</Text>
                    <Text style={styles.listCount}>{list.count} items</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
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
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: '#e0e0e0',
  },
  editButton: {
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6ec2f9',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  listsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    color: '#6ec2f9',
    fontWeight: '600',
  },
  listsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listCard: {
    width: '48%',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  listImage: {
    width: '100%',
    aspectRatio: 1,
  },
  listInfo: {
    padding: 12,
  },
  listName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  listCount: {
    fontSize: 12,
    color: '#666',
  },
});