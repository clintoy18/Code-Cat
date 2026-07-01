import type {
  AdminReportType,
  Difficulty,
  IAdminAnnouncement,
  IAdminLevelListItem,
  IAdminOverview,
  IAdminPlayerProgressResponse,
  IAdminReport,
  IAdminUserListItem,
  ILevel,
  IPaginatedResult,
  IPaginationQuery,
  IPuzzle,
  PuzzleType,
  Role,
} from '@shared/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

type LevelDetail = ILevel & {
  puzzles: IPuzzle[];
};

type LevelPayload = {
  name: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  puzzles: Array<{
    description: string;
    expectedOutput: string;
    hint?: string | null;
    type: PuzzleType;
    order: number;
  }>;
};

type AdminSearchQuery = IPaginationQuery & {
  search?: string;
};

type AdminUserListQuery = AdminSearchQuery & {
  role?: Role;
};

type AdminLevelListQuery = AdminSearchQuery & {
  difficulty?: Difficulty;
};

type AdminReportListQuery = AdminSearchQuery & {
  reportType?: AdminReportType;
};

const getData = async <T>(url: string, params?: object) => {
  const response = await api.get<ApiResponse<T>>(url, { params });
  return response.data.data;
};

const getActorScope = (actorId?: string | null) => actorId ?? 'anonymous';
const useActorId = () => useAuthStore((state) => state.user?.id ?? null);

export const adminQueryKeys = {
  root: (actorId?: string | null) => ['admin', getActorScope(actorId)] as const,
  overview: (actorId?: string | null) => [...adminQueryKeys.root(actorId), 'overview'] as const,
  users: (actorId?: string | null) => [...adminQueryKeys.root(actorId), 'users'] as const,
  players: (actorId?: string | null) => [...adminQueryKeys.root(actorId), 'players'] as const,
  player: (actorId: string | null | undefined, playerId: string) =>
    [...adminQueryKeys.players(actorId), playerId] as const,
  levels: (actorId?: string | null) => [...adminQueryKeys.root(actorId), 'levels'] as const,
  level: (actorId: string | null | undefined, levelId: string) =>
    [...adminQueryKeys.levels(actorId), levelId] as const,
  announcements: (actorId?: string | null) =>
    [...adminQueryKeys.root(actorId), 'announcements'] as const,
  reports: (actorId?: string | null) => [...adminQueryKeys.root(actorId), 'reports'] as const,
};

export const useAdminOverviewQuery = () => {
  const actorId = useActorId();

  return useQuery({
    queryKey: adminQueryKeys.overview(actorId),
    queryFn: () => getData<IAdminOverview>('/admin/overview'),
    enabled: Boolean(actorId),
  });
};

export const useAdminUsersQuery = (params?: AdminUserListQuery) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: [...adminQueryKeys.users(actorId), params] as const,
    queryFn: () => getData<IPaginatedResult<IAdminUserListItem>>('/admin/users', params),
    enabled: Boolean(actorId),
  });
};

export const useCreateAdminUserMutation = () => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: {
      username: string;
      email: string;
      password: string;
      role: Role;
    }) => {
      const response = await api.post<ApiResponse<IAdminUserListItem>>('/admin/users', payload);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users(actorId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview(actorId) });
    },
  });
};

export const useUpdateAdminUserMutation = (userId: string | null) => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: {
      username: string;
      email: string;
      password?: string;
      role: Role;
    }) => {
      const response = await api.patch<ApiResponse<IAdminUserListItem>>(`/admin/users/${userId}`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users(actorId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview(actorId) });
    },
  });
};

export const useDeleteAdminUserMutation = () => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete<ApiResponse<{ deleted: boolean; id: string; username: string }>>(
        `/admin/users/${userId}`,
      );
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users(actorId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview(actorId) });
    },
  });
};

export const useAdminPlayerProgressQuery = (
  playerId: string | null,
  params?: IPaginationQuery,
) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: playerId
      ? [...adminQueryKeys.player(actorId, playerId), params]
      : [...adminQueryKeys.players(actorId), 'idle'],
    queryFn: () => getData<IAdminPlayerProgressResponse>(`/admin/players/${playerId}/progress`, params),
    enabled: Boolean(actorId && playerId),
  });
};

export const useAdminLevelsQuery = (params?: AdminLevelListQuery) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: [...adminQueryKeys.levels(actorId), params] as const,
    queryFn: () => getData<IPaginatedResult<IAdminLevelListItem>>('/admin/levels', params),
    enabled: Boolean(actorId),
  });
};

export const useAdminLevelDetailQuery = (levelId: string | null) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: levelId
      ? adminQueryKeys.level(actorId, levelId)
      : [...adminQueryKeys.levels(actorId), 'idle'],
    queryFn: () => getData<LevelDetail>(`/levels/${levelId}`),
    enabled: Boolean(actorId && levelId),
  });
};

export const useCreateAdminLevelMutation = () => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: LevelPayload) => {
      const response = await api.post<ApiResponse<LevelDetail>>('/admin/levels', payload);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.levels(actorId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview(actorId) });
    },
  });
};

export const useUpdateAdminLevelMutation = (levelId: string | null) => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: LevelPayload) => {
      const response = await api.put<ApiResponse<LevelDetail>>(`/admin/levels/${levelId}`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      if (!levelId) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.levels(actorId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.level(actorId, levelId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview(actorId) });
    },
  });
};

export const useDeleteAdminLevelMutation = () => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (levelId: string) => {
      const response = await api.delete<ApiResponse<{ deleted: boolean; id: string }>>(
        `/admin/levels/${levelId}`,
      );
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.levels(actorId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview(actorId) });
    },
  });
};

export const useAdminAnnouncementsQuery = (params?: AdminSearchQuery) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: [...adminQueryKeys.announcements(actorId), params] as const,
    queryFn: () => getData<IPaginatedResult<IAdminAnnouncement>>('/admin/announcements', params),
    enabled: Boolean(actorId),
  });
};

export const useCreateAnnouncementMutation = () => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: { title: string; message: string }) => {
      const response = await api.post<ApiResponse<IAdminAnnouncement>>('/admin/announcements', payload);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.announcements(actorId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview(actorId) });
    },
  });
};

export const useUpdateAnnouncementMutation = (announcementId: string | null) => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: { title: string; message: string }) => {
      const response = await api.patch<ApiResponse<IAdminAnnouncement>>(
        `/admin/announcements/${announcementId}`,
        payload,
      );
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.announcements(actorId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview(actorId) });
    },
  });
};

export const useDeleteAnnouncementMutation = () => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      const response = await api.delete<ApiResponse<{ deleted: boolean; id: string; title: string }>>(
        `/admin/announcements/${announcementId}`,
      );
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.announcements(actorId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview(actorId) });
    },
  });
};

export const useAdminReportsQuery = (params?: AdminReportListQuery) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: [...adminQueryKeys.reports(actorId), params] as const,
    queryFn: () => getData<IPaginatedResult<IAdminReport>>('/admin/reports', params),
    enabled: Boolean(actorId),
  });
};

export const useGenerateReportMutation = () => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: { reportType: AdminReportType; description: string }) => {
      const response = await api.post<ApiResponse<IAdminReport>>('/admin/reports/generate', payload);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reports(actorId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview(actorId) });
    },
  });
};
