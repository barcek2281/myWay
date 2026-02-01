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
                <Route path="/organizations" element={<ProtectedRoute><OrgSelectorPage /></ProtectedRoute>} />
                <Route path="/organizations/:orgId" element={<ProtectedRoute><OrgCoursesPage /></ProtectedRoute>} />
                <Route path="/course/:courseId" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
                <Route path="/study/:materialId" element={<ProtectedRoute><StudyPage /></ProtectedRoute>} />
                <Route path="/items" element={<ProtectedRoute><PlaceholderPage title="Syllabus" /></ProtectedRoute>} />
                <Route path="/syllabus" element={<ProtectedRoute><PlaceholderPage title="Syllabus" /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

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
