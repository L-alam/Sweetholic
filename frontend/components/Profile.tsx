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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, listsAPI, followsAPI } from '../utils/api';
import { ListBuilder } from './ListBuilder';
import { ExpandedList } from './ExpandedList';

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
  title: string;
  description: string;
  cover_photo_url: string;
  item_count: number;
  is_public: boolean;
  created_at: string;
}

const DEFAULT_PROFILE_IMAGE = 'https://ui-avatars.com/api/?name=User&background=9562BB&color=FFFCF9&size=200';
const DEFAULT_LIST_IMAGE = 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=400&fit=crop';

export function Profile({ navigation, route }: any) {
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showListBuilder, setShowListBuilder] = useState(false);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  
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
      const token = isOwnProfile ? currentUser?.token : undefined;
      const response = await listsAPI.getUserLists(username, 20, 0, token);
      
      if (response.success) {
        const userLists = response.data?.lists || [];
        setLists(isOwnProfile ? userLists : userLists.filter((list: List) => list.is_public));
      }
    } catch (error: any) {
      if (error.message && !error.message.includes('fetching user lists') && !error.message.includes('User not found')) {
        console.error('Error fetching lists:', error.message);
      }
      setLists([]);
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
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9562BB" />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!profile) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Profile not found</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top']}>
    <View style={styles.container}>
      {/* Header - Instagram Style */}
      <View style={styles.header}>
        {/* {!isOwnProfile && (
          <TouchableOpacity 
            onPress={() => navigation?.goBack?.()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFCF9" />
          </TouchableOpacity>
        )} */}
        
        <Text style={styles.headerUsername}>{profile.username}</Text>
        
        <View style={styles.headerActions}>
          {isOwnProfile ? (
            <>
              <TouchableOpacity 
                onPress={() => navigation?.navigate?.('Share')}
                style={styles.headerIconButton}
              >
                <Ionicons name="share-outline" size={24} color="#FFFCF9" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => navigation?.navigate?.('AddFriends')}
                style={styles.headerIconButton}
              >
                <Ionicons name="person-add-outline" size={24} color="#FFFCF9" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => navigation?.navigate?.('Settings')}
                style={styles.headerIconButton}
              >
                <Ionicons name="settings-outline" size={24} color="#FFFCF9" />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
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
        {/* Profile Info Section - Instagram Style */}
        <View style={styles.profileHeader}>
          {/* Left: Profile Picture */}
          <Image 
            source={{ 
              uri: profile.profile_photo_url || DEFAULT_PROFILE_IMAGE
            }} 
            style={styles.profilePicture} 
          />

          {/* Right: Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{profile.post_count}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.stat}
              onPress={() => navigation?.navigate?.('FollowList', { 
                username, 
                tab: 'followers' 
              })}
            >
              <Text style={styles.statNumber}>{profile.follower_count}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.stat}
              onPress={() => navigation?.navigate?.('FollowList', { 
                username, 
                tab: 'following' 
              })}
            >
              <Text style={styles.statNumber}>{profile.following_count}</Text>
              <Text style={styles.statLabel}>following</Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* Name and Bio */}
        <View style={styles.profileInfo}>
          <Text style={styles.displayName}>{profile.display_name}</Text>
          {profile.bio && (
            <Text style={styles.bio}>{profile.bio}</Text>
          )}
        </View>

      </ScrollView>

      {/* Expanded List Modal */}
      {expandedListId && (
        <ExpandedList
          listId={expandedListId}
          visible={!!expandedListId}
          onClose={() => setExpandedListId(null)}
        />
      )}

      {/* List Builder Modal */}
      <Modal
        visible={showListBuilder}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ListBuilder
          onComplete={() => {
            setShowListBuilder(false);
            fetchLists();
          }}
          onCancel={() => setShowListBuilder(false)}
        />
      </Modal>
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
  
  // Header - Instagram Style
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUsername: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFCF9',
    flex: 1,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconButton: {
    padding: 4,
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Profile Header - Instagram Style
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profilePicture: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#9562BB',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#999',
  },
  
  // Profile Info
  profileInfo: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 2,
  },
  bio: {
    fontSize: 14,
    color: '#FFFCF9',
    lineHeight: 18,
    marginTop: 2,
  },
  
  // Action Buttons - Instagram Style
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareProfileButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileButtonText: {
    color: '#FFFCF9',
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    flex: 1,
    backgroundColor: '#9562BB',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#1a1a1a',
  },
  followButtonText: {
    color: '#FFFCF9',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FFFCF9',
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Lists Section
  listsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  listsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
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