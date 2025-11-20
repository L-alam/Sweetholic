import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, listsAPI, followsAPI } from '../utils/api';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  profile_photo_url: string;
  post_count: number;
  follower_count: number;
  following_count: number;
  is_following?: boolean;
}

interface List {
  id: string;
  name: string;
  description: string;
  cover_photo_url: string;
  item_count: number;
  is_public: boolean;
  created_at: string;
}

// Default placeholder image
const DEFAULT_PROFILE_IMAGE = 'https://ui-avatars.com/api/?name=User&background=9562BB&color=FFFCF9&size=200';
const DEFAULT_LIST_IMAGE = 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=400&fit=crop';

export function Profile({ navigation, route }: any) {
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Check if viewing own profile or another user's profile
  const username = route?.params?.username || currentUser?.username;
  const isOwnProfile = !route?.params?.username;

  const fetchProfile = async () => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      const token = currentUser?.token;
      const response = await usersAPI.getProfile(username, token);
      if (response.success) {
        setProfile(response.data.user);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    }
  };

  const fetchLists = async () => {
    if (!username) {
      return;
    }

    try {
      const response = await listsAPI.getUserLists(username, 20, 0);
      if (response.success) {
        // Filter to only show public lists if viewing another user's profile
        const userLists = response.data.lists;
        setLists(isOwnProfile ? userLists : userLists.filter((list: List) => list.is_public));
      }
    } catch (error: any) {
      console.error('Error fetching lists:', error.message);
      // Don't show alert for lists - it's okay if user has no lists
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchLists()]);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [username]);

  useEffect(() => {
    loadData();
  }, [username]);

  const handleFollow = async () => {
    if (!profile || isOwnProfile || !currentUser?.token || !username) return;
    
    try {
      if (profile.is_following) {
        await followsAPI.unfollowUser(currentUser.token, username);
      } else {
        await followsAPI.followUser(currentUser.token, username);
      }
      
      // Update local state optimistically
      setProfile({
        ...profile,
        is_following: !profile.is_following,
        follower_count: profile.is_following 
          ? profile.follower_count - 1 
          : profile.follower_count + 1,
      });
    } catch (error: any) {
      console.error('Error toggling follow:', error.message);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9562BB" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top']}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {!isOwnProfile ? (
          <TouchableOpacity 
            onPress={() => navigation?.goBack?.()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFCF9" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => navigation?.navigate?.('Settings')}
            style={styles.headerButton}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFCF9" />
          </TouchableOpacity>
        )}
        
        <Text style={styles.headerTitle}>Profile</Text>
        
        {isOwnProfile ? (
          <TouchableOpacity 
            onPress={() => navigation?.navigate?.('AddFriends')}
            style={styles.headerButton}
          >
            <Ionicons name="person-add-outline" size={24} color="#FFFCF9" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9562BB"
          />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image 
            source={{ 
              uri: profile.profile_photo_url || DEFAULT_PROFILE_IMAGE
            }} 
            style={styles.avatar} 
          />
          <Text style={styles.displayName}>{profile.display_name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.post_count}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation?.navigate?.('FollowList', { 
              username, 
              tab: 'following' 
            })}
          >
            <Text style={styles.statNumber}>{profile.following_count}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation?.navigate?.('FollowList', { 
              username, 
              tab: 'followers' 
            })}
          >
            <Text style={styles.statNumber}>{profile.follower_count}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        {isOwnProfile ? (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation?.navigate?.('EditProfile')}
          >
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[
              styles.actionButton,
              profile.is_following && styles.followingButton
            ]}
            onPress={handleFollow}
          >
            <Text style={[
              styles.actionButtonText,
              profile.is_following && styles.followingButtonText
            ]}>
              {profile.is_following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Lists Section */}
        <View style={styles.listsSection}>
          <View style={styles.listsSectionHeader}>
            <Text style={styles.sectionTitle}>My Lists</Text>
            {lists.length > 4 && (
              <TouchableOpacity onPress={() => navigation?.navigate?.('AllLists', { username })}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {lists.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color="#666" />
              <Text style={styles.emptyStateText}>
                {isOwnProfile ? 'No lists yet' : 'No public lists'}
              </Text>
              {isOwnProfile && (
                <TouchableOpacity 
                  style={styles.createListButton}
                  onPress={() => navigation?.navigate?.('CreateList')}
                >
                  <Text style={styles.createListButtonText}>Create Your First List</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.listsGrid}>
              {lists.slice(0, 4).map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={styles.listCard}
                  onPress={() => navigation?.navigate?.('ListDetail', { listId: list.id })}
                >
                  <Image
                    source={{ 
                      uri: list.cover_photo_url || DEFAULT_LIST_IMAGE
                    }}
                    style={styles.listImage}
                  />
                  <View style={styles.listInfo}>
                    <Text style={styles.listName} numberOfLines={1}>
                      {list.name}
                    </Text>
                    <Text style={styles.listCount}>{list.item_count} items</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: '#000000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorText: {
    color: '#FFFCF9',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#000000',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFCF9',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#9562BB',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFCF9',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#FFFCF9',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1a1a1a',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFCF9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
  },
  divider: {
    width: 1,
    height: 48,
    backgroundColor: '#1a1a1a',
  },
  actionButton: {
    backgroundColor: '#9562BB',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#9562BB',
  },
  actionButtonText: {
    color: '#FFFCF9',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#9562BB',
  },
  listsSection: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  listsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFCF9',
  },
  viewAllText: {
    fontSize: 14,
    color: '#9562BB',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
  },
  createListButton: {
    backgroundColor: '#9562BB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createListButtonText: {
    color: '#FFFCF9',
    fontSize: 14,
    fontWeight: '600',
  },
  listsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  listCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    margin: '1%',
    marginBottom: 12,
  },
  listImage: {
    width: '100%',
    aspectRatio: 1,
  },
  listInfo: {
    padding: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 4,
  },
  listCount: {
    fontSize: 12,
    color: '#999',
  },
});