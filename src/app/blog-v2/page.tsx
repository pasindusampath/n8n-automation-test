import { allPosts } from "../../../.content-collections/generated/index.js";
import { getAllJsonBlogPosts } from "../../lib/services/json-blog-service";
import Link from "next/link";
import type { BlogPost } from "../../types/blog";
import { hasTags } from "../../types/blog";

interface BlogV2PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function BlogV2Page({ searchParams }: BlogV2PageProps) {
  // Get JSON blog posts
  const jsonPosts = await getAllJsonBlogPosts();
  
  // Create a map of markdown post slugs to avoid duplicates
  const markdownSlugs = new Set(allPosts.map((post: BlogPost) => post.slug));
  
  // Filter out JSON posts that have conflicting slugs with markdown posts
  const uniqueJsonPosts = jsonPosts.filter((post: BlogPost) => !markdownSlugs.has(post.slug));
  
  // Merge both sources and sort by date (newest first)
  const allMergedPosts: BlogPost[] = [...(allPosts as BlogPost[]), ...uniqueJsonPosts];
  
  // Apply search filter if provided
  const resolvedSearchParams = await searchParams;
  const searchQuery = resolvedSearchParams.search?.toLowerCase() || '';
  const filteredPosts = searchQuery
    ? allMergedPosts.filter((post: BlogPost) => 
        post.title.toLowerCase().includes(searchQuery) ||
        post.description.toLowerCase().includes(searchQuery) ||
        (hasTags(post) && post.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery)))
      )
    : allMergedPosts;
  
  const sortedPosts = filteredPosts.sort((a: BlogPost, b: BlogPost) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Pagination logic
  const postsPerPage = 12;
  const currentPage = parseInt(resolvedSearchParams.page || '1', 10);
  const totalPosts = sortedPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  
  // Calculate which posts to show on current page
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = sortedPosts.slice(startIndex, endIndex);

  // Get unique tags from all posts
  const allTags = new Set<string>();
  allMergedPosts.forEach((post: BlogPost) => {
    if (hasTags(post)) {
      post.tags.forEach((tag: string) => allTags.add(tag));
    }
  });
  const uniqueTags = Array.from(allTags).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Blog
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {totalPosts} {totalPosts === 1 ? 'post' : 'posts'} available
              </p>
            </div>
            
            {/* Search Bar */}
            <form method="get" className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                name="search"
                placeholder="Search posts..."
                defaultValue={searchQuery}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Search
              </button>
              {searchQuery && (
                <Link
                  href="/blog-v2"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tags Filter */}
        {uniqueTags.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filter by tags:</h2>
            <div className="flex flex-wrap gap-2">
              {uniqueTags.slice(0, 10).map((tag) => (
                <Link
                  key={tag}
                  href={`/blog-v2?search=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {currentPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {currentPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog-v2/${post.slug}`}
                className="group block bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 overflow-hidden"
              >
                {/* Card Content */}
                <div className="p-6">
                  {/* Date and Tags */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-full">
                      {new Date(post.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    {hasTags(post) && (
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                        {post.tags[0]}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm leading-relaxed">
                    {post.description}
                  </p>

                  {/* Author and Read More */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      {post.author}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-block">
                      Read more →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery 
                ? `No posts match your search for "${searchQuery}"`
                : 'No blog posts available yet.'}
            </p>
            {searchQuery && (
              <Link
                href="/blog-v2"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                View All Posts
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex justify-center items-center gap-2 mt-12">
            {/* Previous button */}
            {currentPage > 1 ? (
              <Link
                href={`/blog-v2?page=${currentPage - 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                ← Previous
              </Link>
            ) : (
              <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 rounded-lg cursor-not-allowed font-medium">
                ← Previous
              </span>
            )}

            {/* Page numbers */}
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Link
                    key={pageNum}
                    href={`/blog-v2?page=${pageNum}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pageNum === currentPage
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
            </div>

            {/* Next button */}
            {currentPage < totalPages ? (
              <Link
                href={`/blog-v2?page=${currentPage + 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Next →
              </Link>
            ) : (
              <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 rounded-lg cursor-not-allowed font-medium">
                Next →
              </span>
            )}
          </nav>
        )}

        {/* Page info */}
        {totalPages > 1 && (
          <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, totalPosts)} of {totalPosts} posts
          </div>
        )}
      </main>
    </div>
  );
}

