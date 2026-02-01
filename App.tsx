
import React, { useState, useEffect } from 'react';
import RoutePlanner from './components/RoutePlanner';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import AddBusModal from './components/AddBusModal';
import { databaseService } from './services/databaseService';
import { User, UserRole } from './types';
import { ToastProvider } from './context/ToastContext';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddBus, setShowAddBus] = useState(false);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
        try {
            const currentUser = await databaseService.getCurrentUser();
            setUser(currentUser);
        } catch (e) {
            console.error("Session init error:", e);
        }
    };
    initSession();
  }, []);

  const handleLoginSuccess = (user: User) => {
      setUser(user);
      setShowLogin(false);
  };

  const handleLogout = async () => {
      await databaseService.logout();
      setUser(null);
      setShowAdmin(false);
      setShowProfile(false);
      setShowAddBus(false);
  };

  return (
    <div className="min-h-screen bg-void text-mist font-sans transition-colors duration-300">
      <RoutePlanner 
        user={user} 
        onLoginClick={() => setShowLogin(true)} 
        onLogoutClick={handleLogout}
        onAdminClick={() => setShowAdmin(true)}
        onProfileClick={() => setShowProfile(true)}
        onAddBusClick={() => setShowAddBus(true)}
      />
      
      {showLogin && (
          <LoginModal 
            onLoginSuccess={handleLoginSuccess} 
            onClose={() => setShowLogin(false)} 
          />
      )}

      {showAdmin && user?.role === 'admin' && (
          <AdminDashboard onClose={() => setShowAdmin(false)} />
      )}

      {showProfile && user && (
          <UserProfile user={user} onClose={() => setShowProfile(false)} />
      )}

      {showAddBus && (
          <AddBusModal onClose={() => setShowAddBus(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
};

export default App;
