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
    warning: boolean;
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
                errorMessage = errorData.message || errorData.warning || errorMessage;
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
        console.log(`EducatorService.deleteClass: Starting deletion for class ${classId}`);

        const headers = await this.getAuthHeaders();
        const url = `${getApiBaseUrl()}/api/educator/class/${classId}`;
        console.log(`EducatorService.deleteClass: URL: ${url}`);

        const response = await fetch(url, {
            method: 'DELETE',
            headers,
        });

        console.log(`EducatorService.deleteClass: Response status: ${response.status}`);

        if (!response.ok) {
            let errorMessage = `Failed to delete class`;
            try {
                const errorData = await response.json();
                console.log(`EducatorService.deleteClass: Error response:`, errorData);
                errorMessage = errorData.message || errorData.warning || errorMessage;
            } catch (e) {
                console.log(`EducatorService.deleteClass: Could not parse error response`);
            }

            if (response.status === 403) {
                throw new Error('Permission denied: You must be in the same school as this class to delete it');
            } else if (response.status === 404) {
                throw new Error('Class not found');
            }

            throw new Error(`${errorMessage} (Status: ${response.status})`);
        }

        // 成功時解析響應
        let data;
        try {
            const responseText = await response.text();
            console.log(`EducatorService.deleteClass: Response body:`, responseText);
            data = responseText ? JSON.parse(responseText) : { message: 'Class deleted successfully', error: false };
        } catch (e) {
            console.log(`EducatorService.deleteClass: Could not parse response`);
            data = { message: 'Class deleted successfully', warning: false };
        }

        console.log(`EducatorService.deleteClass: Success, returning:`, data);
        return data;
    }

    async getUserSchool(): Promise<string> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/user/school`, {
            headers,
        });

        if (!response.ok) {
            throw new Error(`Failed to get user school: ${response.status}`);
        }

        // 返回純文字而不是 JSON
        const schoolName = await response.text();
        console.log(`EducatorService: User school:`, schoolName);
        return schoolName;
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

    // educatorService.ts - 添加 removeStudentFromClass 方法（已經存在，確認一下）
    async removeStudentFromClass(classId: number, userId: number): Promise<OperationResult> {
        const headers = await this.getAuthHeaders();
        const url = `${getApiBaseUrl()}/api/educator/class/${classId}/member/${userId}`;
        console.log(`EducatorService: Removing student ${userId} from class ${classId} at: ${url}`);

        const response = await fetch(url, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) {
            let errorMessage = `Failed to remove student from class`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                console.log('Could not parse error response');
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`EducatorService: Remove student result:`, data);
        return data;
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

    // New method to get class members with permission handling
    async getClassMembersSafe(classId: number): Promise<CourseMember[]> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/user/class/${classId}/members`, {
            headers,
        });

        // Handle permission errors gracefully - if user is not a member, return empty array
        if (response.status === 403) {
            console.log(`EducatorService: No access to members for class ${classId} (not a member)`);
            return [];
        }

        try {
            const data = await this.handleResponse(response, 'getClassMembersSafe');

            // backend return format: { items: [...], total: 2, isEmpty: false }
            if (data.items && Array.isArray(data.items)) {
                return data.items;
            }

            // fallback: return data or empty array
            return data.data || data || [];
        } catch (error) {
            console.log(`EducatorService: Error getting members for class ${classId}:`, error);
            return [];
        }
    }
}

export default new EducatorService();
