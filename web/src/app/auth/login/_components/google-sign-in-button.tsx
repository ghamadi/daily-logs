'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

import { createClient } from '@/lib/supabase/client';
import { useAuthVerificationUrl } from '@/hooks/use-auth-verification-url';
import { SimpleGoogleLogoIcon } from '@/components/icons/google-logo-simple-icon';

function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();
  const { verificationUrl } = useAuthVerificationUrl();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: verificationUrl,
        },
      });
    } catch (error) {
      // TODO: Show a toast error message
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      disabled={isLoading}
      className="gap-4 rounded normal-case"
      onClick={handleGoogleSignIn}
    >
      <SimpleGoogleLogoIcon className="size-4" />
      Google Sign In
    </Button>
  );
}

export { GoogleSignInButton };
