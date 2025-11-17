import { useState } from 'react';
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

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

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handlePost = () => {
    // In real app, would save the post to backend
    console.log('Posting:', { caption, selectedCategories, description, price, location, rating, isPublic });
    onComplete();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onComplete}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity onPress={handlePost}>
            <Text style={styles.postButtonText}>Post</Text>
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
            <Text style={styles.label}>Caption</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us about this sweet treat..."
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
          </View>

          {/* Food Categories */}
          <View style={styles.section}>
            <Text style={styles.label}>Food Categories</Text>
            <View style={styles.categoryContainer}>
              {foodCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => toggleCategory(category)}
                  style={[
                    styles.categoryBadge,
                    selectedCategories.includes(category) && styles.categoryBadgeActive
                  ]}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategories.includes(category) && styles.categoryTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Food Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Food Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Matcha Tiramisu"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#999"
            />
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="$0.00"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.locationInput}>
              <Ionicons name="location" size={20} color="#6ec2f9" />
              <TextInput
                style={styles.locationText}
                placeholder="Add location"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Rating */}
          <View style={styles.section}>
            <Text style={styles.label}>Rating</Text>
            <View style={styles.ratingTypeContainer}>
              {(['3', '5', '10'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => {
                    setRatingType(type);
                    setRating(0);
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
            <View style={styles.starsContainer}>
              {Array.from({ length: parseInt(ratingType) }).map((_, index) => (
                <TouchableOpacity key={index} onPress={() => setRating(index + 1)}>
                  <Ionicons
                    name={index < rating ? 'star' : 'star-outline'}
                    size={32}
                    color={index < rating ? '#ffd93d' : '#e0e0e0'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacy Toggle */}
          <View style={styles.section}>
            <Text style={styles.label}>Privacy</Text>
            <View style={styles.privacyContainer}>
              <TouchableOpacity
                onPress={() => setIsPublic(true)}
                style={[
                  styles.privacyButton,
                  isPublic && styles.privacyButtonActive
                ]}
              >
                <Ionicons name="globe-outline" size={20} color={isPublic ? '#fff' : '#000'} />
                <Text style={[
                  styles.privacyText,
                  isPublic && styles.privacyTextActive
                ]}>
                  Public
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setIsPublic(false)}
                style={[
                  styles.privacyButton,
                  !isPublic && styles.privacyButtonActive
                ]}
              >
                <Ionicons name="lock-closed-outline" size={20} color={!isPublic ? '#fff' : '#000'} />
                <Text style={[
                  styles.privacyText,
                  !isPublic && styles.privacyTextActive
                ]}>
                  Private
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={handlePost}>
            <Text style={styles.shareButtonText}>Share Post</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#6ec2f9',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 12,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  categoryBadgeActive: {
    backgroundColor: '#6ec2f9',
  },
  categoryText: {
    fontSize: 14,
    color: '#000',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
  },
  ratingTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  ratingTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  ratingTypeButtonActive: {
    backgroundColor: '#6ec2f9',
  },
  ratingTypeText: {
    fontSize: 14,
    color: '#000',
  },
  ratingTypeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  privacyButtonActive: {
    backgroundColor: '#6ec2f9',
  },
  privacyText: {
    fontSize: 15,
    color: '#000',
  },
  privacyTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  shareButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#6ec2f9',
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});