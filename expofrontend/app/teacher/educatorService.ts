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
    name?: string;
    username?: string;
    email: string;
    avatar?: string;
    selectedAvatar?: string;
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

export interface GameScore {
    name: string;
    type: string;
    difficulty: string;
    icon: string;
    description: string;
    scores: number;
    metadata?: any;
    createdAt: string;
}

export interface BestGameScore {
    name: string;
    type: string;
    difficulty: string;
    icon: string;
    description: string;
    scores: number;
    metadata?: any;
    createdAt: string;
}

export interface StudentProfile {
    id: number;
    name: string;
    email: string;
    username: string;
    type?: string;
    schoolId?: number;
}

export interface StudentAnalytics {
    profile: StudentProfile;
    gameStats: {
        totalGames: number;
        averageScore: number;
        bestScore: number;
        improvementRate: number;
        favoriteGameType: string;
        totalPlayTime: number;
    };
    activityStats: {
        activitiesJoined: number;
        activitiesCompleted: number;
        completionRate: number;
        totalActivityPoints: number;
    };
    missionStats: {
        missionsStarted: number;
        missionsCompleted: number;
        completionRate: number;
        currentStreak: number;
    };
    engagementMetrics: {
        loginFrequency: string;
        peakActivityTime: string;
        averageSessionDuration: number;
        hintsUsageRate: number;
    };
    progressTrends: {
        weeklyProgress: Array<{week: string, score: number}>;
        subjectPerformance: Array<{subject: string, average: number, trend: 'up' | 'down' | 'stable'}>;
    };
}

class EducatorService {
    private async getAuthHeaders() {
        const token = await AsyncStorage.getItem('auth_token');

        if (!token || token.trim() === '') {
            console.error('EducatorService: No authentication token found');
            throw new Error('AUTH_REQUIRED');
        }

        // Check if token has valid JWT format (3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('EducatorService: Invalid token format - expected 3 parts, got', parts.length);
            // Don't auto-clear, let the caller handle it
            throw new Error('TOKEN_INVALID');
        }

        if (isTokenExpired(token)) {
            console.log('EducatorService: Token expired');
            // Don't auto-clear, let the caller handle it
            throw new Error('TOKEN_EXPIRED');
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    private async handleResponse(response: Response, endpoint: string) {

        if (!response.ok) {
            let errorMessage = `Failed to fetch ${endpoint}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.warning || errorMessage;
            } catch (e) {
                // Could not parse error response
            }

            if (response.status === 401) {
                // Authentication failed - token may be expired
            }

            throw new Error(`${errorMessage}`);
        }

        const data = await response.json();
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
        const url = `${getApiBaseUrl()}/api/educator/class/${classId}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) {
            let errorMessage = `Failed to delete class`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.warning || errorMessage;
            } catch (e) {
                // Could not parse error response
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
            data = responseText ? JSON.parse(responseText) : { message: 'Class deleted successfully', error: false };
        } catch (e) {
            data = { message: 'Class deleted successfully', warning: false };
        }

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
        return schoolName;
    }

    // Student Management
    async getSchoolMembers(page: number = 0, size: number = 20): Promise<UserMini[]> {
        const headers = await this.getAuthHeaders();
        const url = `${getApiBaseUrl()}/api/educator/school/members?page=${page}&size=${size}`;

        try {
            const response = await fetch(url, {
                headers,
            });

            if (!response.ok) {
                return [];
            }

            const data = await response.json();
            console.log('getSchoolMembers API response:', data);
            const members = data.content || data.data || [];
            console.log('First member data:', members[0]);
            return members;
        } catch (error) {
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

    async removeStudentFromSchool(userId: number): Promise<OperationResult> {
        const headers = await this.getAuthHeaders();
        
        // First try direct school member removal endpoints
        const schoolEndpoints = [
            `${getApiBaseUrl()}/api/educator/school/member/${userId}`,
            `${getApiBaseUrl()}/api/educator/school/members/${userId}`,
            `${getApiBaseUrl()}/api/user/school/member/${userId}`
        ];

        let lastError: Error | null = null;

        // Try school member endpoints first
        for (const url of schoolEndpoints) {

            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers,
                });

                if (response.ok) {
                    let data;
                    try {
                        const responseText = await response.text();
                        data = responseText ? JSON.parse(responseText) : { message: 'Student removed from school successfully', warning: false };
                    } catch (e) {
                        data = { message: 'Student removed from school successfully', warning: false };
                    }

                    return data;
                } else {
                    let errorMessage = `Failed to remove student from school`;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.warning || errorMessage;
                    } catch (e) {
                        // Could not parse error response
                    }

                    if (response.status === 403) {
                        lastError = new Error('Permission denied: You do not have permission to remove students from school');
                    } else if (response.status === 404) {
                        lastError = new Error('Student not found in school');
                    } else {
                        lastError = new Error(errorMessage);
                    }
                    
                    continue;
                }
            } catch (error) {
                lastError = error as Error;
                continue;
            }
        }

