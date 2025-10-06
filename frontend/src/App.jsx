import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/common/Layout';
import SessionTimer from './components/common/SessionTimer';
import Home from './pages/Home';
import BrowseFiles from './pages/BrowseFiles';
import MyFiles from './pages/MyFiles';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ConversionPage from './pages/ConversionPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminFiles from './pages/AdminFiles';
import NotFound from './pages/NotFound';

// Component to conditionally render SessionTimer
const ConditionalSessionTimer = () => {
  const location = useLocation();
  
  // Hide SessionTimer on these pages
  const hideTimerPages = ['/login', '/register', '/browse'];
  
  // Check if current path matches any hide pages
  const shouldHideTimer = hideTimerPages.some(path => 
    location.pathname === path || location.pathname.startsWith(path)
  );
  
  if (shouldHideTimer) return null;
  
  return <SessionTimer />;
};

function App() {
  return (
    <Router>
      {/* Toast Notification Container */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.5rem',
            padding: '16px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<BrowseFiles />} />
          <Route path="my-files" element={<MyFiles />} />
          <Route path="profile" element={<Profile />} />
          <Route path="conversion" element={<ConversionPage />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/files" element={<AdminFiles />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Conditional SessionTimer */}
      <ConditionalSessionTimer />
    </Router>
  );
}

export default App;