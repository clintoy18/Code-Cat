import { Router } from 'express';
import { Role } from '@shared/types/user';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import {
  createClassroom,
  createClassroomAssignment,
  createRoomVersion,
  deleteClassroom,
  deleteClassroomAssignment,
  enrollStudents,
  getClassroomById,
  getClassroomDashboard,
  getClassrooms,
  getRoomVersions,
  getStudentProgress,
  getStudents,
  getTeacherOverview,
  removeEnrollment,
  updateClassroom,
  updateClassroomAssignment,
  updateRoomLifecycle,
} from './teacher.controller';
import {
  classroomDashboardPaginationQuerySchema,
  classroomAssignmentParamsSchema,
  classroomDetailPaginationQuerySchema,
  classroomEnrollmentParamsSchema,
  classroomParamsSchema,
  createClassroomAssignmentSchema,
  createClassroomSchema,
  createTeacherRoomVersionSchema,
  enrollStudentsSchema,
  roomVersionParamsSchema,
  teacherPaginationQuerySchema,
  teacherStudentParamsSchema,
  updateClassroomAssignmentSchema,
  updateClassroomSchema,
  updateRoomLifecycleSchema,
} from './teacher.schema';

export const teacherRouter = Router();

teacherRouter.use(authenticate, authorize(Role.TEACHER, Role.ADMIN));
teacherRouter.get('/overview', getTeacherOverview);
teacherRouter.get('/students', validate({ query: teacherPaginationQuerySchema }), getStudents);
teacherRouter.get('/students/:id/progress', validate({ params: teacherStudentParamsSchema }), getStudentProgress);
teacherRouter.get('/classrooms', validate({ query: teacherPaginationQuerySchema }), getClassrooms);
teacherRouter.post('/classrooms', validate({ body: createClassroomSchema }), createClassroom);
teacherRouter.patch('/classrooms/:id', validate({ params: classroomParamsSchema, body: updateClassroomSchema }), updateClassroom);
teacherRouter.delete('/classrooms/:id', validate({ params: classroomParamsSchema }), deleteClassroom);
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
teacherRouter.delete(
  '/classrooms/:id/enrollments/:enrollmentId',
  validate({ params: classroomEnrollmentParamsSchema }),
  removeEnrollment,
);
teacherRouter.post(
  '/classrooms/:id/assignments',
  validate({ params: classroomParamsSchema, body: createClassroomAssignmentSchema }),
  createClassroomAssignment,
);
teacherRouter.patch(
  '/classrooms/:id/assignments/:assignmentId',
  validate({ params: classroomAssignmentParamsSchema, body: updateClassroomAssignmentSchema }),
  updateClassroomAssignment,
);
teacherRouter.delete(
  '/classrooms/:id/assignments/:assignmentId',
  validate({ params: classroomAssignmentParamsSchema }),
  deleteClassroomAssignment,
);
teacherRouter.get('/rooms', validate({ query: teacherPaginationQuerySchema }), getRoomVersions);
teacherRouter.post('/rooms', validate({ body: createTeacherRoomVersionSchema }), createRoomVersion);
teacherRouter.patch(
  '/rooms/:id/lifecycle',
  validate({ params: roomVersionParamsSchema, body: updateRoomLifecycleSchema }),
  updateRoomLifecycle,
);
