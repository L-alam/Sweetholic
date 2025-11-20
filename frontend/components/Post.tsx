import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  PanResponder,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { PostBuilder } from './PostBuilder';

interface PostProps {
  onComplete: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const ASPECT_RATIO = 5 / 7;
const CAMERA_HEIGHT = SCREEN_WIDTH / ASPECT_RATIO;

export function Post({ onComplete }: PostProps) {
  const [step, setStep] = useState<'camera' | 'builder'>('camera');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [mainCamera, setMainCamera] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [previewSnapshot, setPreviewSnapshot] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  const mainCameraRef = useRef<any>(null);

  // Preview camera position (draggable)
  const [previewPosition, setPreviewPosition] = useState({ x: SCREEN_WIDTH - 130, y: 20 });
  const pan = useRef(new Animated.ValueXY(previewPosition)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: previewPosition.x,
          y: previewPosition.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const newX = Math.max(10, Math.min(SCREEN_WIDTH - 110, previewPosition.x + gesture.dx));
        const newY = Math.max(10, Math.min(CAMERA_HEIGHT - 160, previewPosition.y + gesture.dy));
        setPreviewPosition({ x: newX, y: newY });
        pan.setValue({ x: newX, y: newY });
      },
    })
  ).current;

  React.useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Take a snapshot when switching cameras to show in preview
  const takePreviewSnapshot = async () => {
    if (!mainCameraRef.current) return;
    
    try {
      const photo = await mainCameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: false,
      });
      setPreviewSnapshot(photo.uri);
    } catch (error) {
      console.error('Preview snapshot error:', error);
    }
  };

  const cropToAspectRatio = async (uri: string): Promise<string> => {
    try {
      const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const { width, height } = imageInfo;
      const targetRatio = ASPECT_RATIO;
      const currentRatio = width / height;

      let cropWidth = width;
      let cropHeight = height;
      let originX = 0;
      let originY = 0;

      if (currentRatio > targetRatio) {
        cropWidth = height * targetRatio;
        originX = (width - cropWidth) / 2;
      } else {
        cropHeight = width / targetRatio;
        originY = (height - cropHeight) / 2;
      }

      const croppedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX,
              originY,
              width: cropWidth,
              height: cropHeight,
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      return croppedImage.uri;
    } catch (error) {
      console.error('Crop error:', error);
      return uri;
    }
  };

  const handleCapture = async () => {
    if (!mainCameraRef.current) return;

    try {
      const photo = await mainCameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      const croppedUri = await cropToAspectRatio(photo.uri);
      setCapturedImages([...capturedImages, croppedUri]);

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
        setStep('builder');
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const toggleCameraFacing = async () => {
    // Take snapshot before switching
    await takePreviewSnapshot();
    setMainCamera(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  if (step === 'builder') {
    return (
      <PostBuilder 
        images={capturedImages} 
        onComplete={onComplete}
        onBack={() => {
          setCapturedImages([]);
          setStep('camera');
          setPreviewSnapshot(null);
        }}
      />
    );
  }

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
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.mainContainer}>
          {/* Close button */}
          <TouchableOpacity
            onPress={onComplete}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={32} color="#FFFCF9" />
          </TouchableOpacity>

          {/* Main Camera View (5:7 aspect ratio) */}
          <View style={styles.cameraFrame}>
            <CameraView
              ref={mainCameraRef}
              style={styles.mainCamera}
              facing={mainCamera}
              flash={flash}
            />

            {/* Small Preview (shows snapshot or placeholder) */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.previewCamera,
                {
                  left: pan.x,
                  top: pan.y,
                },
              ]}
            >
              {previewSnapshot ? (
                <Image 
                  source={{ uri: previewSnapshot }} 
                  style={styles.previewSnapshot}
                />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Ionicons 
                    name={mainCamera === 'back' ? 'person-outline' : 'camera-outline'} 
                    size={32} 
                    color="#9562BB" 
                  />
                </View>
              )}
            </Animated.View>

            {/* Photo count indicator */}
            {capturedImages.length > 0 && (
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountText}>{capturedImages.length} photo(s)</Text>
              </View>
            )}
          </View>

          {/* Bottom Controls Bar */}
          <View style={styles.controlsBar}>
            {/* Flash Toggle */}
            <TouchableOpacity onPress={toggleFlash} style={styles.sideControl}>
              <Ionicons 
                name={flash === 'off' ? 'flash-off' : flash === 'on' ? 'flash' : 'flash-outline'} 
                size={32} 
                color="#FFFCF9" 
              />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity
              onPress={handleCapture}
              style={styles.captureButton}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Flip Camera */}
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.sideControl}>
              <Ionicons name="camera-reverse-outline" size={32} color="#FFFCF9" />
            </TouchableOpacity>
          </View>

          {/* Next Button (if photos captured) */}
          {capturedImages.length > 0 && (
            <TouchableOpacity
              onPress={() => setStep('builder')}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFCF9" />
            </TouchableOpacity>
          )}
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
  mainContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  cameraFrame: {
    width: SCREEN_WIDTH,
    height: CAMERA_HEIGHT,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    position: 'relative',
    overflow: 'hidden',
  },
  mainCamera: {
    flex: 1,
  },
  previewCamera: {
    position: 'absolute',
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFCF9',
    zIndex: 10,
  },
  previewSnapshot: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCountBadge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(149, 98, 187, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 5,
  },
  photoCountText: {
    color: '#FFFCF9',
    fontSize: 14,
    fontWeight: '600',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 30,
    backgroundColor: '#000000',
  },
  sideControl: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 5,
    borderColor: '#FFFCF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFCF9',
  },
  nextButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#9562BB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 20,
  },
  nextButtonText: {
    color: '#FFFCF9',
    fontSize: 16,
    fontWeight: '600',
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
});