import { allPosts } from "../../../../.content-collections/generated/index.js";
import { getAllJsonBlogPosts, getJsonBlogPostBySlug } from "../../../lib/services/json-blog-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { BlogPost } from "../../../types/blog";
import { hasTags } from "../../../types/blog";
import ScrollToTopButton from "../../../components/ScrollToTopButton";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  // Get all posts from both sources
  const jsonPosts = await getAllJsonBlogPosts();
  const markdownSlugs = new Set((allPosts as BlogPost[]).map((post: BlogPost) => post.slug));
  const uniqueJsonPosts = jsonPosts.filter((post: BlogPost) => !markdownSlugs.has(post.slug));
  
  // Combine all slugs
  const allSlugs = [
    ...(allPosts as BlogPost[]).map((post: BlogPost) => ({ slug: post.slug })),
    ...uniqueJsonPosts.map((post: BlogPost) => ({ slug: post.slug }))
  ];
  
  return allSlugs;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  
  // Check markdown posts first (they take precedence)
  let post: BlogPost | undefined = allPosts.find((post) => post.slug === slug) as BlogPost | undefined;
  
  // If not found, check JSON posts
  if (!post) {
    post = await getJsonBlogPostBySlug(slug);
  }

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  
  // Check markdown posts first (they take precedence)
  let post: BlogPost | undefined = allPosts.find((post) => post.slug === slug) as BlogPost | undefined;
  
  // If not found, check JSON posts
  if (!post) {
    post = await getJsonBlogPostBySlug(slug);
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/blog-v2"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Post Header */}
        <header className="mb-12">
          {/* Tags */}
          {hasTags(post) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time dateTime={post.date} className="font-medium">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
          </div>

          {/* Description */}
          {post.description && (
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              {post.description}
            </p>
          )}
        </header>

        {/* Divider */}
        <div className="w-24 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full mb-12"></div>

        {/* Post Content */}
        <div 
          className="prose prose-lg prose-gray dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
            prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl
            prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
            prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800 prose-pre:text-gray-100
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic
            prose-ul:list-disc prose-ol:list-decimal
            prose-img:rounded-xl prose-img:shadow-lg
            prose-hr:border-gray-300 dark:prose-hr:border-gray-700"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {/* Footer Actions */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Link
              href="/blog-v2"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to All Posts
            </Link>
            
            <div className="flex gap-4">
              <ScrollToTopButton />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

