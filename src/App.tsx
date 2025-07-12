import React, { useState } from 'react';
import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Campaigns } from './pages/Campaigns';
import { Validation } from './pages/Validation';
import { Staking } from './pages/Staking';
import { Analytics } from './pages/Analytics';
import { Security } from './pages/Security';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const { user, isAuthenticated } = useAuth();
  const { refetch } = useData();

  useEffect(() => {
    if (isAuthenticated && currentPage === 'landing') {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated, currentPage]);

  const handleGetStarted = () => {
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing onGetStarted={handleGetStarted} />;
      case 'dashboard':
        return <Dashboard />;
      case 'campaigns':
        return <Campaigns />;
      case 'validation':
        return <Validation />;
      case 'staking':
        return <Staking />;
      case 'analytics':
        return <Analytics />;
      case 'security':
        return <Security />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {currentPage !== 'landing' && (
        <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      )}
      
      <main className={currentPage !== 'landing' ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;