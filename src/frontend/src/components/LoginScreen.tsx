import { DollarSign, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

export function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Napaka pri prijavi:', error);
      toast.error('Prijava ni uspela. Prosimo, poskusite znova.');
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3 sm:space-y-4">
          <div className="mx-auto mb-2 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary">
            <DollarSign className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">PayTrack</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Sledenje delovnim uram in plačilom
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              Dobrodošli v PayTrack - vaši osebni aplikaciji za sledenje delovnim uram in plačilom.
            </p>
            <p>
              Prijavite se za dostop do svojih podatkov.
            </p>
          </div>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full gap-2"
            size="lg"
          >
            {isLoggingIn ? (
              <>Prijavljanje...</>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Prijava
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Vaši podatki so varno shranjeni in dostopni samo vam
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
