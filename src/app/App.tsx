import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DatabaseProvider } from './providers/DatabaseProvider';
import { SyncProvider } from '../database/sync/SyncProvider';
import { SettingsProvider } from '../features/settings/SettingsProvider';
import { MainLayout } from './layouts/MainLayout';
import { TodayPage } from './pages/TodayPage';
import { SchedulePage } from './pages/SchedulePage';
import { SubjectsPage } from './pages/SubjectsPage';
import { MorePage } from './pages/MorePage';
import { ThemeProvider } from '../features/settings/ThemeProvider';

export function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <SyncProvider>
          <SettingsProvider>
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
          </SettingsProvider>
        </SyncProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}