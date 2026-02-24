import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import ParticipantDashboard from './pages/ParticipantDashboard';
import BrowseEvents from './pages/BrowseEvents';
import EventDetails from './pages/EventDetails';
import AdminDashboard from './pages/AdminDashboard';
import CreateOrganizer from './pages/CreateOrganizer';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import OrganizerEventDetails from './pages/OrganizerEventDetails';
import Profile from './pages/Profile';
import ClubsListing from './pages/ClubsListing';
import AdminResetRequests from './pages/AdminResetRequests';
import OrganizerQRScanner from './pages/OrganizerQRScanner';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />

          {/* Onboarding Route */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Participant Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['participant', 'admin']}>
                <ParticipantDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute allowedRoles={['participant', 'admin']}>
                <BrowseEvents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:id"
            element={
              <ProtectedRoute allowedRoles={['participant', 'admin']}>
                <EventDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clubs"
            element={
              <ProtectedRoute allowedRoles={['participant', 'admin']}>
                <ClubsListing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['participant', 'organizer', 'admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Organizer Routes */}
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/create-event"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/events/:id"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerEventDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/events/:id/scanner"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerQRScanner />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/create-organizer"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CreateOrganizer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reset-requests"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminResetRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={
              <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>Unauthorized</h2>
                <p>You do not have permission to access this page.</p>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
