import { getAllJsonBlogPosts } from "@/lib/services/json-blog-service";
import { allPosts } from "../../../.content-collections/generated/index.js";
import { normalizePost } from "@/types/blog";
import type { BlogPost } from "@/types/blog";
import Link from "next/link";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { CopyButton } from "./copy-button";

export const dynamic = 'force-dynamic';

interface AdminPageProps {
  searchParams: Promise<{
    tab?: string;
    search?: string;
  }>;
}

async function getBlogStats() {
  const jsonPosts = await getAllJsonBlogPosts();
  const markdownPosts = allPosts.map(post => normalizePost(post as any));
  const markdownSlugs = new Set(markdownPosts.map((post: BlogPost) => post.slug));
  const uniqueJsonPosts = jsonPosts.filter((post: BlogPost) => !markdownSlugs.has(post.slug));
  
  // Get JSON files info
  const blogsDir = join(process.cwd(), 'blogs');
  let jsonFiles: Array<{ name: string; size: number; modified: Date }> = [];
  
  try {
    if (typeof window === 'undefined') {
      const files = readdirSync(blogsDir);
      const jsonFileList = files.filter((file: string) => file.endsWith('.json'));
      
      jsonFiles = jsonFileList.map((file: string) => {
        const filePath = join(blogsDir, file);
        const stats = statSync(filePath);
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime,
        };
      });
    }
  } catch (error) {
    console.error('Error reading blogs directory:', error);
  }

  return {
    totalPosts: markdownPosts.length + uniqueJsonPosts.length,
    markdownPosts: markdownPosts.length,
    jsonPosts: uniqueJsonPosts.length,
    jsonFiles: jsonFiles.length,
    jsonFilesList: jsonFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime()),
  };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || 'dashboard';
  const searchQuery = resolvedParams.search || '';

  const stats = await getBlogStats();
  const jsonPosts = await getAllJsonBlogPosts();
  const markdownPosts = allPosts.map(post => normalizePost(post as any));
  const markdownSlugs = new Set(markdownPosts.map((post: BlogPost) => post.slug));
  const uniqueJsonPosts = jsonPosts.filter((post: BlogPost) => !markdownSlugs.has(post.slug));
  const allMergedPosts: BlogPost[] = [...markdownPosts, ...uniqueJsonPosts];
  const sortedPosts = allMergedPosts.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Filter posts by search query
  const filteredPosts = searchQuery
    ? sortedPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedPosts;

  // Get webhook URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const webhookUrl = `${baseUrl}/api/webhook/n8n`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your blog posts and n8n integration
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/admin?tab=dashboard"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin?tab=posts"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              All Posts ({stats.totalPosts})
            </Link>
            <Link
              href="/admin?tab=n8n"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'n8n'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              n8n Integration
            </Link>
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Posts
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPosts}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Markdown Posts
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.markdownPosts}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  JSON Posts (n8n)
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.jsonPosts}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  JSON Files
                </div>
                <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.jsonFiles}
                </div>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Posts
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedPosts.slice(0, 10).map((post) => (
                  <div
                    key={post.slug}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link
                          href={post.url}
                          className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {post.title}
                        </Link>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {post.author} • {new Date(post.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {post.html ? 'JSON' : 'Markdown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <form method="get" action="/admin">
                <input type="hidden" name="tab" value="posts" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search posts by title, description, or author..."
                  defaultValue={searchQuery}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </form>
            </div>

            {/* Posts List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  All Posts ({filteredPosts.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPosts.map((post) => (
                  <div
                    key={post.slug}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link
                          href={post.url}
                          className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {post.title}
                        </Link>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {post.description}
                        </p>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {post.author} • {new Date(post.date).toLocaleDateString()} • {post.slug}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {post.html ? 'JSON' : 'Markdown'}
                        </span>
                        <Link
                          href={post.url}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPosts.length === 0 && (
                  <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No posts found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* n8n Integration Tab */}
        {activeTab === 'n8n' && (
          <div className="space-y-6">
            {/* Webhook Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                n8n Webhook Configuration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white"
                    />
                    <CopyButton text={webhookUrl} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Method
                  </label>
                  <code className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                    POST
                  </code>
                </div>
              </div>
            </div>

            {/* Payload Format */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Expected Payload Format
              </h2>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-gray-800 dark:text-gray-200">
{`{
  "all_blog_posts": [
    {
      "output": {
        "title": "Blog Post Title",
        "meta_description": "SEO description",
        "blog_post": "## Markdown content here...",
        "tags": ["tag1", "tag2"],
        "outline": ["Section 1", "Section 2"]
      }
    }
  ]
}`}
                </code>
              </pre>
            </div>

            {/* JSON Files */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Received JSON Files ({stats.jsonFiles})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats.jsonFilesList.map((file) => (
                  <div
                    key={file.name}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {file.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB • {file.modified.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.jsonFilesList.length === 0 && (
                  <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No JSON files received yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

