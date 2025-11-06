/**
 * Script to post 10 generated blog posts via API
 * Reads the generated 10-blogs-api-payload.json and posts it to the API
 */

import fs from 'fs';
import path from 'path';

interface BlogPost {
  title: string;
  description: string;
  author: string;
  date: string;
  published: boolean;
  content: string;
}

interface ApiPayload {
  blogs: BlogPost[];
  mode?: 'separate' | 'batch';
  batchTitle?: string;
  options?: {
    labels?: string[];
    autoMerge?: boolean;
  };
}

interface ApiResponse {
  success: boolean;
  result?: any;
  results?: any[];
  summary?: {
    total: number;
    mode: string;
    succeeded?: number;
    failed?: number;
  };
  error?: string;
}

async function post10BlogsToApi(): Promise<void> {
  const payloadPath = path.join(process.cwd(), 'examples', '10-blogs-api-payload.json');
  
  // Check if payload file exists
  if (!fs.existsSync(payloadPath)) {
    console.error('❌ Payload file not found:', payloadPath);
    console.log('💡 Run "npm run generate:blogs:10" first to create the payload file');
    process.exit(1);
  }

  try {
    // Read the payload file
    console.log('📖 Reading payload file...');
    const payloadData = fs.readFileSync(payloadPath, 'utf8');
    const payload: ApiPayload = JSON.parse(payloadData);

    console.log(`📊 Found ${payload.blogs.length} blog posts to publish`);

    // Determine API endpoint
    const apiUrl = process.env.API_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/publish-blog`
      : 'http://localhost:3000/api/publish-blog';
    console.log(`🚀 Posting to API: ${apiUrl}`);

    // Ensure batch mode is set
    if (!payload.mode) {
      payload.mode = 'batch';
      console.log('🔧 Setting mode to batch (all blogs in one PR)');
    }

    console.log(`🔧 Mode: ${payload.mode}`);
    if (payload.batchTitle) {
      console.log(`📝 Batch Title: ${payload.batchTitle}`);
    }
    if (payload.options?.autoMerge) {
      console.log(`⚡ Auto-merge: enabled`);
    }

    // Make the API request
    console.log('📤 Sending request to API...');
    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const result: ApiResponse = await response.json();

    if (response.ok && result.success) {
      console.log(`✅ Successfully posted blogs! (${duration}s)`);
      console.log('📋 Summary:', result.summary);
      
      if (result.result) {
        console.log('🔗 Pull Request:', result.result.pullRequestUrl);
        console.log('📝 PR Title:', result.result.title);
        if (result.result.branchName) {
          console.log('🌿 Branch:', result.result.branchName);
        }
      }
      
      if (result.results) {
        const succeeded = result.results.filter(r => r.success).length;
        const failed = result.results.filter(r => !r.success).length;
        console.log(`✅ Succeeded: ${succeeded}`);
        console.log(`❌ Failed: ${failed}`);
        
        // Show failed results
        const failedResults = result.results.filter(r => !r.success);
        if (failedResults.length > 0) {
          console.log('\n❌ Failed posts:');
          failedResults.forEach((failed, index) => {
            console.log(`  ${index + 1}. ${failed.error || 'Unknown error'}`);
          });
        }
      }
    } else {
      console.error('❌ Failed to post blogs');
      console.error('Error:', result.error || 'Unknown error');
      console.error('Response status:', response.status);
      console.error('Response body:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error posting blogs:', error);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  post10BlogsToApi()
    .then(() => {
      console.log('🎉 Blog posting completed successfully!');
    })
    .catch((error) => {
      console.error('💥 Blog posting failed:', error);
      process.exit(1);
    });
}

export { post10BlogsToApi };
