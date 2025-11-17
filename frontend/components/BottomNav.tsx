import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type TabType = 'feed' | 'explore' | 'post' | 'lists' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabChange('feed')}
      >
        <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
          Feed
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabChange('explore')}
      >
        <Text style={[styles.tabText, activeTab === 'explore' && styles.activeTabText]}>
          Explore
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabChange('post')}
      >
        <Text style={[styles.tabText, activeTab === 'post' && styles.activeTabText]}>
          Post
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabChange('lists')}
      >
        <Text style={[styles.tabText, activeTab === 'lists' && styles.activeTabText]}>
          Lists
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.tab} 
        onPress={() => onTabChange('profile')}
      >
        <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B9D',
    fontWeight: 'bold',
  },
});