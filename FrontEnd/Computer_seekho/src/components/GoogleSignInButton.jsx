import { useEffect, useRef } from 'react';

// TODO: replace with your real Google OAuth Client ID from
// console.cloud.google.com (the one that ends in .apps.googleusercontent.com)
const GOOGLE_CLIENT_ID = '517612547927-qbnghc2j2k9mu4m0v863h51djao95t87.apps.googleusercontent.com';

let gsiScriptPromise = null;

// Loads Google's Identity Services script exactly once, no matter how
// many times this component mounts (Login page remount, HMR, etc.).
function loadGoogleScript() {
  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In script.'));
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
}

/**
 * Renders the official "Sign in with Google" button.
 * Calls onSuccess(idToken) with the raw Google ID token once the user
 * picks an account - the parent decides what to do with it (send it to
 * the backend, show an error, etc.).
 */
export default function GoogleSignInButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            // response.credential is the signed Google ID token (JWT).
            // We never read it ourselves - it goes straight to the
            // backend, which is the only place it gets verified.
            if (response?.credential) {
              onSuccess(response.credential);
            } else {
              onError?.(new Error('Google did not return a credential.'));
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
        });
      })
      .catch((err) => onError?.(err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={buttonRef} />;
}