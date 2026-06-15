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

export const getPlayers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getPlayers();
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getPlayerProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getPlayerProgress(req.params.id);
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

export const getReports = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.getReports();
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
