import { useAuth } from '@/src/auth/AuthContext';

export const useAdminAuth = () => {
  const { user, token } = useAuth();
  
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || false;
  const isEducator = user?.roles?.includes('ROLE_EDUCATOR') || false;
  const isStudent = user?.roles?.includes('ROLE_USER') || false;
  
  const canAccessAdmin = isAdmin;
  const canAccessEducator = isAdmin || isEducator;
  
  return {
    user,
    token,
    isAdmin,
    isEducator,
    isStudent,
    canAccessAdmin,
    canAccessEducator,
  };
};
