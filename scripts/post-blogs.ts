/**
 * Script to post generated blog posts via API
 * Reads the generated 100-blogs-api-payload.json and posts it to the API
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

async function postBlogsToApi(): Promise<void> {
  const payloadPath = path.join(process.cwd(), 'examples', '100-blogs-api-payload.json');
  
  // Check if payload file exists
  if (!fs.existsSync(payloadPath)) {
    console.error('❌ Payload file not found:', payloadPath);
    console.log('💡 Run "npm run generate:blogs" first to create the payload file');
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

    // Make the API request
    console.log('📤 Sending request to API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result: ApiResponse = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Successfully posted blogs!');
      console.log('📋 Summary:', result.summary);
      
      if (result.result) {
        console.log('🔗 Pull Request:', result.result.pullRequestUrl);
        console.log('📝 PR Title:', result.result.title);
      }
      
      if (result.results) {
        const succeeded = result.results.filter(r => r.success).length;
        const failed = result.results.filter(r => !r.success).length;
        console.log(`✅ Succeeded: ${succeeded}`);
        console.log(`❌ Failed: ${failed}`);
      }
    } else {
      console.error('❌ Failed to post blogs');
      console.error('Error:', result.error || 'Unknown error');
      console.error('Response status:', response.status);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error posting blogs:', error);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  postBlogsToApi()
    .then(() => {
      console.log('🎉 Blog posting completed successfully!');
    })
    .catch((error) => {
      console.error('💥 Blog posting failed:', error);
      process.exit(1);
    });
}

export { postBlogsToApi };
