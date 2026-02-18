'use client';

import { useState } from 'react';
import { Button } from '@web/components/ui/button';

import { createClient } from '@web/lib/supabase/client';
import { useAuthVerificationUrl } from '@web/hooks/use-auth-verification-url';
import { SimpleGoogleLogoIcon } from '@web/components/icons/google-logo-simple-icon';

function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();
  const { verificationUrl } = useAuthVerificationUrl();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: verificationUrl,
      },
    });
  };

  return (
    <Button
      variant="default"
      type="button"
      disabled={isLoading}
      className="gap-4 normal-case"
      onClick={handleGoogleSignIn}
    >
      <SimpleGoogleLogoIcon className="size-4" />
      Google Sign In
    </Button>
  );
}

export { GoogleSignInButton };
