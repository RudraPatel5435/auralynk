import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export const authKeys = {
  currentUser: ['auth', 'currentUser'] as const,
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: userApi.getCurrentUser,
    retry: false,
    staleTime: Infinity, // session doesn't change unless i trigger it
    throwOnError: (error: any) => error.response?.status !== 401,
  });
}

export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser()
  return {
    isAuthenticated: !!user,
    isLoading,
  }
}

export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate()

  return useMutation({
    mutationFn: userApi.register,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.currentUser, data.data.user);
      toast.success('Account created successfully!');
      navigate({ to: '/channels/@dev' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate()

  return useMutation({
    mutationFn: userApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.currentUser, data);
      toast.success("Welcome back!")
      navigate({ to: "/channels/@dev" })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });
}


export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: userApi.logout,
    onSuccess: () => {
      queryClient.clear();
      toast.info('Logged out successfully');
      navigate({ to: '/login' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Logout failed';
      toast.error(message);
    },
  });
}
