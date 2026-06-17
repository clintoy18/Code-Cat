import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LoadingSpinner } from '@/components/shared';
import { HomeRedirect } from './HomeRedirect';
import { AdminRoutes } from './AdminRoutes';
import { GameplayRedirect } from './GameplayRedirect';
import { PlayerRoutes } from './PlayerRoutes';
import { TeacherRoutes } from './TeacherRoutes';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })),
);
const MainMenu = lazy(() => import('@/pages/player/MainMenu').then((module) => ({ default: module.MainMenu })));
const LevelSelect = lazy(() =>
  import('@/pages/player/LevelSelect').then((module) => ({ default: module.LevelSelect })),
);
const Gameplay = lazy(() => import('@/pages/player/Gameplay').then((module) => ({ default: module.Gameplay })));
const Achievements = lazy(() =>
  import('@/pages/player/Achievements').then((module) => ({ default: module.Achievements })),
);
const Dashboard = lazy(() => import('@/pages/admin/Dashboard').then((module) => ({ default: module.Dashboard })));
const LevelManager = lazy(() =>
  import('@/pages/admin/LevelManager').then((module) => ({ default: module.LevelManager })),
);
const PlayerReports = lazy(() =>
  import('@/pages/admin/PlayerReports').then((module) => ({ default: module.PlayerReports })),
);
const TeacherDashboard = lazy(() =>
  import('@/pages/teacher/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const TeacherStudents = lazy(() =>
  import('@/pages/teacher/Students').then((module) => ({ default: module.Students })),
);
const TeacherLessons = lazy(() =>
  import('@/pages/teacher/Lessons').then((module) => ({ default: module.Lessons })),
);

export const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<PlayerRoutes />}>
          <Route path="/" element={<MainMenu />} />
          <Route path="/levels" element={<LevelSelect />} />
          <Route path="/gameplay" element={<GameplayRedirect />} />
          <Route path="/gameplay/:puzzleId" element={<Gameplay />} />
          <Route path="/achievements" element={<Achievements />} />
        </Route>
        <Route path="/admin" element={<AdminRoutes />}>
          <Route index element={<Dashboard />} />
          <Route path="levels" element={<LevelManager />} />
          <Route path="reports" element={<PlayerReports />} />
        </Route>
        <Route path="/teacher" element={<TeacherRoutes />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="lessons" element={<TeacherLessons />} />
        </Route>
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
