import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

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
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 overflow-hidden">
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'explore' && <Explore />}
        {activeTab === 'post' && <Post/>}
        {activeTab === 'lists' && <Lists />}
        {activeTab === 'profile' && <Profile />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}