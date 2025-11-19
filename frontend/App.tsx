import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Feed } from './components/Feed';
import { Explore } from './components/Explore';
import { Post } from './components/Post';
import { Lists } from './components/Lists';
import { Profile } from './components/Profile';
import { BottomNav } from './components/BottomNav';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'post' | 'lists' | 'profile'>('feed');
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  // Show main app if authenticated
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

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});