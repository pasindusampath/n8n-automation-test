/**
 * Advanced script to post generated blog posts via API
 * Supports local development, Vercel deployment, and custom URLs
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
    reviewers?: string[];
    baseBranch?: string;
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

interface PostOptions {
  apiUrl?: string;
  mode?: 'separate' | 'batch';
  batchTitle?: string;
  autoMerge?: boolean;
  labels?: string[];
  reviewers?: string[];
  baseBranch?: string;
}

function getApiUrl(): string {
  // Priority order:
  // 1. Explicit API_URL environment variable
  // 2. Vercel deployment URL
  // 3. Local development
  
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/publish-blog`;
  }
  
  // Default to local development
  return 'http://localhost:3000/api/publish-blog';
}

function parseCommandLineArgs(): PostOptions {
  const args = process.argv.slice(2);
  const options: PostOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--url':
        options.apiUrl = args[++i];
        break;
      case '--mode':
        options.mode = args[++i] as 'separate' | 'batch';
        break;
      case '--title':
        options.batchTitle = args[++i];
        break;
      case '--auto-merge':
        options.autoMerge = true;
        break;
      case '--labels':
        options.labels = args[++i].split(',');
        break;
      case '--reviewers':
        options.reviewers = args[++i].split(',');
        break;
      case '--base-branch':
        options.baseBranch = args[++i];
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function printHelp(): void {
  console.log(`
📚 Blog Posting Script Help

Usage: npm run post:blogs [options]

Options:
  --url <url>           Custom API URL (overrides environment detection)
  --mode <mode>         Publishing mode: 'separate' or 'batch' (default: batch)
  --title <title>       Custom batch title for batch mode
  --auto-merge          Enable auto-merge for PRs
  --labels <labels>     Comma-separated labels (e.g., "test,batch,generated")
  --reviewers <users>   Comma-separated GitHub usernames for review
  --base-branch <branch> Base branch for PRs (default: main)
  --help                Show this help message

Examples:
  npm run post:blogs
  npm run post:blogs -- --mode separate
  npm run post:blogs -- --url https://your-app.vercel.app/api/publish-blog
  npm run post:blogs -- --auto-merge --labels "test,batch"
  npm run post:blogs -- --mode batch --title "100 New Blog Posts" --auto-merge

Environment Variables:
  API_URL              Override API URL
  VERCEL_URL           Auto-detect Vercel deployment URL
  GITHUB_TOKEN         Required for API authentication
  GITHUB_OWNER         Required for API authentication  
  GITHUB_REPO          Required for API authentication
`);
}

async function postBlogsToApi(options: PostOptions = {}): Promise<void> {
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
    const basePayload: ApiPayload = JSON.parse(payloadData);

    // Apply command line options
    const payload: ApiPayload = {
      ...basePayload,
      mode: options.mode || basePayload.mode || 'batch',
      batchTitle: options.batchTitle || basePayload.batchTitle,
      options: {
        ...basePayload.options,
        autoMerge: options.autoMerge ?? basePayload.options?.autoMerge,
        labels: options.labels || basePayload.options?.labels,
        reviewers: options.reviewers || basePayload.options?.reviewers,
        baseBranch: options.baseBranch || basePayload.options?.baseBranch,
      }
    };

    console.log(`📊 Found ${payload.blogs.length} blog posts to publish`);
    console.log(`🔧 Mode: ${payload.mode}`);
    if (payload.batchTitle) {
      console.log(`📝 Batch Title: ${payload.batchTitle}`);
    }
    if (payload.options?.autoMerge) {
      console.log(`⚡ Auto-merge: enabled`);
    }

    // Determine API endpoint
    const apiUrl = options.apiUrl || getApiUrl();
    console.log(`🚀 Posting to API: ${apiUrl}`);

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
  const options = parseCommandLineArgs();
  
  postBlogsToApi(options)
    .then(() => {
      console.log('🎉 Blog posting completed successfully!');
    })
    .catch((error) => {
      console.error('💥 Blog posting failed:', error);
      process.exit(1);
    });
}

export { postBlogsToApi };
export type { PostOptions };
