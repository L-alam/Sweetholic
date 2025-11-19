const API_URL = 'http://192.168.1.237:3000/api'; // Update this to match your backend URL


export interface CreatePostData {
  caption?: string;
  location_name?: string;
  location_coordinates?: { lat: number; lng: number };
  food_type?: string;
  price?: string;
  rating_type?: '3_star' | '5_star' | '10_star';
  rating?: number;
  is_public?: boolean;
  photos: {
    photo_url: string;
    photo_order: number;
    individual_description?: string;
    individual_rating?: number;
    is_front_camera: boolean;
  }[];
}

export const createPost = async (token: string, postData: CreatePostData) => {
  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create post');
    }

    return data;
  } catch (error) {
    console.error('Create post error:', error);
    throw error;
  }
};

export const getFeed = async (limit: number = 20, offset: number = 0) => {
  try {
    const response = await fetch(`${API_URL}/posts/feed?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch feed');
    }

    return data.data.posts;
  } catch (error) {
    console.error('Get feed error:', error);
    throw error;
  }
};