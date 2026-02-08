import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/auth/context/AuthContext'
import { AuthPage } from './features/auth/pages/AuthPage'
import { ProtectedRoute } from './features/auth/components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { OrgSelectorPage } from './pages/OrgSelectorPage'
import { OrgCoursesPage } from './pages/OrgCoursesPage'
import { CoursePage } from './pages/CoursePage'

import { PlaceholderPage } from './pages/PlaceholderPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { TeamPage } from './pages/TeamPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { StudyPage } from './pages/learning/StudyPage'
import { ThemeProvider } from './context/ThemeContext'
import { StudyPackProvider } from './features/ai-tutor/context/StudyPackContext'
import { NotificationProvider } from './features/notifications/context/NotificationContext'

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <StudyPackProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/signin" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/organizations" element={<OrgSelectorPage />} />
                  <Route path="/organizations/:orgId" element={<OrgCoursesPage />} />
                  <Route path="/course/:courseId" element={<CoursePage />} />
                  <Route path="/study/:materialId" element={<StudyPage />} />
                  <Route path="/items" element={<PlaceholderPage title="Syllabus" />} />
                  <Route path="/syllabus" element={<PlaceholderPage title="Syllabus" />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </StudyPackProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
