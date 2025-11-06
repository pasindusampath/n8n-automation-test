import { allPosts } from "../../../.content-collections/generated";
import { getAllJsonBlogPosts } from "../../lib/services/json-blog-service";
import Link from "next/link";

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  // Get JSON blog posts
  const jsonPosts = await getAllJsonBlogPosts();
  
  // Create a map of markdown post slugs to avoid duplicates
  const markdownSlugs = new Set(allPosts.map(post => post.slug));
  
  // Filter out JSON posts that have conflicting slugs with markdown posts
  // (markdown posts take precedence)
  const uniqueJsonPosts = jsonPosts.filter(post => !markdownSlugs.has(post.slug));
  
  // Merge both sources and sort by date (newest first)
  const allMergedPosts = [...allPosts, ...uniqueJsonPosts];
  const sortedPosts = allMergedPosts.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Pagination logic
  const postsPerPage = 20;
  const resolvedSearchParams = await searchParams;
  const currentPage = parseInt(resolvedSearchParams.page || '1', 10);
  const totalPosts = sortedPosts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  
  // Calculate which posts to show on current page
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = sortedPosts.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Blog</h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {totalPosts} {totalPosts === 1 ? 'post' : 'posts'} total
          </div>
        </div>
        
        <div className="space-y-8">
          {currentPosts.map((post) => (
            <article 
              key={post.slug} 
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <Link href={post.url}>
                <h2 className="text-2xl font-semibold mb-2 hover:text-blue-600 dark:hover:text-blue-400">
                  {post.title}
                </h2>
              </Link>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <span>{post.author}</span>
                <span className="mx-2">•</span>
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {post.description}
              </p>
              
              <Link 
                href={post.url}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>

        {currentPosts.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400">No blog posts yet.</p>
        )}

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <nav className="mt-12 flex justify-center">
            <div className="flex items-center space-x-2">
              {/* Previous button */}
              {currentPage > 1 ? (
                <Link
                  href={`/blog?page=${currentPage - 1}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Previous
                </Link>
              ) : (
                <span className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500">
                  Previous
                </span>
              )}

              {/* Page numbers */}
              {getPageNumbers().map((pageNum) => (
                <Link
                  key={pageNum}
                  href={`/blog?page=${pageNum}`}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    pageNum === currentPage
                      ? 'text-white bg-blue-600 border border-blue-600'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </Link>
              ))}

              {/* Next button */}
              {currentPage < totalPages ? (
                <Link
                  href={`/blog?page=${currentPage + 1}`}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Next
                </Link>
              ) : (
                <span className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500">
                  Next
                </span>
              )}
            </div>
          </nav>
        )}

        {/* Page info */}
        {totalPages > 1 && (
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </main>
    </div>
  );
}

