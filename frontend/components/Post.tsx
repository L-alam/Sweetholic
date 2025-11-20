import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { PostBuilder } from './PostBuilder';

interface PostProps {
  onComplete: () => void;
}

export function Post({ onComplete }: PostProps) {
  const [step, setStep] = useState<'camera' | 'builder'>('camera');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Request camera permissions on mount
  React.useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      setCapturedImages([...capturedImages, photo.uri]);

      // If first photo, stay on camera for optional second photo
      if (capturedImages.length === 0) {
        Alert.alert(
          'Great!',
          'Want to add another photo? (Optional)',
          [
            { text: 'Skip', onPress: () => setStep('builder') },
            { text: 'Add Another', style: 'default' },
          ]
        );
      } else {
        // Second photo captured, go to builder
        setStep('builder');
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map(asset => asset.uri);
      setCapturedImages([...capturedImages, ...uris]);
      setStep('builder');
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (step === 'builder') {
    return (
      <PostBuilder 
        images={capturedImages} 
        onComplete={onComplete}
        onBack={() => {
          setCapturedImages([]);
          setStep('camera');
        }}
      />
    );
  }

  // Show permission request screen
  if (!permission) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#666" />
            <Text style={styles.permissionText}>Loading camera...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#9562BB" />
            <Text style={styles.permissionText}>Camera permission required</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
              <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.cameraContainer}>
          {/* Camera View */}
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          />

          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              onPress={onComplete}
              style={styles.topButton}
            >
              <Ionicons name="close" size={28} color="#FFFCF9" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleCameraFacing}
              style={styles.topButton}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="#FFFCF9" />
            </TouchableOpacity>
          </View>

          {/* Photo count indicator */}
          {capturedImages.length > 0 && (
            <View style={styles.photoCountBadge}>
              <Text style={styles.photoCountText}>{capturedImages.length} photo(s)</Text>
            </View>
          )}

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={styles.galleryButton}
            >
              <Ionicons name="images-outline" size={28} color="#FFFCF9" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCapture}
              style={styles.captureButton}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {capturedImages.length > 0 ? (
              <TouchableOpacity
                onPress={() => setStep('builder')}
                style={styles.nextButton}
              >
                <Ionicons name="arrow-forward" size={28} color="#FFFCF9" />
              </TouchableOpacity>
            ) : (
              <View style={styles.galleryButton} />
            )}
          </View>
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
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionText: {
    fontSize: 18,
    color: '#FFFCF9',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#9562BB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#FFFCF9',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#9562BB',
    fontSize: 16,
    fontWeight: '600',
  },
  topControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(149, 98, 187, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  photoCountText: {
    color: '#FFFCF9',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFCF9',
    borderWidth: 4,
    borderColor: '#9562BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFCF9',
  },
  nextButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9562BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});