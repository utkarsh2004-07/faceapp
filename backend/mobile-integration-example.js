// Mobile App Integration Example
// This shows how to integrate the backend with a mobile app

class AuthService {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
    this.token = null;
  }

  // Set the auth token (store this securely in your mobile app)
  setToken(token) {
    this.token = token;
  }

  // Get the auth token
  getToken() {
    return this.token;
  }

  // Clear the auth token (for logout)
  clearToken() {
    this.token = null;
  }

  // Make authenticated requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Register a new user
  async register(userData) {
    const response = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return response;
  }

  // Login user
  async login(credentials) {
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  // Get current user profile
  async getProfile() {
    return await this.makeRequest('/auth/me');
  }

  // Update user profile
  async updateProfile(profileData) {
    return await this.makeRequest('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Change password
  async changePassword(passwordData) {
    return await this.makeRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  }

  // Verify email
  async verifyEmail(token) {
    return await this.makeRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  // Resend verification email
  async resendVerification(email) {
    return await this.makeRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Forgot password
  async forgotPassword(email) {
    return await this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Reset password
  async resetPassword(token, password) {
    const response = await this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  // Logout
  async logout() {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.log('Logout request failed, but clearing local token');
    } finally {
      this.clearToken();
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }
}

// Example usage in a mobile app
async function mobileAppExample() {
  const authService = new AuthService();

  try {
    console.log('📱 Mobile App Integration Example\n');

    // 1. Register a new user
    console.log('1. Registering user...');
    const registerResult = await authService.register({
      name: 'Mobile User',
      email: 'mobile@example.com',
      password: 'MobilePass123'
    });
    console.log('✅ Registration:', registerResult.message);

    // 2. Login
    console.log('\n2. Logging in...');
    const loginResult = await authService.login({
      email: 'mobile@example.com',
      password: 'MobilePass123'
    });
    console.log('✅ Login:', loginResult.message);
    console.log('🔑 Token stored:', authService.isAuthenticated());

    // 3. Get profile
    console.log('\n3. Getting profile...');
    const profile = await authService.getProfile();
    console.log('✅ Profile:', profile.user.name);

    // 4. Update profile
    console.log('\n4. Updating profile...');
    const updateResult = await authService.updateProfile({
      name: 'Updated Mobile User'
    });
    console.log('✅ Update:', updateResult.message);

    // 5. Logout
    console.log('\n5. Logging out...');
    await authService.logout();
    console.log('✅ Logged out, token cleared:', !authService.isAuthenticated());

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Token Storage Examples for different platforms
const tokenStorageExamples = {
  // React Native with AsyncStorage
  reactNative: {
    async saveToken(token) {
      try {
        await AsyncStorage.setItem('authToken', token);
      } catch (error) {
        console.error('Error saving token:', error);
      }
    },

    async getToken() {
      try {
        return await AsyncStorage.getItem('authToken');
      } catch (error) {
        console.error('Error getting token:', error);
        return null;
      }
    },

    async removeToken() {
      try {
        await AsyncStorage.removeItem('authToken');
      } catch (error) {
        console.error('Error removing token:', error);
      }
    }
  },

  // React Native with Secure Storage (more secure)
  secureStorage: {
    async saveToken(token) {
      try {
        await Keychain.setInternetCredentials('authToken', 'user', token);
      } catch (error) {
        console.error('Error saving secure token:', error);
      }
    },

    async getToken() {
      try {
        const credentials = await Keychain.getInternetCredentials('authToken');
        return credentials ? credentials.password : null;
      } catch (error) {
        console.error('Error getting secure token:', error);
        return null;
      }
    },

    async removeToken() {
      try {
        await Keychain.resetInternetCredentials('authToken');
      } catch (error) {
        console.error('Error removing secure token:', error);
      }
    }
  }
};

// Export for use in mobile apps
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthService, tokenStorageExamples };
}

// Run example if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  mobileAppExample();
}
