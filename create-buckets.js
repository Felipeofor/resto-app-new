const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']?.trim().replace(/^['"](.*)['"]$/, '$1');
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY']?.trim().replace(/^['"](.*)['"]$/, '$1');

console.log('Using URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  console.log('Checking storage setup...');
  
  const bucketsToCreate = ['restaurant-images', 'menu-images', 'receipts'];
  
  for (const bucketName of bucketsToCreate) {
    // Try to get bucket first
    const { data: bucket, error: getError } = await supabase.storage.getBucket(bucketName);
    
    if (getError) {
      console.log(`Bucket ${bucketName} not found, creating...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf'],
      });
      
      if (createError) {
        console.error(`Error creating ${bucketName}:`, createError);
      } else {
        console.log(`Bucket ${bucketName} created.`);
      }
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
    }

    // Set public policy (via SQL usually, but let's try update)
    await supabase.storage.updateBucket(bucketName, { public: true });
  }

  console.log('Testing upload permissions...');
  // Note: RLS might still block if not set in Supabase Dashboard
  console.log('IMPORTANT: Please check Supabase Dashboard -> Storage -> Policies');
  console.log('Ensure "Allow bucket access" and "Allow public upload/read" policies are active.');
}

setupStorage();