        // If school endpoints failed, try removing from all classes as fallback
        try {
            // Get all classes to find which classes the student belongs to
            const classesResponse = await this.getClasses();
            const classes = classesResponse.items || [];
            
            let removedFromClasses = 0;
            let forbiddenCount = 0;
            let notFoundCount = 0;
            
            for (const classItem of classes) {
                try {
                    // Try to remove student from each class
                    await this.removeStudentFromClass(classItem.id, userId);
                    removedFromClasses++;
                    console.log(`EducatorService: Removed student ${userId} from class ${classItem.id}`);
                } catch (classError: any) {
                    console.log(`EducatorService: Could not remove student ${userId} from class ${classItem.id}:`, classError);
                    
                    // Count different types of errors
                    if (classError.message?.includes('Permission denied') || 
                        classError.message?.includes('Forbidden') ||
                        classError.message?.includes('403')) {
                        forbiddenCount++;
                    } else if (classError.message?.includes('not found') || 
                               classError.message?.includes('404')) {
                        notFoundCount++;
                    }
                    // Continue with other classes
                }
            }

            if (removedFromClasses > 0) {
                let message = `Student removed from ${removedFromClasses} class(es) successfully`;
                let warning = false;
                
                // Add warnings for classes where removal failed
                if (forbiddenCount > 0) {
                    message += ` (permission denied for ${forbiddenCount} class(es))`;
                    warning = true;
                }
                if (notFoundCount > 0) {
                    message += ` (not found in ${notFoundCount} class(es))`;
                }
                
                console.log(`EducatorService: Fallback successful - ${message}`);
                return { message, warning };
            } else if (forbiddenCount > 0) {
                throw new Error(`Permission denied: You do not have permission to remove this student from any classes. The student may be in classes you don't manage.`);
            } else if (notFoundCount === classes.length) {
                throw new Error('Student was not found in any classes');
            } else {
                throw new Error('Student could not be removed from any classes due to permission or other issues');
            }
        } catch (fallbackError) {
            console.log(`EducatorService: Fallback class removal also failed:`, fallbackError);
            const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            throw new Error(`Failed to remove student: ${errorMessage}`);
        }
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

