import type { Prisma } from '@prisma/client';
import type { Role } from '@shared/types/user';
import { prisma } from '@/config/database';
import { compareHash, hashValue } from '@/lib/hash';
import { signJwt } from '@/lib/jwt';
import { AppError } from '@/middleware/errorHandler';

type PrismaRole = NonNullable<Prisma.UserCreateInput['role']>;

interface IRegisterInput {
  username: string;
  email: string;
  password: string;
  role: Role;
}

interface ILoginInput {
  email: string;
  password: string;
}

const formatUser = (user: {
  id: string;
  username: string;
  email: string;
  role: PrismaRole;
  createdAt: Date;
}) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role as Role,
  createdAt: user.createdAt.toISOString(),
});

const createToken = (user: { id: string; username: string; email: string; role: PrismaRole }) =>
  signJwt({
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role as Role,
  });

export const authService = {
  async register(input: IRegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      throw new AppError('CONFLICT', 'A user with that email or username already exists.', 409);
    }

    const passwordHash = await hashValue(input.password);
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        role: input.role as PrismaRole,
        settings: {
          create: {},
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      user: formatUser(user),
      token: createToken(user),
    };
  },

  async login(input: ILoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password.', 401);
    }

    const isPasswordValid = await compareHash(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password.', 401);
    }

    return {
      user: formatUser(user),
      token: createToken(user),
    };
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found.', 404);
    }

    return formatUser(user);
  },

  async logout() {
    return {
      revoked: true,
    };
  },
};
