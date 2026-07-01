import type { IPaginatedResult } from './api';
import type { IAchievement } from './achievement';
import type { ILevel } from './level';
import type { CompletionStatus } from './progress';
import type { IPuzzle } from './puzzle';
import type { IUser } from './user';

export enum AdminReportType {
  PLAYER_PROGRESS = 'PLAYER_PROGRESS',
  CONTENT_USAGE = 'CONTENT_USAGE',
  ACHIEVEMENT_SUMMARY = 'ACHIEVEMENT_SUMMARY',
}

export interface IAdminOverview {
  userCount: number;
  studentCount: number;
  teacherCount: number;
  adminCount: number;
  levelCount: number;
  classroomCount: number;
  assignmentCount: number;
  announcementCount: number;
  reportCount: number;
}

export interface IAdminUserListItem extends IUser {
  studentProgressCount: number;
  achievementCount: number;
  enrolledClassroomCount: number;
  taughtClassroomCount: number;
  assignmentCount: number;
  customRoomCount: number;
  announcementCount: number;
  reportCount: number;
  canDelete: boolean;
}

export interface IAdminPlayerListItem extends IUser {
  progressCount: number;
  completedProgressCount: number;
  achievementCount: number;
  classroomCount: number;
  lastActiveAt: string | null;
}

export interface IAdminPlayerSummary extends IAdminPlayerListItem {
  totalAttempts: number;
  totalTimeSpent: number;
}

export interface IAdminPlayerProgressEntry {
  id: string;
  userId: string;
  levelId: string;
  puzzleId: string;
  status: CompletionStatus;
  attempts: number;
  timeSpent: number;
  lastUpdated: string;
  level: ILevel;
  puzzle: IPuzzle;
}

export interface IAdminPlayerProgressResponse {
  player: IAdminPlayerSummary;
  progress: IPaginatedResult<IAdminPlayerProgressEntry>;
  achievements: IAchievement[];
}

export interface IAdminAnnouncement {
  id: string;
  adminId: string;
  title: string;
  message: string;
  dateCreated: string;
  admin: Pick<IUser, 'id' | 'username' | 'email'>;
}

export interface IAdminReport {
  id: string;
  adminId: string;
  reportType: AdminReportType;
  description: string;
  generatedAt: string;
  admin: Pick<IUser, 'id' | 'username' | 'email'>;
}

export interface IAdminLevelListItem extends ILevel {
  puzzleCount: number;
  playerProgressCount: number;
}
