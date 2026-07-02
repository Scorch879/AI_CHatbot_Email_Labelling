/* global process */
import { createClient } from '@supabase/supabase-js';
import { randomInt } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from the root .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
// MUST use the Service Role Key to bypass RLS and use Admin API
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your root .env file.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function generatePassword() {
  const groups = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    '!@#$%^&*'
  ];
  const chars = groups.join('');
  const passwordChars = groups.map(group => group.charAt(randomInt(group.length)));

  while (passwordChars.length < 16) {
    passwordChars.push(chars.charAt(randomInt(chars.length)));
  }

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const swapIndex = randomInt(i + 1);
    [passwordChars[i], passwordChars[swapIndex]] = [passwordChars[swapIndex], passwordChars[i]];
  }

  return passwordChars.join('');
}

async function createUser(email, fullName) {
  const password = generatePassword();
  
  console.log(`Creating user ${email}...`);
  
  // 1. Create the user using the official Admin API (guarantees a perfect auth.users record)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto-confirm the email so they can log in immediately
    user_metadata: { 
      full_name: fullName
    },
    app_metadata: {
      role: 'hr',
      must_reset_password: true
    }
  });

  if (authError) {
    console.error('Error creating user in Supabase Auth:', authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`User created with ID: ${userId}`);

  // 2. Upsert into public.profiles so reruns and auth triggers cannot collide.
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      [{
        id: userId,
        full_name: fullName,
        role: 'hr',
        must_reset_password: true
      }],
      { onConflict: 'id' }
    );

  if (profileError) {
    console.error('Error creating user profile:', profileError.message);
    process.exit(1);
  }

  console.log('\n✅ User successfully created!');
  console.log('----------------------------------------');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('----------------------------------------');
  console.log('Provide these credentials to the employee.');
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node create_user.js <email> [full_name]');
  process.exit(1);
}

const [email, fullName = ''] = args;
createUser(email, fullName);
