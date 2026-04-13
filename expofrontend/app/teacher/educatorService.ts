// educatorService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '@/src/api/client';
import { Alert } from 'react-native';
import { isTokenExpired } from '@/src/utils/authUtils';
import { DetailedListResponse } from './ApiListHandler';

export interface Course {
    id: number;
    grade: string;
    suffix: string;
    academicYear: string;
    createdAt: string;
    // schoolId might not exist in backend response, make it optional
    schoolId?: number;
    updatedAt?: string;
}

export interface CourseRequest {
    grade: string;
    suffix: string;
    academicYear: string;
}

export interface UserMini {
    id: number;
    name: string;
    email: string;
}

export interface CourseMember {
    userId: number;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
    roleInClass: string;
}

export interface CourseMemberRequest {
    userId: number;
    courseId: number;
    role: 'STUDENT' | 'TEACHER' | 'ASSISTANT';
}

export interface OperationResult {
    message: string;
    error: boolean;
}

class EducatorService {
    private async getAuthHeaders() {
        const token = await AsyncStorage.getItem('auth_token');
        console.log('EducatorService: Token exists:', !!token);

        if (!token) {
            throw new Error('No authentication token found');
        }

        if (isTokenExpired(token)) {
            console.log('EducatorService: Token is expired');
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('auth_user');
            throw new Error('Authentication token has expired. Please log in again.');
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    private async handleResponse(response: Response, endpoint: string) {
        console.log(`EducatorService: ${endpoint} - Response status:`, response.status);

        if (!response.ok) {
            let errorMessage = `Failed to fetch ${endpoint}`;
            try {
                const errorData = await response.json();
                console.log(`EducatorService: ${endpoint} - Error response:`, errorData);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                console.log(`EducatorService: ${endpoint} - Could not parse error response`);
            }

            if (response.status === 401) {
                console.log('EducatorService: Authentication failed - token may be expired');
            }

            throw new Error(`${errorMessage}`);
        }

        const data = await response.json();
        console.log(`EducatorService: ${endpoint} - Response data:`, JSON.stringify(data, null, 2));
        return data;
    }

    // Class Management - UPDATED to return DetailedListResponse
    async getClasses(): Promise<DetailedListResponse<Course>> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/user/class`, {
            headers,
        });
        const data = await this.handleResponse(response, 'getClasses');

        // Handle backend response structure: { items: [...], total: 11, isEmpty: false }
        if (data.items && Array.isArray(data.items)) {
            return {
                items: data.items,
                total: data.total || data.items.length,
                isEmpty: data.isEmpty || data.items.length === 0
            };
        }

        // Fallback for array response
        const items = Array.isArray(data) ? data : [];
        return {
            items,
            total: items.length,
            isEmpty: items.length === 0
        };
    }

    async createClass(classData: CourseRequest): Promise<any> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/educator/class`, {
            method: 'POST',
            headers,
            body: JSON.stringify(classData),
        });
        return this.handleResponse(response, 'createClass');
    }

    async deleteClass(classId: number): Promise<OperationResult> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/educator/class/${classId}`, {
            method: 'DELETE',
            headers,
        });
        return this.handleResponse(response, 'deleteClass');
    }

    // Student Management
    async getSchoolMembers(page: number = 0, size: number = 20): Promise<UserMini[]> {
        const headers = await this.getAuthHeaders();
        const url = `${getApiBaseUrl()}/api/educator/school/members?page=${page}&size=${size}`;
        console.log('EducatorService: Fetching school members from:', url);

        try {
            const response = await fetch(url, {
                headers,
            });

            if (!response.ok) {
                console.warn(`EducatorService: getSchoolMembers failed with status ${response.status}`);
                return [];
            }

            const data = await response.json();
            return data.content || data.data || [];
        } catch (error) {
            console.warn('EducatorService: getSchoolMembers error:', error);
            return [];
        }
    }

    // educatorService.ts - 修改 getClassMembers 方法
    // educatorService.ts - 確保 getClassMembers 正確處理響應
    async getClassMembers(classId: number): Promise<CourseMember[]> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/user/class/${classId}/members`, {
            headers,
        });
        const data = await this.handleResponse(response, 'getClassMembers');

        // 後端返回格式: { items: [...], total: 2, isEmpty: false }
        if (data.items && Array.isArray(data.items)) {
            return data.items;
        }

        // 備用：直接返回 data 或空陣列
        return data.data || data || [];
    }
    async addStudentToClass(request: CourseMemberRequest): Promise<CourseMember> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/educator/class/member`, {
            method: 'POST',
            headers,
            body: JSON.stringify(request),
        });
        return this.handleResponse(response, 'addStudentToClass');
    }

    async ensureTeacherAsMember(courseId: number): Promise<CourseMember> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/educator/class/${courseId}/member/ensure-teacher`, {
            method: 'POST',
            headers,
        });
        return this.handleResponse(response, 'ensureTeacherAsMember');
    }

    async updateStudentRole(request: CourseMemberRequest): Promise<OperationResult> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/educator/class/member`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(request),
        });
        return this.handleResponse(response, 'updateStudentRole');
    }

    async removeStudentFromClass(classId: number, userId: number): Promise<OperationResult> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/educator/class/${classId}/member/${userId}`, {
            method: 'DELETE',
            headers,
        });
        return this.handleResponse(response, 'removeStudentFromClass');
    }

    async getUserRoleInClass(classId: number): Promise<string> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/user/class/${classId}/role`, {
            headers,
        });
        
        console.log(`EducatorService: getUserRoleInClass - Response status:`, response.status);

        if (!response.ok) {
            let errorMessage = `Failed to fetch user role in class`;
            try {
                const errorData = await response.json();
                console.log(`EducatorService: getUserRoleInClass - Error response:`, errorData);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                console.log(`EducatorService: getUserRoleInClass - Could not parse error response`);
            }
            throw new Error(`${errorMessage}`);
        }

        // Handle plain text response (backend returns "TEACHER", "STUDENT", etc.)
        const data = await response.text();
        console.log(`EducatorService: getUserRoleInClass - Response data:`, data);
        return data.trim();
    }
}

export default new EducatorService();
