import { useState } from 'react';
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../utils/supabase';
import { createPost } from '../utils/api';

interface PostBuilderProps {
  images: string[];
  onComplete: () => void;
}

const foodCategories = ['Dessert', 'Cake', 'Ice Cream', 'Pastry', 'Chocolate', 'Candy', 'Cookies'];

export function PostBuilder({ images, onComplete }: PostBuilderProps) {
  const [caption, setCaption] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [ratingType, setRatingType] = useState<'3' | '5' | '10'>('5');
  const [rating, setRating] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  const { user, token } = useAuth();

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handlePost = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'You must be logged in to post');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }

    setIsPosting(true);

    try {
      // Upload all images to Supabase
      const uploadedPhotos = await Promise.all(
        images.map(async (imageUri, index) => {
          const isFrontCamera = index === 1; // Second image is front camera
          const photoUrl = await uploadImage(imageUri, user.id, token, isFrontCamera);
          
          return {
            photo_url: photoUrl,
            photo_order: index,
            is_front_camera: isFrontCamera,
            individual_description: index === 0 ? description : null,
            individual_rating: null,
          };
        })
      );

      // Create post with uploaded photo URLs
      const postData = {
        caption,
        location_name: location || null,
        food_type: selectedCategories.join(', ') || null,
        price: price || null,
        rating_type: rating > 0 ? `${ratingType}_star` as '3_star' | '5_star' | '10_star' : null,
        rating: rating > 0 ? rating : null,
        is_public: isPublic,
        photos: uploadedPhotos,
      };

      await createPost(token, postData);

      Alert.alert('Success', 'Post created successfully!', [
        { text: 'OK', onPress: onComplete }
      ]);
    } catch (error: any) {
      console.error('Post creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onComplete} disabled={isPosting}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity onPress={handlePost} disabled={isPosting}>
            {isPosting ? (
              <ActivityIndicator size="small" color="#6ec2f9" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Image Carousel */}
          <View style={styles.imageSection}>
            <Image source={{ uri: images[currentImageIndex] }} style={styles.image} />
            {images.length > 1 && (
              <View style={styles.imageIndicators}>
                {images.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setCurrentImageIndex(index)}
                    style={[
                      styles.indicator,
                      { backgroundColor: index === currentImageIndex ? '#6ec2f9' : '#e0e0e0' }
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Caption */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="What sweet did you try?"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesContainer}>
              {foodCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategories.includes(category) && styles.categoryChipSelected
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategories.includes(category) && styles.categoryTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="How was it?"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={1000}
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Where did you get it?"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="$0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          {/* Rating */}
          <View style={styles.section}>
            <View style={styles.ratingHeader}>
              <Text style={styles.sectionTitle}>Rating</Text>
              <View style={styles.ratingTypeButtons}>
                {(['3', '5', '10'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.ratingTypeButton,
                      ratingType === type && styles.ratingTypeButtonActive
                    ]}
                    onPress={() => {
                      setRatingType(type);
                      setRating(0); // Reset rating when changing type
                    }}
                  >
                    <Text style={[
                      styles.ratingTypeText,
                      ratingType === type && styles.ratingTypeTextActive
                    ]}>
                      {type}★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.starsContainer}>
              {Array.from({ length: parseInt(ratingType) }).map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setRating(index + 1)}
                >
                  <Ionicons
                    name={index < rating ? 'star' : 'star-outline'}
                    size={40}
                    color={index < rating ? '#FFD700' : '#ccc'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Public/Private Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <Text style={styles.sectionTitle}>Public Post</Text>
              <TouchableOpacity
                style={[styles.toggle, isPublic && styles.toggleActive]}
                onPress={() => setIsPublic(!isPublic)}
              >
                <View style={[styles.toggleThumb, isPublic && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {isPublic ? 'Everyone can see this post' : 'Only you can see this post'}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6ec2f9',
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  captionInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  input: {
    fontSize: 16,
    color: '#000',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipSelected: {
    backgroundColor: '#6ec2f9',
    borderColor: '#6ec2f9',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  ratingTypeButtonActive: {
    backgroundColor: '#6ec2f9',
    borderColor: '#6ec2f9',
  },
  ratingTypeText: {
    fontSize: 14,
    color: '#666',
  },
  ratingTypeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#6ec2f9',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});