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
    const result = await teacherService.getStudents();
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
    const result = await teacherService.getClassrooms(requireTeacherUserId(req));
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

export const getClassroomById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getClassroomById(requireTeacherUserId(req), req.params.id);
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

export const getRoomVersions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getRoomVersions(requireTeacherUserId(req));
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

export const createClassroomAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.createClassroomAssignment(requireTeacherUserId(req), req.params.id, req.body);
    return sendSuccess(res, result, 201, 'Assignment created.');
  } catch (error) {
    return next(error);
  }
};

export const getClassroomDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await teacherService.getClassroomDashboard(requireTeacherUserId(req), req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};
