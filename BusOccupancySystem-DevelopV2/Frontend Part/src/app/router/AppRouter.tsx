import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { AdminPage } from '../pages/AdminPage';
import { AuthorizedLoginPage } from '../pages/AuthorizedLoginPage';
import { BusDetailPage } from '../pages/BusDetailPage';
import { BusesDashboardPage } from '../pages/BusesDashboardPage';
import { StatisticsPage } from '../pages/StatisticsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BusesDashboardPage />} />
        <Route path="/login" element={<AuthorizedLoginPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/:id" element={<BusDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
