import { Router } from 'express';
import { Role } from '@shared/types/user';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import {
  createClassroom,
  createClassroomAssignment,
  createRoomVersion,
  enrollStudents,
  getClassroomById,
  getClassroomDashboard,
  getClassrooms,
  getRoomVersions,
  getStudentProgress,
  getStudents,
  getTeacherOverview,
} from './teacher.controller';
import {
  classroomDashboardPaginationQuerySchema,
  classroomDetailPaginationQuerySchema,
  classroomParamsSchema,
  createClassroomAssignmentSchema,
  createClassroomSchema,
  createTeacherRoomVersionSchema,
  enrollStudentsSchema,
  teacherPaginationQuerySchema,
  teacherStudentParamsSchema,
} from './teacher.schema';

export const teacherRouter = Router();

teacherRouter.use(authenticate, authorize(Role.TEACHER, Role.ADMIN));
teacherRouter.get('/overview', getTeacherOverview);
teacherRouter.get('/students', validate({ query: teacherPaginationQuerySchema }), getStudents);
teacherRouter.get('/students/:id/progress', validate({ params: teacherStudentParamsSchema }), getStudentProgress);
teacherRouter.get('/classrooms', validate({ query: teacherPaginationQuerySchema }), getClassrooms);
teacherRouter.post('/classrooms', validate({ body: createClassroomSchema }), createClassroom);
teacherRouter.get(
  '/classrooms/:id',
  validate({ params: classroomParamsSchema, query: classroomDetailPaginationQuerySchema }),
  getClassroomById,
);
teacherRouter.get(
  '/classrooms/:id/dashboard',
  validate({ params: classroomParamsSchema, query: classroomDashboardPaginationQuerySchema }),
  getClassroomDashboard,
);
teacherRouter.post(
  '/classrooms/:id/enrollments',
  validate({ params: classroomParamsSchema, body: enrollStudentsSchema }),
  enrollStudents,
);
teacherRouter.post(
  '/classrooms/:id/assignments',
  validate({ params: classroomParamsSchema, body: createClassroomAssignmentSchema }),
  createClassroomAssignment,
);
teacherRouter.get('/rooms', validate({ query: teacherPaginationQuerySchema }), getRoomVersions);
teacherRouter.post('/rooms', validate({ body: createTeacherRoomVersionSchema }), createRoomVersion);
