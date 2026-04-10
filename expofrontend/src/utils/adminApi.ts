import axios from 'axios';
import { getApiBaseUrl } from '@/src/api/client';

// Admin API utilities that work with existing backend endpoints
export const adminApi = {
  // Get all users (using existing user endpoints)
  getAllUsers: async (token: string) => {
    const api = axios.create({
      baseURL: getApiBaseUrl(),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Since we don't have /api/user/all, we'll need to implement this
    // For now, return mock data
    return api.get('/api/user/');
  },

  // Get user roles
  getUserRoles: async (token: string) => {
    const api = axios.create({
      baseURL: getApiBaseUrl(),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return api.get('/api/user/roles');
  },

  // Mock admin endpoints (these would be implemented in backend)
  getDashboardStats: async (token: string) => {
    // Return mock dashboard data
    return Promise.resolve({
      data: {
        totalUsers: 150,
        activeUsers: 120,
        totalGamesPlayed: 2500,
        totalMissionsCompleted: 800,
        totalSchools: 5,
        newUsersThisMonth: 15,
        usersByRole: {
          admins: 3,
          educators: 12,
          students: 135
        }
      }
    });
  },

  getRecentActivities: async (token: string, limit: number = 10) => {
    // Return mock activities
    return Promise.resolve({
      data: [
        {
          type: 'GAME_SCORE',
          username: 'student1',
          gameName: 'Math Challenge',
          score: 95,
          timestamp: new Date().toISOString()
        },
        {
          type: 'MISSION_COMPLETION',
          username: 'student2',
          missionName: 'Daily Reader',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          type: 'USER_REGISTRATION',
          username: 'newStudent',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ]
    });
  }
};

// Helper function to check if user has admin access
export const hasAdminAccess = (user: any): boolean => {
  return user?.roles?.includes('ROLE_ADMIN') || false;
};

// Helper function to check if user has educator access
export const hasEducatorAccess = (user: any): boolean => {
  return user?.roles?.includes('ROLE_EDUCATOR') || false;
};
