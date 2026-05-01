import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '@/src/api/client';

export interface StudentClass {
    id: number;
    name: string;
    description?: string;
    schoolName?: string;
    teacherName?: string;
    createdAt: string;
    memberCount?: number;
    grade?: string;
    suffix?: string;
    academicYear?: string;
}

export interface ClassMember {
    id: number;
    username: string;
    email?: string;
    roles: string[];
    points?: number;
    joinedAt?: string;
    roleInClass?: string;
}

class StudentService {
    private async getAuthHeaders() {
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    private async handleResponse(response: Response, operation: string) {
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to ${operation}`;
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(`${errorMessage} (Status: ${response.status})`);
        }
        
        const data = await response.json();
        return data;
    }

    // 獲取學生所屬的班級列表
    async getStudentClasses(): Promise<StudentClass[]> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/user/class`, {
            headers,
        });
        const data = await this.handleResponse(response, 'getStudentClasses');

        // 處理後端返回的格式: { items: [...], total: N, isEmpty: false }
        if (data.items && Array.isArray(data.items)) {
            console.log('StudentClasses - Found', data.items.length, 'classes');
            
            // 為每個班級獲取詳細信息（成員列表、老師等）
            const classesWithDetails = await Promise.all(
                data.items.map(async (item: any) => {
                    let memberCount = 0;
                    let teacherName = 'Unknown Teacher';
                    let schoolName = item.schoolName || item.school || item.institutionName || 'Unknown School';
                    
                    try {
                        // 獲取班級成員來得到成員數量和老師信息
                        const membersResponse = await fetch(`${getApiBaseUrl()}/api/user/class/${item.id}/members`, {
                            headers,
                        });
                        
                        if (membersResponse.ok) {
                            const membersData = await membersResponse.json();
                            const members = membersData.items || membersData.data || membersData || [];
                            memberCount = members.length;
                            
                            // 尋找老師（基於用戶名識別，因為roles字段為undefined）
                            const teacher = members.find((member: any) => {
                                return member.username && (
                                    member.username.includes('teacher') ||
                                    member.username.includes('edu_') ||
                                    member.username.includes('admin')
                                );
                            });
                            
                            if (teacher) {
                                teacherName = teacher.username || teacher.name || 'Unknown Teacher';
                            }
                            
                            // 從郵箱域名推斷學校信息
                            if (!schoolName || schoolName === 'Unknown School') {
                                const anyMember = members.find((member: any) => member.email);
                                if (anyMember && anyMember.email) {
                                    const emailDomain = anyMember.email.split('@')[1];
                                    if (emailDomain === 'eduquestacademy.edu') {
                                        schoolName = 'EduQuest Academy';
                                    } else if (emailDomain) {
                                        schoolName = emailDomain.split('.')[0];
                                        schoolName = schoolName.charAt(0).toUpperCase() + schoolName.slice(1);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch members for class ${item.id}:`, error);
                    }
                    
                    return {
                        id: item.id,
                        name: item.name || item.className || `${item.grade || 'Class'}${item.suffix ? '-' + item.suffix : ''}`,
                        description: item.description || item.classDescription || `Grade ${item.grade || 'Unknown'} - Academic Year ${item.academicYear || 'Unknown'}`,
                        schoolName: schoolName,
                        teacherName: teacherName,
                        createdAt: item.createdAt || item.createdDate || item.creationDate || new Date().toISOString(),
                        memberCount: memberCount,
                        grade: item.grade,
                        suffix: item.suffix,
                        academicYear: item.academicYear
                    };
                })
            );
            
            return classesWithDetails;
        }
        
        // 備用：直接返回 data 或空陣列
        return data.data || data || [];
    }

    // 獲取班級成員列表
    async getClassMembers(classId: number): Promise<ClassMember[]> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/user/class/${classId}/members`, {
            headers,
        });
        const data = await this.handleResponse(response, 'getClassMembers');

        // 處理後端返回格式: { items: [...], total: N, isEmpty: false }
        if (data.items && Array.isArray(data.items)) {
            return data.items.map((item: any) => ({
                id: item.id,
                username: item.username,
                email: item.email,
                roles: item.roles || [],
                points: item.points || 0,
                joinedAt: item.joinedAt,
                roleInClass: item.roleInClass
            }));
        }
        
        // 備用：直接返回 data 或空陣列
        return data.data || data || [];
    }
}

export default new StudentService();
