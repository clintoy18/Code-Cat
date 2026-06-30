import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import { AppError } from '@/middleware/errorHandler';
import { teacherService } from './teacher.service';

const requireTeacherUserId = (req: Request) => {
  if (!req.user) {
    throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
  }

  return req.user.id;
};

export const getTeacherOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getOverview(requireTeacherUserId(req));
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getStudents = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getStudents(requireTeacherUserId(_req), _req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getStudentProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getStudentProgress(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getClassrooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getClassrooms(requireTeacherUserId(req), req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const createClassroom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.createClassroom(requireTeacherUserId(req), req.body);
    return sendSuccess(res, result, 201, 'Classroom created.');
  } catch (error) {
    return next(error);
  }
};

export const updateClassroom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.updateClassroom(
      requireTeacherUserId(req),
      req.params.id,
      req.body,
    );
    return sendSuccess(res, result, 200, 'Classroom updated.');
  } catch (error) {
    return next(error);
  }
};

export const deleteClassroom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.deleteClassroom(requireTeacherUserId(req), req.params.id);
    return sendSuccess(res, result, 200, 'Classroom deleted.');
  } catch (error) {
    return next(error);
  }
};

export const getClassroomById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getClassroomById(requireTeacherUserId(req), req.params.id, req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const enrollStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.enrollStudents(requireTeacherUserId(req), req.params.id, req.body.studentIds);
    return sendSuccess(res, result, 201, 'Students enrolled.');
  } catch (error) {
    return next(error);
  }
};

export const removeEnrollment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.removeEnrollment(
      requireTeacherUserId(req),
      req.params.id,
      req.params.enrollmentId,
    );
    return sendSuccess(res, result, 200, 'Student removed from classroom.');
  } catch (error) {
    return next(error);
  }
};

export const getRoomVersions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getRoomVersions(requireTeacherUserId(req), req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const createRoomVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.createRoomVersion(requireTeacherUserId(req), req.body);
    return sendSuccess(res, result, 201, 'Custom room version created.');
  } catch (error) {
    return next(error);
  }
};

export const updateRoomLifecycle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.updateRoomLifecycle(
      requireTeacherUserId(req),
      req.params.id,
      req.body.lifecycleStatus,
    );
    return sendSuccess(res, result, 200, 'Room status updated.');
  } catch (error) {
    return next(error);
  }
};

export const createClassroomAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.createClassroomAssignment(requireTeacherUserId(req), req.params.id, req.body);
    return sendSuccess(res, result, 201, 'Assignment created.');
  } catch (error) {
    return next(error);
  }
};

export const updateClassroomAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.updateClassroomAssignment(
      requireTeacherUserId(req),
      req.params.id,
      req.params.assignmentId,
      req.body,
    );
    return sendSuccess(res, result, 200, 'Assignment updated.');
  } catch (error) {
    return next(error);
  }
};

export const deleteClassroomAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.deleteClassroomAssignment(
      requireTeacherUserId(req),
      req.params.id,
      req.params.assignmentId,
    );
    return sendSuccess(res, result, 200, 'Assignment deleted.');
  } catch (error) {
    return next(error);
  }
};

export const getClassroomDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getClassroomDashboard(requireTeacherUserId(req), req.params.id, req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};
