import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api';

export const authKeys = {
  currentUser: ['auth', 'currentUser'] as const,
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: userApi.getCurrentUser,
    retry: false,
    staleTime: Infinity, // session doesn't change unless i trigger it
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.currentUser, data);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.register,
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.currentUser, data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
