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

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']?.trim();
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY']?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBuckets() {
  console.log('Creating buckets...');
  
  const bucketsToCreate = ['restaurant-images', 'receipts'];
  
  for (const bucketName of bucketsToCreate) {
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    
    if (error && error.message !== 'The resource already exists') {
      console.error(`Error creating ${bucketName}:`, error);
    } else {
      console.log(`Bucket ${bucketName} setup successful.`);
    }
  }
}

createBuckets();
