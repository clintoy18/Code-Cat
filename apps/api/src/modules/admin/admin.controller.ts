import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@/lib/apiResponse';
import { AppError } from '@/middleware/errorHandler';
import { adminService } from './admin.service';

const requireAdmin = (req: Request) => {
  if (!req.user) {
    throw new AppError('UNAUTHORIZED', 'Authentication is required.', 401);
  }

  return req.user;
};

export const getOverview = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getOverview();
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getUsers(req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.createUser(req.body);
    return sendSuccess(res, result, 201, 'User created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.updateUser(req.params.id, req.body);
    return sendSuccess(res, result, 200, 'User updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.deleteUser(req.params.id);
    return sendSuccess(res, result, 200, 'User deleted successfully.');
  } catch (error) {
    return next(error);
  }
};

export const getPlayers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getPlayers(req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getPlayerProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getPlayerProgress(req.params.id, req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getAdminLevels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getLevels(req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const createLevel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.createLevel(req.body);
    return sendSuccess(res, result, 201, 'Level created successfully.');
  } catch (error) {
    return next(error);
  }
};

export const updateLevel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.updateLevel(req.params.id, req.body);
    return sendSuccess(res, result, 200, 'Level updated successfully.');
  } catch (error) {
    return next(error);
  }
};

export const deleteLevel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.deleteLevel(req.params.id);
    return sendSuccess(res, result, 200, 'Level deleted successfully.');
  } catch (error) {
    return next(error);
  }
};

export const createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireAdmin(req);
    const result = await adminService.createAnnouncement(user.id, req.body);
    return sendSuccess(res, result, 201, 'Announcement created.');
  } catch (error) {
    return next(error);
  }
};

export const getAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getAnnouncements(req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const updateAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.updateAnnouncement(req.params.id, req.body);
    return sendSuccess(res, result, 200, 'Announcement updated.');
  } catch (error) {
    return next(error);
  }
};

export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.deleteAnnouncement(req.params.id);
    return sendSuccess(res, result, 200, 'Announcement deleted.');
  } catch (error) {
    return next(error);
  }
};

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getReports(req.query);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = requireAdmin(req);
    const result = await adminService.generateReport(user.id, req.body);
    return sendSuccess(res, result, 201, 'Report generated.');
  } catch (error) {
    return next(error);
  }
};
