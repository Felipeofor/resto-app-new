const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function rebuildUser() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2].trim();
    }
  });

  const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const emailsToDelete = ['felipeofor@gmail.com', 'felipeoforus@gmail.com'];
  const targetEmail = 'felipeofor@gmail.com';
  const targetPassword = 'Felipecapo24';

  console.log('--- Starting User Rebuild ---');

  for (const email of emailsToDelete) {
    console.log(`Checking for ${email}...`);
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }

    const user = users.find(u => u.email === email);
    if (user) {
      console.log(`Deleting user ${email} (${user.id})...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`Error deleting ${email}:`, deleteError);
      } else {
        console.log(`Deleted ${email} successfully.`);
      }
    } else {
      console.log(`User ${email} not found.`);
    }
  }

  console.log(`Creating user ${targetEmail}...`);
  const { data: { user: newUser }, error: createError } = await supabase.auth.admin.createUser({
    email: targetEmail,
    password: targetPassword,
    email_confirm: true
  });

  if (createError) {
    console.error('Error creating user:', createError);
    return;
  }

  console.log(`User created: ${newUser.id}. Setting super_admin role...`);
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'super_admin' })
    .eq('id', newUser.id);

  if (profileError) {
    console.error('Error updating profile role:', profileError);
    // If update failed, maybe wait a bit or try to insert?
    // Supabase usually has a trigger to create a profile, but maybe it hasn't fired yet?
    console.log('Attempting to upsert profile just in case...');
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ 
        id: newUser.id, 
        email: targetEmail, 
        role: 'super_admin' 
      });
    if (upsertError) console.error('Upsert also failed:', upsertError);
  } else {
    console.log('Profile role updated to super_admin.');
  }

  console.log('--- Process Finished ---');
}

rebuildUser();
