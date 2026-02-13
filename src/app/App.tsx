import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DatabaseProvider } from './providers/DatabaseProvider';
import { MainLayout } from './layouts/MainLayout';
import { TodayPage } from './pages/TodayPage';
import { SchedulePage } from './pages/SchedulePage';
import { SubjectsPage } from './pages/SubjectsPage';
import { MorePage } from './pages/MorePage';

export function App() {
  return (
    <DatabaseProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<TodayPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="more" element={<MorePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DatabaseProvider>
  );
}