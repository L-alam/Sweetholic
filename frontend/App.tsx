import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Feed } from './components/Feed';
import { Explore } from './components/Explore';
import { Post } from './components/Post';
import { Lists } from './components/Lists';
import { Profile } from './components/Profile';
import { LoginScreen } from './components/LoginScreen';
import { BottomNav } from './components/BottomNav';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'post' | 'lists' | 'profile'>('feed');
  
  // Show loading spinner while checking auth
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9562BB" />
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
      <StatusBar style="light" />
      <View style={styles.content}>
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'explore' && <Explore />}
        {activeTab === 'post' && <Post onComplete={() => setActiveTab('feed')} />}
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
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});