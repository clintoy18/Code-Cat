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

export const teacherQueryKeys = {
  overview: ['teacher', 'overview'] as const,
  students: ['teacher', 'students'] as const,
  classrooms: ['teacher', 'classrooms'] as const,
  classroom: (classroomId: string) => ['teacher', 'classrooms', classroomId] as const,
  classroomDashboard: (classroomId: string) => ['teacher', 'classrooms', classroomId, 'dashboard'] as const,
  rooms: ['teacher', 'rooms'] as const,
  studentAssignments: ['student', 'assignments'] as const,
  studentAssignment: (assignmentId: string) => ['student', 'assignments', assignmentId] as const,
};

export const useTeacherOverviewQuery = () =>
  useQuery({
    queryKey: teacherQueryKeys.overview,
    queryFn: () => getData<TeacherOverview>('/teacher/overview'),
  });

export const useTeacherStudentsQuery = (
  params?: IPaginationQuery & { classroomId?: string },
) =>
  useQuery({
    queryKey: [...teacherQueryKeys.students, params] as const,
    queryFn: () => getData<IPaginatedResult<TeacherStudentRecord>>('/teacher/students', params),
  });

export const useTeacherClassroomsQuery = (params?: IPaginationQuery) =>
  useQuery({
    queryKey: [...teacherQueryKeys.classrooms, params] as const,
    queryFn: () => getData<IPaginatedResult<IClassroom>>('/teacher/classrooms', params),
  });

export const useTeacherClassroomQuery = (
  classroomId: string | null,
  params?: {
    enrollmentsPage?: number;
    enrollmentsPageSize?: number;
    assignmentsPage?: number;
    assignmentsPageSize?: number;
  },
) =>
  useQuery({
    queryKey: classroomId
      ? [...teacherQueryKeys.classroom(classroomId), params]
      : ['teacher', 'classrooms', 'idle'],
    queryFn: () => getData<ClassroomDetail>(`/teacher/classrooms/${classroomId}`, params),
    enabled: Boolean(classroomId),
  });

export const useTeacherClassroomDashboardQuery = (
  classroomId: string | null,
  params?: { rosterPage?: number; rosterPageSize?: number },
) =>
  useQuery({
    queryKey: classroomId
      ? [...teacherQueryKeys.classroomDashboard(classroomId), params]
      : ['teacher', 'dashboard', 'idle'],
    queryFn: () => getData<TeacherDashboard>(`/teacher/classrooms/${classroomId}/dashboard`, params),
    enabled: Boolean(classroomId),
  });

export const useTeacherRoomsQuery = (params?: IPaginationQuery) =>
  useQuery({
    queryKey: [...teacherQueryKeys.rooms, params] as const,
    queryFn: () => getData<IPaginatedResult<ITeacherRoomVersion>>('/teacher/rooms', params),
  });

export const useCreateClassroomMutation = () => {
  const queryClient = useQueryClient();

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
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classrooms });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.overview });
    },
  });
};

export const useEnrollStudentsMutation = (classroomId: string | null) => {
  const queryClient = useQueryClient();

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

      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classroom(classroomId) });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classroomDashboard(classroomId) });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classrooms });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.overview });
    },
  });
};

export const useCreateRoomMutation = () => {
  const queryClient = useQueryClient();

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
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.rooms });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.overview });
    },
  });
};

export const useCreateAssignmentMutation = (classroomId: string | null) => {
  const queryClient = useQueryClient();

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

      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classroom(classroomId) });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classroomDashboard(classroomId) });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.classrooms });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.overview });
    },
  });
};

export const useStudentAssignmentsQuery = (params?: IPaginationQuery) =>
  useQuery({
    queryKey: [...teacherQueryKeys.studentAssignments, params] as const,
    queryFn: () => getData<StudentAssignmentsFeed>('/progress/assignments/me', params),
  });

export const useStudentAssignmentQuery = (assignmentId: string | null) =>
  useQuery({
    queryKey: assignmentId ? teacherQueryKeys.studentAssignment(assignmentId) : ['student', 'assignments', 'idle'],
    queryFn: () => getData<StudentAssignmentDetail>(`/progress/assignments/me/${assignmentId}`),
    enabled: Boolean(assignmentId),
  });

export const useCreateAssignmentRoomProgressMutation = () => {
  const queryClient = useQueryClient();

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
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.studentAssignments });
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.studentAssignment(variables.assignmentId) });
    },
  });
};
