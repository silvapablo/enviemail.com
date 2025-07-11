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
import { useSecureStore } from './store/secureStore';
import { dbManager } from './database/indexedDBManager';
import { performanceMonitor } from './monitoring/performanceMonitor';
import { useRealTimeData } from './hooks/useRealTimeData';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';

function App() {
  const { currentPage, setCurrentPage, validateSession, user } = useSecureStore();
  
  // Initialize real-time data connection
  const { connectionState, latency } = useRealTimeData({
    autoConnect: true,
    reconnectOnError: true
  });
  
  // Initialize performance monitoring
  usePerformanceMonitoring();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize IndexedDB
        await dbManager.initialize();
        
        // Initialize performance monitoring
        performanceMonitor.initialize();
        
        // Validate session
        await validateSession();
        
        console.log('App initialized successfully');
      } catch (error) {
        console.error('App initialization failed:', error);
      }
    };
    
    initializeApp();
  }, [validateSession]);

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