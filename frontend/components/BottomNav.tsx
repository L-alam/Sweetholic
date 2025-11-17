import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'feed' | 'explore' | 'post' | 'lists' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'feed' as const, icon: 'home-outline', activeIcon: 'home', label: 'Feed' },
    { id: 'explore' as const, icon: 'map-outline', activeIcon: 'map', label: 'Explore' },
    { id: 'post' as const, icon: 'add-circle-outline', activeIcon: 'add-circle', label: 'Post' },
    { id: 'lists' as const, icon: 'list-outline', activeIcon: 'list', label: 'Lists' },
    { id: 'profile' as const, icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabChange(tab.id)}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={24}
              color={isActive ? '#6ec2f9' : '#000'}
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    color: '#000',
    marginTop: 4,
  },
  activeLabel: {
    color: '#6ec2f9',
    fontWeight: 'bold',
  },
});