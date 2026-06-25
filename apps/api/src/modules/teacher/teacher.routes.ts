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
  classroomParamsSchema,
  createClassroomAssignmentSchema,
  createClassroomSchema,
  createTeacherRoomVersionSchema,
  enrollStudentsSchema,
  teacherStudentParamsSchema,
} from './teacher.schema';

export const teacherRouter = Router();

teacherRouter.use(authenticate, authorize(Role.TEACHER, Role.ADMIN));
teacherRouter.get('/overview', getTeacherOverview);
teacherRouter.get('/students', getStudents);
teacherRouter.get('/students/:id/progress', validate({ params: teacherStudentParamsSchema }), getStudentProgress);
teacherRouter.get('/classrooms', getClassrooms);
teacherRouter.post('/classrooms', validate({ body: createClassroomSchema }), createClassroom);
teacherRouter.get('/classrooms/:id', validate({ params: classroomParamsSchema }), getClassroomById);
teacherRouter.get('/classrooms/:id/dashboard', validate({ params: classroomParamsSchema }), getClassroomDashboard);
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
teacherRouter.get('/rooms', getRoomVersions);
teacherRouter.post('/rooms', validate({ body: createTeacherRoomVersionSchema }), createRoomVersion);
