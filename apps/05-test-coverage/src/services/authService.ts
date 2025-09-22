// Authentication Service - needs comprehensive testing!
export interface AuthUser {
  id: string;
  email: string;
  token: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    // Simulate API call
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }
    if (password.length < 6) {
      throw new Error('Password too short');
    }
    
    // Mock successful login
    return {
      id: '123',
      email,
      token: 'mock-jwt-token'
    };
  },

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  async register(email: string, password: string, name: string): Promise<AuthUser> {
    if (!email || !password || !name) {
      throw new Error('All fields are required');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    return {
      id: '124',
      email,
      token: 'mock-jwt-token'
    };
  },

  async refreshToken(): Promise<string> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No token found');
    
    // Mock refresh
    return 'refreshed-token';
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
};
