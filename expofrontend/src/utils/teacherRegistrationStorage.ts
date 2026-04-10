import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TeacherRegistrationRequest {
  id: string;
  username: string;
  email: string;
  password: string;
  schoolName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedByAdmin?: string;
  adminNotes?: string;
}

const TEACHER_REQUESTS_KEY = 'teacher_registration_requests';

export class TeacherRegistrationStorage {
  
  static async getAllRequests(): Promise<TeacherRegistrationRequest[]> {
    try {
      const requests = await AsyncStorage.getItem(TEACHER_REQUESTS_KEY);
      return requests ? JSON.parse(requests) : [];
    } catch (error) {
      console.error('Error fetching teacher requests:', error);
      return [];
    }
  }

  static async getPendingRequests(): Promise<TeacherRegistrationRequest[]> {
    try {
      const allRequests = await this.getAllRequests();
      return allRequests.filter(request => request.status === 'pending');
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  }

  static async createRequest(requestData: Omit<TeacherRegistrationRequest, 'id' | 'status' | 'createdAt'>): Promise<TeacherRegistrationRequest> {
    try {
      const allRequests = await this.getAllRequests();
      
      // Check if username or email already exists in pending requests
      const existingRequest = allRequests.find(req => 
        req.username === requestData.username || 
        req.email === requestData.email
      );
      
      if (existingRequest && existingRequest.status === 'pending') {
        throw new Error('Registration request for this username or email already exists');
      }

      const newRequest: TeacherRegistrationRequest = {
        ...requestData,
        id: Date.now().toString(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      allRequests.push(newRequest);
      await AsyncStorage.setItem(TEACHER_REQUESTS_KEY, JSON.stringify(allRequests));
      
      return newRequest;
    } catch (error) {
      console.error('Error creating teacher request:', error);
      throw error;
    }
  }

  static async updateRequestStatus(
    requestId: string, 
    status: 'approved' | 'rejected', 
    adminNotes?: string,
    reviewedByAdmin?: string
  ): Promise<TeacherRegistrationRequest> {
    try {
      const allRequests = await this.getAllRequests();
      const requestIndex = allRequests.findIndex(req => req.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Registration request not found');
      }

      const request = allRequests[requestIndex];
      if (request.status !== 'pending') {
        throw new Error('Request is not pending');
      }

      request.status = status;
      request.reviewedAt = new Date().toISOString();
      request.adminNotes = adminNotes;
      request.reviewedByAdmin = reviewedByAdmin;

      allRequests[requestIndex] = request;
      await AsyncStorage.setItem(TEACHER_REQUESTS_KEY, JSON.stringify(allRequests));
      
      return request;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  static async deleteRequest(requestId: string): Promise<void> {
    try {
      const allRequests = await this.getAllRequests();
      const filteredRequests = allRequests.filter(req => req.id !== requestId);
      await AsyncStorage.setItem(TEACHER_REQUESTS_KEY, JSON.stringify(filteredRequests));
    } catch (error) {
      console.error('Error deleting request:', error);
      throw error;
    }
  }
}
