import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI } from '../utils/api';
import Slider from '@react-native-community/slider';

// Supabase config
const SUPABASE_URL = 'https://rfaqyqjzpearnrpbetnq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYXF5cWp6cGVhcm5ycGJldG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzQ0MjMsImV4cCI6MjA3ODY1MDQyM30.xh1yD26tWdZrX5FIJpyY01q0xt5X6Eg8glhBTkutajw';

interface PostBuilderProps {
  images: string[];
  onComplete: () => void;
  onBack: () => void;
}

const foodCategories = ['Dessert', 'Cake', 'Ice Cream', 'Pastry', 'Chocolate', 'Candy', 'Cookies', 'Boba', 'Coffee'];

export function PostBuilder({ images, onComplete, onBack }: PostBuilderProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [foodDescription, setFoodDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [ratingType, setRatingType] = useState<'3' | '5' | '10'>('5');
  const [rating, setRating] = useState(0);
  const [perPhotoRatings, setPerPhotoRatings] = useState<number[]>(images.map(() => 0));
  const [privacyMode, setPrivacyMode] = useState<'private' | 'friends'>('friends');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const formatPrice = (text: string) => {
    // Remove all non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return price; // Don't update if multiple decimals
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return `${parts[0]}.${parts[1].substring(0, 2)}`;
    }
    
    return cleaned;
  };

  const handlePriceChange = (text: string) => {
    const formatted = formatPrice(text);
    setPrice(formatted);
  };

  const getDisplayPrice = () => {
    if (!price) return '';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return '';
    return `$${numPrice.toFixed(2)}`;
  };

  const updatePerPhotoRating = (photoIndex: number, newRating: number) => {
    const updated = [...perPhotoRatings];
    updated[photoIndex] = newRating;
    setPerPhotoRatings(updated);
  };

  const renderStars = (currentRating: number, maxStars: number, onRatingChange: (rating: number) => void) => {
    const stars = [];
    const fullStars = Math.floor(currentRating);
    const hasHalfStar = currentRating % 1 >= 0.5;

    for (let i = 0; i < maxStars; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <TouchableOpacity key={i} onPress={() => onRatingChange(i + 1)}>
            <Ionicons name="star" size={28} color="#ffd93d" />
          </TouchableOpacity>
        );
      } else if (i === fullStars && hasHalfStar) {
        // Half star
        stars.push(
          <TouchableOpacity key={i} onPress={() => onRatingChange(i + 1)}>
            <Ionicons name="star-half" size={28} color="#ffd93d" />
          </TouchableOpacity>
        );
      } else {
        // Empty star
        stars.push(
          <TouchableOpacity key={i} onPress={() => onRatingChange(i + 1)}>
            <Ionicons name="star-outline" size={28} color="#666" />
          </TouchableOpacity>
        );
      }
    }

    return stars;
  };

  const uploadImageToSupabase = async (imageUri: string, index: number): Promise<string> => {
    try {
      const timestamp = Date.now();
      const filename = `${user?.id}/${timestamp}_${index}.jpg`;

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `photo_${index}.jpg`,
      } as any);

      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/post-photos/${filename}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Upload error response:', error);
        throw new Error(`Upload failed: ${error}`);
      }

      return `${SUPABASE_URL}/storage/v1/object/public/post-photos/${filename}`;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handlePost = async () => {
    if (!user?.token) {
      Alert.alert('Error', 'You must be logged in to post');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls = await Promise.all(
        images.map((imageUri, index) => uploadImageToSupabase(imageUri, index))
      );

      const postData = {
        caption: caption.trim(),
        location_name: location.trim() || undefined,
        food_type: selectedCategory || undefined,
        price: price ? `$${parseFloat(price).toFixed(2)}` : undefined,
        rating_type: `${ratingType}_star` as '3_star' | '5_star' | '10_star',
        rating: rating > 0 ? rating : undefined,
        is_public: privacyMode === 'friends',
        photos: uploadedUrls.map((url, index) => ({
          photo_url: url,
          photo_order: index,
          individual_description: index === 0 ? foodDescription.trim() || undefined : undefined,
          individual_rating: perPhotoRatings[index] > 0 ? perPhotoRatings[index] : undefined,
          is_front_camera: false,
        })),
      };

      const response = await postsAPI.createPost(user.token, postData);

      if (response.success) {
        Alert.alert('Success', 'Post created successfully!');
        onComplete();
      } else {
        throw new Error(response.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Post creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} disabled={uploading}>
              <Ionicons name="arrow-back" size={24} color="#FFFCF9" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Post</Text>
            <TouchableOpacity 
              onPress={handlePost}
              disabled={uploading || !caption.trim()}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#9562BB" />
              ) : (
                <Text style={[
                  styles.postButton,
                  (!caption.trim()) && styles.postButtonDisabled
                ]}>
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Image Carousel with Add More Button */}
              <View style={styles.imageSection}>
                <View style={styles.carouselContainer}>
                  {/* Add More Photos Button */}
                  <TouchableOpacity 
                    style={styles.addMoreButton}
                    onPress={onBack}
                  >
                    <Ionicons name="add-circle" size={32} color="#9562BB" />
                  </TouchableOpacity>

                  {/* Current Image */}
                  <Image
                    source={{ uri: images[currentImageIndex] }}
                    style={styles.image}
                  />
                </View>

                {/* Image Indicators */}
                {images.length > 1 && (
                  <View style={styles.imageIndicators}>
                    {images.map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setCurrentImageIndex(index)}
                        style={[
                          styles.indicator,
                          {
                            backgroundColor: index === currentImageIndex ? '#9562BB' : '#333',
                          }
                        ]}
                      />
                    ))}
                  </View>
                )}

                {/* Per-Photo Rating */}
                <View style={styles.perPhotoRatingSection}>
                  <Text style={styles.perPhotoLabel}>Rate this photo</Text>
                  <View style={styles.sliderContainer}>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={parseInt(ratingType)}
                      step={0.5}
                      value={perPhotoRatings[currentImageIndex]}
                      onValueChange={(value) => updatePerPhotoRating(currentImageIndex, value)}
                      minimumTrackTintColor="#9562BB"
                      maximumTrackTintColor="#333"
                      thumbTintColor="#9562BB"
                    />
                    <View style={styles.starsDisplay}>
                      {renderStars(
                        perPhotoRatings[currentImageIndex],
                        parseInt(ratingType),
                        (rating) => updatePerPhotoRating(currentImageIndex, rating)
                      )}
                      <Text style={styles.ratingText}>
                        {perPhotoRatings[currentImageIndex].toFixed(1)} / {ratingType}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Caption */}
              <View style={styles.section}>
                <Text style={styles.label}>Caption *</Text>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Tell us about this sweet treat..."
                  placeholderTextColor="#666"
                  style={styles.textArea}
                  multiline
                  maxLength={500}
                />
                <Text style={styles.charCount}>{caption.length}/500</Text>
              </View>

              {/* Food Categories */}
              <View style={styles.section}>
                <Text style={styles.label}>Food Category</Text>
                <View style={styles.categoriesContainer}>
                  {foodCategories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => setSelectedCategory(category)}
                      style={[
                        styles.categoryButton,
                        selectedCategory === category && styles.categoryButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.categoryText,
                        selectedCategory === category && styles.categoryTextActive
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Food Description */}
              <View style={styles.section}>
                <Text style={styles.label}>Item Name</Text>
                <TextInput
                  value={foodDescription}
                  onChangeText={setFoodDescription}
                  placeholder="e.g. Matcha Tiramisu"
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>

              {/* Price */}
              <View style={styles.section}>
                <Text style={styles.label}>Price</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    value={price}
                    onChangeText={handlePriceChange}
                    placeholder="0.00"
                    placeholderTextColor="#666"
                    keyboardType="decimal-pad"
                    style={styles.priceInput}
                  />
                </View>
                {price && (
                  <Text style={styles.pricePreview}>{getDisplayPrice()}</Text>
                )}
              </View>

              {/* Location */}
              <View style={styles.section}>
                <Text style={styles.label}>Location</Text>
                <View style={styles.locationInput}>
                  <Ionicons name="location" size={20} color="#9562BB" />
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Where did you get this?"
                    placeholderTextColor="#666"
                    style={styles.locationTextInput}
                  />
                </View>
              </View>

              {/* Overall Rating */}
              <View style={styles.section}>
                <Text style={styles.label}>Overall Rating</Text>
                <View style={styles.ratingTypeButtons}>
                  {(['3', '5', '10'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => {
                        setRatingType(type);
                        setRating(0);
                        setPerPhotoRatings(images.map(() => 0));
                      }}
                      style={[
                        styles.ratingTypeButton,
                        ratingType === type && styles.ratingTypeButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.ratingTypeText,
                        ratingType === type && styles.ratingTypeTextActive
                      ]}>
                        {type} Stars
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={parseInt(ratingType)}
                    step={0.5}
                    value={rating}
                    onValueChange={setRating}
                    minimumTrackTintColor="#9562BB"
                    maximumTrackTintColor="#333"
                    thumbTintColor="#9562BB"
                  />
                  <View style={styles.starsDisplay}>
                    {renderStars(rating, parseInt(ratingType), setRating)}
                    <Text style={styles.ratingText}>
                      {rating.toFixed(1)} / {ratingType}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Privacy Toggle */}
              <View style={styles.section}>
                <Text style={styles.label}>Privacy</Text>
                <View style={styles.privacyButtons}>
                  <TouchableOpacity
                    onPress={() => setPrivacyMode('private')}
                    style={[
                      styles.privacyButton,
                      privacyMode === 'private' && styles.privacyButtonActive
                    ]}
                  >
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={privacyMode === 'private' ? '#FFFCF9' : '#999'} 
                    />
                    <Text style={[
                      styles.privacyText,
                      privacyMode === 'private' && styles.privacyTextActive
                    ]}>
                      Private
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPrivacyMode('friends')}
                    style={[
                      styles.privacyButton,
                      privacyMode === 'friends' && styles.privacyButtonActive
                    ]}
                  >
                    <Ionicons 
                      name="people-outline" 
                      size={20} 
                      color={privacyMode === 'friends' ? '#FFFCF9' : '#999'} 
                    />
                    <Text style={[
                      styles.privacyText,
                      privacyMode === 'friends' && styles.privacyTextActive
                    ]}>
                      Friends
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Share Button */}
              <TouchableOpacity
                onPress={handlePost}
                disabled={uploading || !caption.trim()}
                style={[
                  styles.shareButton,
                  (uploading || !caption.trim()) && styles.shareButtonDisabled
                ]}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFCF9" />
                ) : (
                  <Text style={styles.shareButtonText}>Share Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFCF9',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9562BB',
  },
  postButtonDisabled: {
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  imageSection: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  carouselContainer: {
    position: 'relative',
  },
  addMoreButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  image: {
    width: '100%',
    aspectRatio: 5 / 7,
    backgroundColor: '#1a1a1a',
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  perPhotoRatingSection: {
    padding: 16,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  perPhotoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  sliderContainer: {
    gap: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  starsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#FFFCF9',
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFCF9',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFCF9',
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  dollarSign: {
    fontSize: 18,
    color: '#9562BB',
    fontWeight: '600',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFCF9',
  },
  pricePreview: {
    fontSize: 12,
    color: '#9562BB',
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
  },
  categoryButtonActive: {
    backgroundColor: '#9562BB',
  },
  categoryText: {
    fontSize: 14,
    color: '#999',
  },
  categoryTextActive: {
    color: '#FFFCF9',
    fontWeight: '600',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  locationTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFCF9',
  },
  ratingTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  ratingTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  ratingTypeButtonActive: {
    backgroundColor: '#9562BB',
  },
  ratingTypeText: {
    fontSize: 14,
    color: '#999',
  },
  ratingTypeTextActive: {
    color: '#FFFCF9',
    fontWeight: '600',
  },
  privacyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  privacyButtonActive: {
    backgroundColor: '#9562BB',
  },
  privacyText: {
    fontSize: 15,
    color: '#999',
  },
  privacyTextActive: {
    color: '#FFFCF9',
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#9562BB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  shareButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
  },
});