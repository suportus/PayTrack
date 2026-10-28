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
import { PrincipalDisplay } from './components/PrincipalDisplay';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { isAccessDenied } from './lib/canisterEnv';

type View = 'overview' | 'detail' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const { identity, isInitializing, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: profileLoading, isFetched, error: profileError } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const principal = identity?.getPrincipal().toText() ?? '';

  const handleLogout = () => {
    clear();
    queryClient.clear();
  };
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
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <SplashScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="flex min-h-screen flex-col bg-background">
        {!isAuthenticated ? (
          <LoginScreen />
        ) : profileError ? (
          // Not on the allow-list (or backend unreachable): show the principal
          // so it can be added with addUser.
          <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl font-bold">
                  {isAccessDenied(profileError) ? 'Dostop zavrnjen' : 'Napaka pri povezavi'}
                </CardTitle>
                <CardDescription className="text-base">
                  {isAccessDenied(profileError)
                    ? 'Vaš račun še nima dostopa. Spodnji principal pošljite skrbniku, da vas doda.'
                    : 'Povezava z zaledjem ni uspela. Poskusite znova pozneje.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <PrincipalDisplay principal={principal} />
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  Odjava
                </Button>
              </CardContent>
            </Card>
          </div>
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
