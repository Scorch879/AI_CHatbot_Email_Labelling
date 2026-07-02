import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigError } from '../supabaseClient';
import { AuthContext } from './authContext';

const AUTH_TIMEOUT_MS = 10000;

const signedOutState = {
  loading: false,
  session: null,
  user: null,
  profile: null,
  needsReset: false,
  error: null,
  sessionExpired: false,
  sessionExpiredMessage: null,
};

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

function withTimeout(promise, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out. Check your connection and Supabase configuration.`));
    }, AUTH_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

async function fetchProfile(userId) {
  const { data, error } = await withTimeout(
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, must_reset_password')
      .eq('id', userId)
      .maybeSingle(),
    'Profile lookup',
  );

  if (error) {
    return { profile: null, profileError: error };
  }

  return { profile: data, profileError: null };
}

async function readAuthState() {
  if (!supabase || supabaseConfigError) {
    return {
      ...signedOutState,
      error: supabaseConfigError || 'Supabase is not configured.',
    };
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await withTimeout(supabase.auth.getSession(), 'Session validation');

    if (sessionError) throw sessionError;
    if (!session) return signedOutState;

    const {
      data: { user },
      error: userError,
    } = await withTimeout(supabase.auth.getUser(), 'User validation');

    if (userError) throw userError;
    if (!user) return signedOutState;

    const { profile, profileError } = await fetchProfile(user.id);
    const metadataRequiresReset =
      user.app_metadata?.must_reset_password === true ||
      user.user_metadata?.force_password_reset === true;

    return {
      loading: false,
      session,
      user,
      profile,
      needsReset:
        typeof profile?.must_reset_password === 'boolean'
          ? profile.must_reset_password
          : metadataRequiresReset,
      error: profileError
        ? `Profile check failed: ${profileError.message}. Falling back to session metadata.`
        : null,
    };
  } catch (error) {
    return {
      ...signedOutState,
      error: error.message || 'Unable to validate your session.',
    };
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({ ...signedOutState, loading: true });

  const refreshAuth = useCallback(async () => {
    setAuthState((current) => ({ ...current, loading: true }));
    const nextState = await readAuthState();
    setAuthState((current) => {
      if (!nextState.session && current.sessionExpired) {
        return {
          ...nextState,
          sessionExpired: current.sessionExpired,
          sessionExpiredMessage: current.sessionExpiredMessage,
        };
      }
      return nextState;
    });
    return nextState;
  }, []);

  const signOut = useCallback(async (options = {}) => {
    const { expired = false, message = null } = options;
    setAuthState({
      ...signedOutState,
      sessionExpired: expired,
      sessionExpiredMessage: message,
    });
    try {
      localStorage.removeItem('lifemail_last_activity');
    } catch (e) {}
    if (supabase) {
      await supabase.auth.signOut();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initialAuthTimer = window.setTimeout(() => {
      if (isMounted) refreshAuth();
    }, 0);

    if (!supabase) {
      return () => {
        isMounted = false;
        window.clearTimeout(initialAuthTimer);
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setAuthState((current) => ({
          ...signedOutState,
          sessionExpired: current.sessionExpired || false,
          sessionExpiredMessage: current.sessionExpiredMessage || null,
        }));
        return;
      }

      window.setTimeout(() => {
        if (isMounted) refreshAuth();
      }, 0);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(initialAuthTimer);
      subscription?.unsubscribe();
    };
  }, [refreshAuth]);

  useEffect(() => {
    if (!authState.session) return undefined;

    let lastActivity = Date.now();
    let intervalId;

    const updateActivity = () => {
      lastActivity = Date.now();
      try {
        localStorage.setItem('lifemail_last_activity', lastActivity.toString());
      } catch (e) {}
    };

    const checkInactivity = () => {
      let storedLast = lastActivity;
      try {
        const item = localStorage.getItem('lifemail_last_activity');
        if (item) {
          const parsed = parseInt(item, 10);
          if (!isNaN(parsed) && parsed > storedLast) {
            storedLast = parsed;
            lastActivity = parsed;
          }
        }
      } catch (e) {}

      if (Date.now() - storedLast > INACTIVITY_TIMEOUT_MS) {
        window.clearInterval(intervalId);
        signOut({
          expired: true,
          message: 'Your session has expired due to 30 minutes of inactivity. Please log in again for your security.',
        });
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const throttledUpdate = () => {
      if (Date.now() - lastActivity > 1000) {
        updateActivity();
      }
    };

    events.forEach((event) => window.addEventListener(event, throttledUpdate, { passive: true }));
    intervalId = window.setInterval(checkInactivity, 10000);

    updateActivity();

    return () => {
      events.forEach((event) => window.removeEventListener(event, throttledUpdate));
      window.clearInterval(intervalId);
    };
  }, [authState.session, signOut]);

  const value = useMemo(
    () => ({
      ...authState,
      refreshAuth,
      signOut,
      isConfigured: Boolean(supabase && !supabaseConfigError),
    }),
    [authState, refreshAuth, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
