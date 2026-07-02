import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from root .env or local environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

describe('Account Login Unit Tests (francis@lifewoodph.com)', () => {
  let supabase;
  const TEST_EMAIL = 'francis@lifewoodph.com';
  const TEST_PASSWORD = 'Tester12345678';

  beforeAll(() => {
    expect(supabaseUrl, 'Supabase URL should be defined in environment').toBeDefined();
    expect(supabaseAnonKey, 'Supabase Anon Key should be defined in environment').toBeDefined();

    // Initialize Supabase Client for testing
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });

  afterAll(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  });

  it('1. Should successfully authenticate with valid credentials for francis@lifewoodph.com', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(error, `Login failed with unexpected error: ${error?.message}`).toBeNull();
    expect(data, 'Auth response data should be returned').toBeDefined();
    expect(data.user, 'User object should exist in auth response').toBeDefined();
    expect(data.user.email).toBe(TEST_EMAIL);
    expect(data.session, 'Session object should be returned on successful login').toBeDefined();
    expect(data.session.access_token).toBeTypeOf('string');
    expect(data.session.refresh_token).toBeTypeOf('string');
  });

  it('2. Should retrieve active session and validate user profile metadata', async () => {
    // Ensure user is logged in
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(loginError).toBeNull();
    const userId = authData.user.id;

    // Validate getSession()
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    expect(sessionError).toBeNull();
    expect(sessionData.session).toBeDefined();
    expect(sessionData.session.user.id).toBe(userId);

    // Validate database profile lookup
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, must_reset_password')
      .eq('id', userId)
      .single();

    expect(profileError, `Failed to query user profile: ${profileError?.message}`).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.id).toBe(userId);
    expect(profile.role).toBeTypeOf('string');
  });

  it('3. Should reject login attempt with an incorrect password', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: 'WrongPassword9999!',
    });

    expect(error, 'An error should be returned for incorrect password').toBeDefined();
    expect(error).not.toBeNull();
    expect(error.message).toMatch(/Invalid login credentials/i);
    expect(data.user).toBeNull();
    expect(data.session).toBeNull();
  });

  it('4. Should reject login attempt with a non-existent email address', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent_account_99999@lifewoodph.com',
      password: TEST_PASSWORD,
    });

    expect(error, 'An error should be returned for non-existent email').toBeDefined();
    expect(error).not.toBeNull();
    expect(error.message).toMatch(/Invalid login credentials/i);
    expect(data.user).toBeNull();
    expect(data.session).toBeNull();
  });

  it('5. Should reject login attempt when password is empty', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: '',
    });

    expect(error, 'An error should be returned when password is missing').not.toBeNull();
    expect(data.user).toBeNull();
    expect(data.session).toBeNull();
  });

  it('6. Should successfully sign out and terminate the user session', async () => {
    // Login first
    await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    // Execute sign out
    const { error: signOutError } = await supabase.auth.signOut();
    expect(signOutError, `Sign out failed: ${signOutError?.message}`).toBeNull();

    // Verify session is terminated
    const { data: { session } } = await supabase.auth.getSession();
    expect(session).toBeNull();
  });
});
