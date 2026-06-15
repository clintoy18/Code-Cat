export enum Role {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export interface IUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
}
