import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { Feed } from './components/Feed';
import { Explore } from './components/Explore';
import { Post } from './components/Post';
import { Lists } from './components/Lists';
import { Profile } from './components/Profile';
import { BottomNav } from './components/BottomNav';

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'post' | 'lists' | 'profile'>('feed');
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'explore' && <Explore />}
        {activeTab === 'post' && <Post />}
        {activeTab === 'lists' && <Lists />}
        {activeTab === 'profile' && <Profile />}
      </View>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});