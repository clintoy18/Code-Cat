import type { IPaginatedResult, IPaginationQuery } from '@shared/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AssignmentTargetType,
  IClassroom,
  IClassroomAssignment,
  IClassroomEnrollment,
  IStudentAssignmentRoomProgress,
  ITeacherRoomDefinition,
  ITeacherRoomVersion,
  LessonTopic,
  RoomLifecycleStatus,
} from '@shared/types/teacher';
import type { CompletionStatus } from '@shared/types/progress';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

type TeacherStudentRecord = {
  id: string;
  username: string;
  email: string;
  role: 'STUDENT';
  createdAt: string;
  classroomCount: number;
  assignmentRoomCount: number;
  isEnrolledInClassroom?: boolean;
};

type ClassroomDetail = {
  classroom: IClassroom;
  enrollments: IPaginatedResult<IClassroomEnrollment>;
  assignments: IPaginatedResult<IClassroomAssignment>;
};

type TeacherOverview = {
  classroomCount: number;
  publishedRoomCount: number;
  assignmentCount: number;
  dueSoonCount: number;
  enrolledStudentCount: number;
};

type TeacherDashboard = {
  classroom: IClassroom;
  enrollments: IClassroomEnrollment[];
  assignments: IClassroomAssignment[];
  summary: {
    studentCount: number;
    assignmentCount: number;
    roomCount: number;
  };
  roster: IPaginatedResult<{
    student: TeacherStudentRecord;
    assignedRooms: number;
    solvedRooms: number;
    totalAttempts: number;
    totalFailures: number;
    averageScore: number | null;
    letterGrade: string | null;
    lastPlayedAt: string | null;
    achievements: {
      roomsCleared: number;
      highScores: number;
      comebackClears: number;
    };
    roomProgress: IStudentAssignmentRoomProgress[];
  }>;
};

type StudentAssignmentsFeed = IPaginatedResult<{
  classroom: IClassroom;
  enrolledAt: string;
  assignments: Array<{
    assignment: IClassroomAssignment;
    progress: IStudentAssignmentRoomProgress[];
    customRoom: ITeacherRoomVersion | null;
  }>;
}>;

type StudentAssignmentDetail = {
  classroom: IClassroom;
  assignment: IClassroomAssignment;
  progress: IStudentAssignmentRoomProgress[];
  customRoom: ITeacherRoomVersion | null;
};

const getData = async <T>(url: string, params?: object) => {
  const response = await api.get<ApiResponse<T>>(url, { params });
  return response.data.data;
};

const getActorScope = (actorId?: string | null) => actorId ?? 'anonymous';
const useActorId = () => useAuthStore((state) => state.user?.id ?? null);

export const teacherQueryKeys = {
  teacherRoot: (actorId?: string | null) => ['teacher', getActorScope(actorId)] as const,
  overview: (actorId?: string | null) =>
    [...teacherQueryKeys.teacherRoot(actorId), 'overview'] as const,
  students: (actorId?: string | null) =>
    [...teacherQueryKeys.teacherRoot(actorId), 'students'] as const,
  classrooms: (actorId?: string | null) =>
    [...teacherQueryKeys.teacherRoot(actorId), 'classrooms'] as const,
  classroom: (actorId: string | null | undefined, classroomId: string) =>
    [...teacherQueryKeys.classrooms(actorId), classroomId] as const,
  classroomDashboard: (actorId: string | null | undefined, classroomId: string) =>
    [...teacherQueryKeys.classroom(actorId, classroomId), 'dashboard'] as const,
  rooms: (actorId?: string | null) =>
    [...teacherQueryKeys.teacherRoot(actorId), 'rooms'] as const,
  studentAssignments: (actorId?: string | null) =>
    ['student', getActorScope(actorId), 'assignments'] as const,
  studentAssignment: (actorId: string | null | undefined, assignmentId: string) =>
    [...teacherQueryKeys.studentAssignments(actorId), assignmentId] as const,
};

export const useTeacherOverviewQuery = () => {
  const actorId = useActorId();

  return useQuery({
    queryKey: teacherQueryKeys.overview(actorId),
    queryFn: () => getData<TeacherOverview>('/teacher/overview'),
    enabled: Boolean(actorId),
  });
};

export const useTeacherStudentsQuery = (
  params?: IPaginationQuery & { classroomId?: string },
) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: [...teacherQueryKeys.students(actorId), params] as const,
    queryFn: () => getData<IPaginatedResult<TeacherStudentRecord>>('/teacher/students', params),
    enabled: Boolean(actorId),
  });
};

export const useTeacherClassroomsQuery = (params?: IPaginationQuery) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: [...teacherQueryKeys.classrooms(actorId), params] as const,
    queryFn: () => getData<IPaginatedResult<IClassroom>>('/teacher/classrooms', params),
    enabled: Boolean(actorId),
  });
};

