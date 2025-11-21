import React, { useState, useRef } from 'react';
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
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { postsAPI } from '../utils/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Supabase config
const SUPABASE_URL = 'https://rfaqyqjzpearnrpbetnq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYXF5cWp6cGVhcm5ycGJldG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzQ0MjMsImV4cCI6MjA3ODY1MDQyM30.xh1yD26tWdZrX5FIJpyY01q0xt5X6Eg8glhBTkutajw';

interface PostBuilderProps {
  images: string[];
  onComplete: () => void;
  onBack: () => void;
  onImagesUpdate: (images: string[]) => void;
  foodItems: FoodItem[];
  ratingType: 'none' | '3' | '5' | '10';
  onFoodItemsUpdate: (items: FoodItem[]) => void;
  onRatingTypeUpdate: (type: 'none' | '3' | '5' | '10') => void;
}

const foodCategories = ['Dessert', 'Cake', 'Ice Cream', 'Pastry', 'Chocolate', 'Candy', 'Cookies', 'Boba', 'Coffee'];

type RatingType = 'none' | '3' | '5' | '10';

interface FoodItem {
  id: string;
  name: string;
  price: string;
  rating: number;
}

export function PostBuilder({ 
  images, 
  onComplete, 
  onBack, 
  onImagesUpdate,
  foodItems,
  ratingType,
  onFoodItemsUpdate,
  onRatingTypeUpdate
}: PostBuilderProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [location, setLocation] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'private' | 'friends'>('friends');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  // Modal state for adding items
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);

  // Swipeable carousel
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentImageIndex && index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
    }
  };

  const formatPrice = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return text;
    }
    if (parts[1] && parts[1].length > 2) {
      return `${parts[0]}.${parts[1].substring(0, 2)}`;
    }
    return cleaned;
  };

  const getDisplayPrice = (price: string) => {
    if (!price) return '';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return '';
    return `$${numPrice.toFixed(2)}`;
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const newItem: FoodItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      price: newItemPrice,
      rating: 0,
    };

    onFoodItemsUpdate([...foodItems, newItem]);
    setNewItemName('');
    setNewItemPrice('');
    setShowAddItemModal(false);
  };

  const handleDeleteItem = (itemId: string) => {
    onFoodItemsUpdate(foodItems.filter(item => item.id !== itemId));
  };

  const updateItemRating = (itemId: string, newRating: number) => {
    onFoodItemsUpdate(foodItems.map(item => 
      item.id === itemId ? { ...item, rating: newRating } : item
    ));
  };

  const handleRatingTypeChange = (newType: RatingType) => {
    onRatingTypeUpdate(newType);
    // Reset all item ratings when changing type
    onFoodItemsUpdate(foodItems.map(item => ({ ...item, rating: 0 })));
  };

  const handleStarPress = (itemId: string, starIndex: number) => {
    if (ratingType === 'none') return;
    const newRating = starIndex + 1;
    updateItemRating(itemId, newRating);
  };

  const renderStars = (itemId: string, currentRating: number, maxStars: number) => {
    const stars = [];
    const starSize = 18;

    for (let i = 0; i < maxStars; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => handleStarPress(itemId, i)}>
          <Ionicons 
            name={i < currentRating ? "star" : "star-outline"} 
            size={starSize} 
            color={i < currentRating ? "#ffd93d" : "#666"} 
          />
        </TouchableOpacity>
      );
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

      // Prepare items description for caption or first photo
      let itemsDescription = '';
      if (foodItems.length > 0) {
        itemsDescription = '\n\nItems:\n' + foodItems.map(item => {
          let desc = `• ${item.name}`;
          if (item.price) desc += ` - ${getDisplayPrice(item.price)}`;
          if (ratingType !== 'none' && item.rating > 0) desc += ` (${item.rating}/${ratingType}★)`;
          return desc;
        }).join('\n');
      }

      const postData = {
        caption: caption.trim() + itemsDescription,
        location_name: location.trim() || undefined,
        food_type: selectedCategory || undefined,
        price: foodItems.length > 0 && foodItems[0].price ? getDisplayPrice(foodItems[0].price) : undefined,
        rating_type: ratingType !== 'none' ? `${ratingType}_star` as '3_star' | '5_star' | '10_star' : undefined,
        rating: ratingType !== 'none' && foodItems.length > 0 && foodItems[0].rating > 0 ? foodItems[0].rating : undefined,
        is_public: privacyMode === 'friends',
        photos: uploadedUrls.map((url, index) => ({
          photo_url: url,
          photo_order: index,
          individual_description: undefined,
          individual_rating: undefined,
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
              {/* Swipeable Image Carousel */}
              <View style={styles.imageSection}>
                <ScrollView
                  ref={scrollViewRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  style={styles.carouselScrollView}
                >
                  {images.map((uri, index) => (
                    <View key={index} style={styles.carouselPage}>
                      <Image source={{ uri }} style={styles.image} />
                    </View>
                  ))}
                </ScrollView>

                {/* Add More Photos Button */}
                <TouchableOpacity 
                  style={styles.addMoreButton}
                  onPress={onBack}
                >
                  <Ionicons name="add-circle" size={32} color="#9562BB" />
                </TouchableOpacity>

                {/* Image Indicators */}
                {images.length > 1 && (
                  <View style={styles.imageIndicators}>
                    {images.map((_, index) => (
                      <View
                        key={index}
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

              {/* Food Category */}
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

              {/* Add Items Section */}
              <View style={styles.section}>
                <View style={styles.itemsHeader}>
                  <Text style={styles.label}>Items</Text>
                  {foodItems.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => {
                        if (ratingType === 'none') {
                          Alert.alert(
                            'Add Rating Scale',
                            'Choose a rating scale for all items:',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: '3 Stars', onPress: () => handleRatingTypeChange('3') },
                              { text: '5 Stars', onPress: () => handleRatingTypeChange('5') },
                              { text: '10 Stars', onPress: () => handleRatingTypeChange('10') },
                            ]
                          );
                        } else {
                          handleRatingTypeChange('none');
                        }
                      }}
                      style={styles.ratingScaleButton}
                    >
                      <Ionicons 
                        name={ratingType === 'none' ? "star-outline" : "star"} 
                        size={16} 
                        color="#9562BB" 
                      />
                      <Text style={styles.ratingScaleButtonText}>
                        {ratingType === 'none' ? 'Add Rating' : `${ratingType}★ Scale`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* List of added items */}
                {foodItems.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {item.price && (
                          <Text style={styles.itemPrice}>{getDisplayPrice(item.price)}</Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                        <Ionicons name="close-circle" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Rating stars for this item */}
                    {ratingType !== 'none' && (
                      <View style={styles.itemStars}>
                        {renderStars(item.id, item.rating, parseInt(ratingType))}
                        <Text style={styles.itemRatingText}>
                          {item.rating > 0 ? `${item.rating}/${ratingType}` : 'Not rated'}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Add Item Button */}
                <TouchableOpacity 
                  style={styles.addItemButton}
                  onPress={() => setShowAddItemModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#9562BB" />
                  <Text style={styles.addItemButtonText}>Add Item</Text>
                </TouchableOpacity>
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

        {/* Add Item Modal */}
        <Modal
          visible={showAddItemModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddItemModal(false)}
        >
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
          
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Item</Text>
                <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                  <Ionicons name="close" size={24} color="#FFFCF9" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Item Name *</Text>
                <TextInput
                  value={newItemName}
                  onChangeText={setNewItemName}
                  placeholder="e.g. Matcha Tiramisu"
                  placeholderTextColor="#666"
                  style={styles.modalInput}
                />

                <Text style={styles.modalLabel}>Price</Text>
                <View style={styles.modalPriceInput}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    value={newItemPrice}
                    onChangeText={(text) => setNewItemPrice(formatPrice(text))}
                    placeholder="0.00"
                    placeholderTextColor="#666"
                    keyboardType="decimal-pad"
                    style={styles.priceInput}
                  />
                </View>

                <TouchableOpacity 
                  style={styles.modalAddButton}
                  onPress={handleAddItem}
                >
                  <Text style={styles.modalAddButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>
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
    paddingBottom: 32,
  },
  imageSection: {
    marginBottom: 24,
    backgroundColor: '#000000',
  },
  carouselScrollView: {
    width: SCREEN_WIDTH,
  },
  carouselPage: {
    width: SCREEN_WIDTH,
  },
  image: {
    width: SCREEN_WIDTH,
    aspectRatio: 5 / 7,
    backgroundColor: '#1a1a1a',
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 8,
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
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingScaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
  },
  ratingScaleButtonText: {
    fontSize: 13,
    color: '#9562BB',
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#9562BB',
    fontWeight: '500',
  },
  itemStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  itemRatingText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 8,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#333',
  },
  addItemButtonText: {
    fontSize: 15,
    color: '#9562BB',
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
    marginHorizontal: 16,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFCF9',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFCF9',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFCF9',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalPriceInput: {
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
  modalAddButton: {
    backgroundColor: '#9562BB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFCF9',
  },
});