    // Method to get classes for a specific student by checking all classes
    async getStudentClasses(studentId: number): Promise<Course[]> {
        try {
            // Get all classes first
            const classesResponse = await this.getClasses();
            const allClasses = classesResponse.items || [];
            
            const studentClasses: Course[] = [];
            
            // Check each class to see if the student is a member
            for (const classItem of allClasses) {
                try {
                    const classMembers = await this.getClassMembersSafe(classItem.id);
                    const isStudentInClass = classMembers.some(member => member.userId === studentId);
                    
                    if (isStudentInClass) {
                        studentClasses.push(classItem);
                    }
                } catch (error) {
                    // If we can't check a specific class, continue with others
                    console.warn(`Could not check class ${classItem.id} for student ${studentId}:`, error);
                    continue;
                }
            }
            
            return studentClasses;
        } catch (error) {
            console.error('Error in getStudentClasses:', error);
            // Fallback: return empty array
            return [];
        }
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

    // Student game score methods
    async getStudentGameScores(userId: number, gameName?: string): Promise<GameScore[]> {
        const headers = await this.getAuthHeaders();
        const url = gameName
            ? `${getApiBaseUrl()}/api/educator/student/${userId}/game/${gameName}/score`
            : `${getApiBaseUrl()}/api/educator/student/${userId}/game/score`;

        console.log(`getStudentGameScores: Calling ${url}`);

        const response = await fetch(url, { headers });
        console.log(`getStudentGameScores: Response status: ${response.status}`);

        const data = await this.handleResponse(response, 'getStudentGameScores');
        console.log(`getStudentGameScores: Raw response data:`, data);

        // 後端返回的是 UtilPageResponse 結構，包含 content 陣列
        if (data.content && Array.isArray(data.content)) {
            console.log(`getStudentGameScores: Found content array with ${data.content.length} items`);
            return data.content;
        }

        // 備用：如果直接返回數組
        if (Array.isArray(data)) {
            console.log(`getStudentGameScores: Found direct array with ${data.length} items`);
            return data;
        }

        // 備用：如果返回 { items: [...] }（其他可能格式）
        if (data.items && Array.isArray(data.items)) {
            console.log(`getStudentGameScores: Found items array with ${data.items.length} items`);
            return data.items;
        }

        console.log('getStudentGameScores: Unexpected response format, returning empty array');
        return [];
    }

    async getStudentBestScores(userId: number, gameName?: string): Promise<BestGameScore[]> {
        const headers = await this.getAuthHeaders();
        const url = gameName
            ? `${getApiBaseUrl()}/api/educator/student/${userId}/game/${gameName}/best`
            : `${getApiBaseUrl()}/api/educator/student/${userId}/game/best`;

        const response = await fetch(url, { headers });
        const data = await this.handleResponse(response, 'getStudentBestScores');

        // Handle paginated response
        if (data.items && Array.isArray(data.items)) {
            return data.items;
        }

        // Handle direct array response
        if (Array.isArray(data)) {
            return data;
        }

        // Handle nested data
        if (data.data && Array.isArray(data.data)) {
            return data.data;
        }

        // Fallback: ensure we always return an array
        console.log('getStudentBestScores: Unexpected response format, returning empty array:', data);
        return [];
    }

    // Get user avatar information
    async getUserAvatar(userId: number): Promise<string | null> {
        try {
            // Try to get user profile information that might contain avatar
            const response = await fetch(`${getApiBaseUrl()}/api/auth/me/${userId}`, {
                headers: await this.getAuthHeaders(),
            });

            if (!response.ok) {
                return null;
            }

            const profileData = await response.json();
            console.log('User profile data for avatar:', profileData);
            
            // Check various possible avatar field names
            return profileData.selectedAvatar || profileData.avatar || profileData.profilePicture || null;
        } catch (error) {
            console.log('Error getting user avatar:', error);
            return null;
        }
    }

    // Get student profile information
    async getStudentProfile(userId: number, classId?: number): Promise<StudentProfile | null> {
        try {
            // Try to get user info from school members first
            const schoolMembers = await this.getSchoolMembers();
            const student = schoolMembers.find(member => member.id === userId);
            
                        
            if (student) {
                return {
                    id: student.id,
                    name: student.name || 'Unknown',
                    email: student.email,
                    username: student.name || 'Unknown', // Using name as username fallback
                };
            }
            
            // If not found in school members and classId is provided, try class members
            if (classId) {
                const classMembers = await this.getClassMembersSafe(classId);
                const classMember = classMembers.find(member => member.userId === userId);
                
                if (classMember) {
                    return {
                        id: classMember.userId,
                        name: classMember.username,
                        email: classMember.email,
                        username: classMember.username,
                        type: classMember.roleInClass,
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.log('Error getting student profile:', error);
            return null;
        }
    }

    // Get comprehensive student analytics
    async getStudentAnalytics(userId: number): Promise<StudentAnalytics | null> {
        try {
            const headers = await this.getAuthHeaders();
            
            // Get all necessary data in parallel
            const [
                profile,
                gameScores,
                bestScores,
                userActivities,
                userMissions,
                userItems
            ] = await Promise.all([
                this.getStudentProfile(userId),
                this.getStudentGameScores(userId),
                this.getStudentBestScores(userId),
                this.getUserActivities(userId),
                this.getUserMissions(userId),
                this.getUserItems(userId)
            ]);

            if (!profile) {
                return null;
            }

            // Calculate game statistics
            const gameStats = this.calculateGameStats(gameScores || [], bestScores || []);
            
            // Calculate activity statistics
            const activityStats = this.calculateActivityStats(userActivities || []);
            
            // Calculate mission statistics
            const missionStats = this.calculateMissionStats(userMissions || []);
            
            // Calculate engagement metrics
            const engagementMetrics = this.calculateEngagementMetrics(gameScores || []);
            
            // Calculate progress trends
            const progressTrends = this.calculateProgressTrends(gameScores || []);

            return {
                profile,
                gameStats,
                activityStats,
                missionStats,
                engagementMetrics,
                progressTrends
            };
        } catch (error) {
            console.error('Error getting student analytics:', error);
            return null;
        }
    }

    // Helper methods for analytics calculations
    private calculateGameStats(gameScores: GameScore[], bestScores: BestGameScore[]) {
        const totalGames = gameScores.length;
        const scores = gameScores.map(s => s.scores);
        const averageScore = totalGames > 0 ? scores.reduce((a, b) => a + b, 0) / totalGames : 0;
        const bestScore = totalGames > 0 ? Math.max(...scores) : 0;
        
        // Calculate improvement rate (first vs last score comparison)
        const improvementRate = totalGames >= 2 
            ? ((gameScores[totalGames - 1].scores - gameScores[0].scores) / gameScores[0].scores) * 100
            : 0;

        // Find favorite game type
        const gameTypes = gameScores.reduce((acc, score) => {
            const type = score.type || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const favoriteGameType = Object.keys(gameTypes).reduce((a, b) => 
            gameTypes[a] > gameTypes[b] ? a : b, 'Unknown');

        // Calculate total play time from metadata
        const totalPlayTime = gameScores.reduce((total, score) => {
            if (score.metadata?.time_taken) {
                return total + (typeof score.metadata.time_taken === 'number' 
                    ? score.metadata.time_taken 
                    : parseInt(score.metadata.time_taken) || 0);
            }
            return total;
        }, 0);

        return {
            totalGames,
            averageScore: Math.round(averageScore),
            bestScore,
            improvementRate: Math.round(improvementRate * 10) / 10,
            favoriteGameType,
            totalPlayTime
        };
    }

    private calculateActivityStats(userActivities: any[]) {
        const totalActivities = userActivities.length;
        const completedActivities = userActivities.filter(a => a.completed).length;
        const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
        const totalActivityPoints = userActivities.reduce((total, activity) => {
            return total + (activity.score || 0);
        }, 0);

        return {
            activitiesJoined: totalActivities,
            activitiesCompleted: completedActivities,
            completionRate: Math.round(completionRate),
            totalActivityPoints
        };
    }

    private calculateMissionStats(userMissions: any[]) {
        const totalMissions = userMissions.length;
        const completedMissions = userMissions.filter(m => m.completed).length;
        const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;
        
        // Calculate current streak (consecutive completed missions)
        let currentStreak = 0;
        const sortedMissions = userMissions.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        for (const mission of sortedMissions) {
            if (mission.completed) {
                currentStreak++;
            } else {
                break;
            }
        }

        return {
            missionsStarted: totalMissions,
            missionsCompleted: completedMissions,
            completionRate: Math.round(completionRate),
            currentStreak
        };
    }

    private calculateEngagementMetrics(gameScores: GameScore[]) {
        // Calculate hints usage rate
        const gamesWithHints = gameScores.filter(score => 
            score.metadata?.hints_used && score.metadata.hints_used > 0
        ).length;
        const hintsUsageRate = gameScores.length > 0 
            ? (gamesWithHints / gameScores.length) * 100 
            : 0;

        // Calculate average session duration
        const sessionDurations = gameScores.map(score => 
            score.metadata?.time_taken || 0
        ).filter(time => time > 0);
        const averageSessionDuration = sessionDurations.length > 0
            ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
            : 0;

        // Determine peak activity time (simplified)
        const hours = gameScores.map(score => 
            new Date(score.createdAt).getHours()
        );
        const hourCounts = hours.reduce((acc, hour) => {
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
        const peakHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b, '12');
        const peakActivityTime = `${peakHour}:00-${parseInt(peakHour) + 1}:00`;

        // Login frequency (simplified - based on game activity)
        const uniqueDays = new Set(gameScores.map(score => 
            new Date(score.createdAt).toDateString()
        )).size;
        const loginFrequency = uniqueDays >= 30 ? 'Daily' : 
                             uniqueDays >= 10 ? 'Weekly' : 'Occasional';

        return {
            loginFrequency,
            peakActivityTime,
            averageSessionDuration: Math.round(averageSessionDuration),
            hintsUsageRate: Math.round(hintsUsageRate)
        };
    }

    private calculateProgressTrends(gameScores: GameScore[]) {
        // Calculate weekly progress (last 4 weeks)
        const now = new Date();
        const weeklyProgress = [];
        
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7));
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            const weekScores = gameScores.filter(score => {
                const scoreDate = new Date(score.createdAt);
                return scoreDate >= weekStart && scoreDate <= weekEnd;
            });
            
            const weekAverage = weekScores.length > 0 
                ? weekScores.reduce((sum, s) => sum + s.scores, 0) / weekScores.length 
                : 0;
            
            weeklyProgress.push({
                week: `Week ${4 - i}`,
                score: Math.round(weekAverage)
            });
        }

        // Calculate subject performance
        const subjectScores = gameScores.reduce((acc, score) => {
            // Map game types to subjects
            const gameTypeToSubject: Record<string, string> = {
                'math': 'math',
                'mathematics': 'math',
                'arithmetic': 'math',
                'calculation': 'math',
                'english': 'english',
                'vocabulary': 'english',
                'grammar': 'english',
                'reading': 'english',
                'science': 'science',
                'physics': 'science',
                'chemistry': 'science',
                'biology': 'science',
                'chinese': 'chinese',
                'mandarin': 'chinese',
                'writing': 'chinese',
                'characters': 'chinese'
            };
            
            const normalizedType = (score.type || '').toLowerCase();
            const subject = gameTypeToSubject[normalizedType] || normalizedType || 'Unknown';
            
            if (!acc[subject]) {
                acc[subject] = { scores: [], count: 0 };
            }
            acc[subject].scores.push(score.scores);
            acc[subject].count++;
            return acc;
        }, {} as Record<string, { scores: number[], count: number }>);

        const subjectPerformance = Object.entries(subjectScores).map(([subject, data]) => {
            const average = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
            
            // Simple trend calculation (compare first half vs second half)
            const midpoint = Math.floor(data.scores.length / 2);
            const firstHalf = data.scores.slice(0, midpoint);
            const secondHalf = data.scores.slice(midpoint);
            
            const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length : 0;
            const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length : 0;
            
            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (secondAvg > firstAvg * 1.1) trend = 'up';
            else if (secondAvg < firstAvg * 0.9) trend = 'down';
            
            return {
                subject,
                average: Math.round(average),
                trend
            };
        });
        
        console.log('calculateProgressTrends - subjectPerformance:', subjectPerformance);

        return {
            weeklyProgress,
            subjectPerformance
        };
    }

    // Additional API methods for analytics
    private async getUserActivities(userId: number) {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${getApiBaseUrl()}/api/educator/student/${userId}/activities`, { headers });
            return await this.handleResponse(response, 'getUserActivities');
        } catch (error) {
            console.log('Error getting user activities:', error);
            return [];
        }
    }

    private async getUserMissions(userId: number) {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${getApiBaseUrl()}/api/educator/student/${userId}/missions`, { headers });
            return await this.handleResponse(response, 'getUserMissions');
        } catch (error) {
            console.log('Error getting user missions:', error);
            return [];
        }
    }

    private async getUserItems(userId: number) {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${getApiBaseUrl()}/api/educator/student/${userId}/items`, { headers });
            return await this.handleResponse(response, 'getUserItems');
        } catch (error) {
            console.log('Error getting user items:', error);
            return [];
        }
    }

    // Update course member role
    async updateCourseMemberRole(courseId: number, userId: number, newRole: 'STUDENT' | 'TEACHER' | 'ASSISTANT'): Promise<OperationResult> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${getApiBaseUrl()}/api/educator/class/member`, {
            method: 'PATCH',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                courseId,
                role: newRole
            })
        });

        return await this.handleResponse(response, 'updateCourseMemberRole');
    }
}

export default new EducatorService();
