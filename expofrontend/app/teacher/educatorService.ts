// educatorService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '@/src/api/client';
import { Alert } from 'react-native';

export interface Course {
    id: number;
    grade: string;
    suffix: string;
    academicYear: string;
    createdAt: string;
    updatedAt: string;
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
                // 可以觸發重新登入
            }

            throw new Error(`${errorMessage}`);
        }

        const data = await response.json();
        console.log(`EducatorService: ${endpoint} - Success`);
        return data;
    }

    // Class Management
    async getClasses(): Promise<Course[]> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/educator/class`, {
            headers,
        });
        const data = await this.handleResponse(response, 'getClasses');
        return data.data || [];
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

    // Student Management - 使用正確的 API 端點
    async getSchoolMembers(page: number = 0, size: number = 20): Promise<UserMini[]> {
        const headers = await this.getAuthHeaders();
        const url = `${getApiBaseUrl()}/api/educator/school/members?page=${page}&size=${size}`;
        console.log('EducatorService: Fetching school members from:', url);

        const response = await fetch(url, {
            headers,
        });

        const data = await this.handleResponse(response, 'getSchoolMembers');
        // 根據後端返回的結構解析數據
        // 後端返回 UtilPageResponse，包含 content 陣列
        return data.content || data.data || [];
    }

    async getClassMembers(classId: number): Promise<CourseMember[]> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/user/class/${classId}/members`, {
            headers,
        });
        const data = await this.handleResponse(response, 'getClassMembers');
        return data.data || [];
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
        const data = await this.handleResponse(response, 'getUserRoleInClass');
        return data;
    }
}

export default new EducatorService();