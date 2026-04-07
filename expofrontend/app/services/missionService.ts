import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Mission } from '../types/mission';

class MissionService {
  private getApiBaseUrl(): string {
    if (typeof window !== "undefined") {
      return "http://localhost:8080";
    }
    return "http://10.0.2.2:8080";
  }

  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getMissions(completed: boolean = false): Promise<Mission[]> {
    try {
      const headers = await this.getAuthHeaders();
      const url = completed 
        ? `${this.getApiBaseUrl()}/api/user/mission/true`
        : `${this.getApiBaseUrl()}/api/user/mission/false`;
      
      const response = await axios.get(url, { headers });
      return response.data.map((mission: any) => ({
        ...mission,
        createdAt: mission.createdAt || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching missions:', error);
      throw error;
    }
  }

  async getAllMissions(): Promise<{ active: Mission[], completed: Mission[] }> {
    try {
      const [active, completed] = await Promise.all([
        this.getMissions(false),
        this.getMissions(true)
      ]);
      return { active, completed };
    } catch (error) {
      console.error('Error fetching all missions:', error);
      throw error;
    }
  }
}

export const missionService = new MissionService();
export const getMissions = (completed?: boolean) => missionService.getMissions(completed);
export default missionService;
