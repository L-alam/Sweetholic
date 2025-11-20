// API Configuration
const API_URL = 'http://192.168.1.237:3000/api'; // Update this to match your backend URL

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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

export interface UpdatePostData {
  caption?: string;
  location_name?: string;
  food_type?: string;
  price?: string;
  rating?: number;
  is_public?: boolean;
}

export interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  profile_photo_url?: string;
}

export interface CreateListData {
  title: string;
  description?: string;
  cover_photo_url?: string;
  is_public?: boolean;
}

export interface UpdateListData {
  title?: string;
  description?: string;
  cover_photo_url?: string;
  is_public?: boolean;
}

export interface CreateCommentData {
  content: string;
}

export interface ReactionType {
  reaction_type: 'heart' | 'thumbs_up' | 'star_eyes' | 'jealous' | 'dislike';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }
  return data;
};

const getAuthHeaders = (token?: string) => {
  const headers: HeadersInit_ = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  signup: async (username: string, email: string, password: string, display_name?: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username, email, password, display_name }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, password }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  getCurrentUser: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
};

// ============================================================================
// USERS API
// ============================================================================

export const usersAPI = {
  getProfile: async (username: string, token?: string) => {
    try {
      const response = await fetch(`${API_URL}/users/${username}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  updateProfile: async (token: string, updates: UpdateProfileData) => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(updates),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  deleteAccount: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/users/account`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  },

  searchUsers: async (query: string, limit: number = 20, offset: number = 0) => {
    try {
      const response = await fetch(
        `${API_URL}/users?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  },

  getUserStats: async (username: string) => {
    try {
      const response = await fetch(`${API_URL}/users/${username}/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  },
};

// ============================================================================
// FOLLOWS API
// ============================================================================

export const followsAPI = {
  followUser: async (token: string, username: string) => {
    try {
      const response = await fetch(`${API_URL}/follows/${username}`, {
        method: 'POST',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Follow user error:', error);
      throw error;
    }
  },

  unfollowUser: async (token: string, username: string) => {
    try {
      const response = await fetch(`${API_URL}/follows/${username}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Unfollow user error:', error);
      throw error;
    }
  },

  getFollowers: async (username: string, limit: number = 20, offset: number = 0) => {
    try {
      const response = await fetch(
        `${API_URL}/follows/${username}/followers?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Get followers error:', error);
      throw error;
    }
  },

  getFollowing: async (username: string, limit: number = 20, offset: number = 0) => {
    try {
      const response = await fetch(
        `${API_URL}/follows/${username}/following?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Get following error:', error);
      throw error;
    }
  },
};

// ============================================================================
// POSTS API
// ============================================================================

export const postsAPI = {
  createPost: async (token: string, postData: CreatePostData) => {
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(postData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  getPost: async (postId: string, token?: string) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Get post error:', error);
      throw error;
    }
  },

  updatePost: async (token: string, postId: string, updates: UpdatePostData) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(updates),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Update post error:', error);
      throw error;
    }
  },

  deletePost: async (token: string, postId: string) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  },

  getUserPosts: async (username: string, limit: number = 20, offset: number = 0) => {
    try {
      const response = await fetch(
        `${API_URL}/posts/user/${username}?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Get user posts error:', error);
      throw error;
    }
  },

  getFeed: async (limit: number = 20, offset: number = 0, token?: string) => {
    try {
      const response = await fetch(
        `${API_URL}/posts/feed?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getAuthHeaders(token),
        }
      );
      const data = await handleResponse(response);
      return data.data.posts;
    } catch (error) {
      console.error('Get feed error:', error);
      throw error;
    }
  },
};

// ============================================================================
// REACTIONS API
// ============================================================================

export const reactionsAPI = {
  addReaction: async (token: string, postId: string, reactionType: ReactionType['reaction_type']) => {
    try {
      const response = await fetch(`${API_URL}/reactions/${postId}`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ reaction_type: reactionType }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Add reaction error:', error);
      throw error;
    }
  },

  removeReaction: async (token: string, postId: string, reactionType: ReactionType['reaction_type']) => {
    try {
      const response = await fetch(`${API_URL}/reactions/${postId}/${reactionType}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Remove reaction error:', error);
      throw error;
    }
  },

  getReactions: async (postId: string, token?: string) => {
    try {
      const response = await fetch(`${API_URL}/reactions/${postId}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Get reactions error:', error);
      throw error;
    }
  },

  getReactionUsers: async (postId: string, reactionType: ReactionType['reaction_type'], limit: number = 20, offset: number = 0) => {
    try {
      const response = await fetch(
        `${API_URL}/reactions/${postId}/${reactionType}/users?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Get reaction users error:', error);
      throw error;
    }
  },
};

// ============================================================================
// COMMENTS API
// ============================================================================

export const commentsAPI = {
  createComment: async (token: string, postId: string, content: string) => {
    try {
      const response = await fetch(`${API_URL}/comments/${postId}`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ content }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Create comment error:', error);
      throw error;
    }
  },

  updateComment: async (token: string, commentId: string, content: string) => {
    try {
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ content }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  },

  deleteComment: async (token: string, commentId: string) => {
    try {
      const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  },

  getPostComments: async (postId: string, limit: number = 20, offset: number = 0) => {
    try {
      const response = await fetch(
        `${API_URL}/comments/post/${postId}?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Get post comments error:', error);
      throw error;
    }
  },

  getUserComments: async (username: string, limit: number = 20, offset: number = 0) => {
    try {
      const response = await fetch(
        `${API_URL}/comments/user/${username}?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );
      return await handleResponse(response);
    } catch (error) {
      console.error('Get user comments error:', error);
      throw error;
    }
  },
};

// ============================================================================
// LISTS API
// ============================================================================

export const listsAPI = {
  createList: async (token: string, listData: CreateListData) => {
    try {
      const response = await fetch(`${API_URL}/lists`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(listData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Create list error:', error);
      throw error;
    }
  },

  updateList: async (token: string, listId: string, updates: UpdateListData) => {
    try {
      const response = await fetch(`${API_URL}/lists/${listId}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(updates),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Update list error:', error);
      throw error;
    }
  },

  deleteList: async (token: string, listId: string) => {
    try {
      const response = await fetch(`${API_URL}/lists/${listId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Delete list error:', error);
      throw error;
    }
  },

  getList: async (listId: string, token?: string) => {
    try {
      const response = await fetch(`${API_URL}/lists/${listId}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Get list error:', error);
      throw error;
    }
  },

  getUserLists: async (username: string, limit: number = 20, offset: number = 0, token?: string) => {
  try {
    const response = await fetch(
      `${API_URL}/lists/user/${username}?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: getAuthHeaders(token),
      }
    );
    const data = await handleResponse(response);
    return data;
  } catch (error: any) {
    // Don't log errors for empty lists or user not found - these are normal states
    if (error.message && !error.message.includes('User not found')) {
      console.error('Get user lists error:', error);
    }
    // Return empty list structure instead of throwing
    return {
      success: false,
      data: {
        lists: [],
        pagination: { limit, offset, total: 0 }
      },
      message: error.message
    };
  }
},

  addPostToList: async (token: string, listId: string, postId: string, itemOrder?: number) => {
    try {
      const body = itemOrder !== undefined ? { item_order: itemOrder } : {};
      const response = await fetch(`${API_URL}/lists/${listId}/posts/${postId}`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(body),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Add post to list error:', error);
      throw error;
    }
  },

  removePostFromList: async (token: string, listId: string, postId: string) => {
    try {
      const response = await fetch(`${API_URL}/lists/${listId}/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Remove post from list error:', error);
      throw error;
    }
  },

  reorderList: async (token: string, listId: string, itemOrders: { post_id: string; item_order: number }[]) => {
    try {
      const response = await fetch(`${API_URL}/lists/${listId}/reorder`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ item_orders: itemOrders }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Reorder list error:', error);
      throw error;
    }
  },
};

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

export const createPost = postsAPI.createPost;
export const getFeed = postsAPI.getFeed;