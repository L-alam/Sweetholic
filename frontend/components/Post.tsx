import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Image,
  ScrollView,
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

type RatingType = 'none' | '3' | '5' | '10';

export function Post({ onComplete }: PostProps) {
  const [step, setStep] = useState<'camera' | 'builder'>('camera');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [mainCamera, setMainCamera] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();

  // Persistent item ratings
  const [foodItems, setFoodItems] = useState<Array<{id: string; name: string; price: string; rating: number}>>([]);
  const [ratingType, setRatingType] = useState<'none' | '3' | '5' | '10'>('none');
  
  const mainCameraRef = useRef<any>(null);

  React.useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const cropToAspectRatio = async (uri: string, shouldFlip: boolean = false): Promise<string> => {
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

      const actions: any[] = [
        {
          crop: {
            originX,
            originY,
            width: cropWidth,
            height: cropHeight,
          },
        },
      ];

      if (shouldFlip) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }

      const processedImage = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      return processedImage.uri;
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

      const shouldFlip = mainCamera === 'front';
      const croppedUri = await cropToAspectRatio(photo.uri, shouldFlip);
      const newImages = [...capturedImages, croppedUri];
      setCapturedImages(newImages);

      // If first photo and using back camera, switch to front to encourage selfie
      if (capturedImages.length === 0 && mainCamera === 'back') {
        setMainCamera('front');
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleDeleteImage = (index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(newImages);
  };

  const toggleCameraFacing = () => {
    setMainCamera(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const handleNext = () => {
    if (capturedImages.length === 0) {
      Alert.alert('No Photos', 'Please take at least one photo before continuing.');
      return;
    }
    setStep('builder');
  };

  const handleBackFromBuilder = () => {
    // Keep all images and ratings when going back from builder
    setMainCamera('back');
    setStep('camera');
  };

  if (step === 'builder') {
  return (
    <PostBuilder 
      images={capturedImages}
      onComplete={onComplete}
      onBack={handleBackFromBuilder}
      onImagesUpdate={setCapturedImages}
      foodItems={foodItems}
      ratingType={ratingType}
      onFoodItemsUpdate={setFoodItems}
      onRatingTypeUpdate={setRatingType}
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

            {/* Photo count indicator */}
            {capturedImages.length > 0 && (
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountText}>{capturedImages.length} photo(s)</Text>
              </View>
            )}

            {/* Thumbnail strip of captured photos */}
            {capturedImages.length > 0 && (
              <View style={styles.thumbnailStrip}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailContent}
                >
                  {capturedImages.map((uri, index) => (
                    <View key={index} style={styles.thumbnailWrapper}>
                      <Image 
                        source={{ uri }} 
                        style={styles.thumbnail}
                      />
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeleteImage(index)}
                      >
                        <Ionicons name="close" size={14} color="#FFFCF9" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
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

          {/* Next Button (shown after first photo) */}
          {capturedImages.length > 0 && (
            <TouchableOpacity
              onPress={handleNext}
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
  thumbnailStrip: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 5,
  },
  thumbnailContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnailWrapper: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFCF9',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 100,
    backgroundColor: '#000000',
    paddingTop: 10
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
    left: 20,
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