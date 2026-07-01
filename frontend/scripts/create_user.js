/* global process */
import { createClient } from '@supabase/supabase-js';
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
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in your root .env file.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
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
      full_name: fullName,
      force_password_reset: true 
    }
  });

  if (authError) {
    console.error('Error creating user in Supabase Auth:', authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`User created with ID: ${userId}`);

  // 2. Insert into public.profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert([{ id: userId, full_name: fullName }]);

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
