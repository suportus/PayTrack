import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MonthlyOverview } from './components/MonthlyOverview';
import { MonthDetail } from './components/MonthDetail';
import { Settings } from './components/Settings';
import { LoginScreen } from './components/LoginScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { SplashScreen } from './components/SplashScreen';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';

type View = 'overview' | 'detail' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  useEffect(() => {
    // Show splash screen for minimum 1.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleViewMonth = (month: number, year: number) => {
    setSelectedMonth({ month, year });
    setCurrentView('detail');
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedMonth(null);
  };

  const handleNavigateToSettings = () => {
    setCurrentView('settings');
  };

  const handleBackFromSettings = () => {
    setCurrentView('overview');
  };

  if (showSplash || isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SplashScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col bg-background">
        {!isAuthenticated ? (
          <LoginScreen />
        ) : showProfileSetup ? (
          <ProfileSetup />
        ) : (
          <>
            <Header 
              currentView={currentView}
              onNavigateToSettings={handleNavigateToSettings}
              onBackToOverview={handleBackToOverview}
            />
            
            <main className="flex-1">
              {currentView === 'overview' && (
                <MonthlyOverview onViewMonth={handleViewMonth} />
              )}
              
              {currentView === 'detail' && selectedMonth && (
                <MonthDetail 
                  month={selectedMonth.month}
                  year={selectedMonth.year}
                  onBack={handleBackToOverview}
                />
              )}
              
              {currentView === 'settings' && (
                <Settings onBack={handleBackFromSettings} />
              )}
            </main>
            
            <Footer />
          </>
        )}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;