export const useTeacherClassroomQuery = (
  classroomId: string | null,
  params?: {
    enrollmentsPage?: number;
    enrollmentsPageSize?: number;
    assignmentsPage?: number;
    assignmentsPageSize?: number;
  },
) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: classroomId
      ? [...teacherQueryKeys.classroom(actorId, classroomId), params]
      : [...teacherQueryKeys.classrooms(actorId), 'idle'],
    queryFn: () => getData<ClassroomDetail>(`/teacher/classrooms/${classroomId}`, params),
    enabled: Boolean(actorId && classroomId),
  });
};

export const useTeacherClassroomDashboardQuery = (
  classroomId: string | null,
  params?: { rosterPage?: number; rosterPageSize?: number },
) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: classroomId
      ? [...teacherQueryKeys.classroomDashboard(actorId, classroomId), params]
      : [...teacherQueryKeys.teacherRoot(actorId), 'dashboard', 'idle'],
    queryFn: () => getData<TeacherDashboard>(`/teacher/classrooms/${classroomId}/dashboard`, params),
    enabled: Boolean(actorId && classroomId),
  });
};

export const useTeacherRoomsQuery = (params?: IPaginationQuery) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: [...teacherQueryKeys.rooms(actorId), params] as const,
    queryFn: () => getData<IPaginatedResult<ITeacherRoomVersion>>('/teacher/rooms', params),
    enabled: Boolean(actorId),
  });
};

export const useCreateClassroomMutation = () => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description: string;
      isPrivate: boolean;
      requiresApproval: boolean;
      studentIds?: string[];
    }) => {
      const response = await api.post<ApiResponse<IClassroom>>('/teacher/classrooms', payload);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classrooms(actorId) });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.overview(actorId) });
    },
  });
};

export const useEnrollStudentsMutation = (classroomId: string | null) => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (studentIds: string[]) => {
      const response = await api.post<ApiResponse<IClassroomEnrollment[]>>(
        `/teacher/classrooms/${classroomId}/enrollments`,
        { studentIds },
      );
      return response.data.data;
    },
    onSuccess: () => {
      if (!classroomId) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classroom(actorId, classroomId) });
      void queryClient.invalidateQueries({
        queryKey: teacherQueryKeys.classroomDashboard(actorId, classroomId),
      });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classrooms(actorId) });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.overview(actorId) });
    },
  });
};

export const useCreateRoomMutation = () => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: {
      baseVersionId?: string;
      title: string;
      description: string;
      lessonTag: LessonTopic;
      objective: string;
      difficulty: ITeacherRoomVersion['difficulty'];
      parMoves: number;
      codeBudget: number;
      lifecycleStatus: RoomLifecycleStatus;
      definition: ITeacherRoomDefinition;
    }) => {
      const response = await api.post<ApiResponse<ITeacherRoomVersion>>('/teacher/rooms', payload);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.rooms(actorId) });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.overview(actorId) });
    },
  });
};

export const useCreateAssignmentMutation = (classroomId: string | null) => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string | null;
      targetType: AssignmentTargetType;
      startAt: string;
      dueAt?: string | null;
      officialWorldId?: string;
      officialPuzzleId?: string;
      customRoomVersionId?: string;
      roomManifest?: IClassroomAssignment['roomManifest'];
    }) => {
      const response = await api.post<ApiResponse<IClassroomAssignment>>(
        `/teacher/classrooms/${classroomId}/assignments`,
        payload,
      );
      return response.data.data;
    },
    onSuccess: () => {
      if (!classroomId) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classroom(actorId, classroomId) });
      void queryClient.invalidateQueries({
        queryKey: teacherQueryKeys.classroomDashboard(actorId, classroomId),
      });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classrooms(actorId) });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.overview(actorId) });
    },
  });
};

export const useStudentAssignmentsQuery = (
  params?: IPaginationQuery & { classroomId?: string },
) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: [...teacherQueryKeys.studentAssignments(actorId), params] as const,
    queryFn: () => getData<StudentAssignmentsFeed>('/progress/assignments/me', params),
    enabled: Boolean(actorId),
  });
};

export const useStudentAssignmentQuery = (assignmentId: string | null) => {
  const actorId = useActorId();

  return useQuery({
    queryKey: assignmentId
      ? teacherQueryKeys.studentAssignment(actorId, assignmentId)
      : [...teacherQueryKeys.studentAssignments(actorId), 'idle'],
    queryFn: () => getData<StudentAssignmentDetail>(`/progress/assignments/me/${assignmentId}`),
    enabled: Boolean(actorId && assignmentId),
  });
};

export const useCreateAssignmentRoomProgressMutation = () => {
  const queryClient = useQueryClient();
  const actorId = useActorId();

  return useMutation({
    mutationFn: async (payload: {
      assignmentId: string;
      roomKey: string;
      status: CompletionStatus;
      movesUsed: number;
      blocksUsed: number;
      timeSpent: number;
    }) => {
      const response = await api.post<ApiResponse<IStudentAssignmentRoomProgress>>('/progress/rooms', payload);
      return response.data.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.studentAssignments(actorId) });
      void queryClient.invalidateQueries({
        queryKey: teacherQueryKeys.studentAssignment(actorId, variables.assignmentId),
      });
    },
  });
};
