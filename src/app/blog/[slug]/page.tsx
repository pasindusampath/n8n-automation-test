import { allPosts } from "../../../../.content-collections/generated/index.js";
import { getAllJsonBlogPosts, getJsonBlogPostBySlug } from "../../../lib/services/json-blog-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { BlogPost } from "../../../types/blog";
import { normalizePost } from "../../../types/blog";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  // Get all posts from both sources
  const jsonPosts = await getAllJsonBlogPosts();
  const markdownSlugs = new Set(allPosts.map(post => post.slug));
  const uniqueJsonPosts = jsonPosts.filter(post => !markdownSlugs.has(post.slug));
  
  // Combine all slugs
  const allSlugs = [
    ...allPosts.map(post => ({ slug: post.slug })),
    ...uniqueJsonPosts.map(post => ({ slug: post.slug }))
  ];
  
  return allSlugs;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  
  // Check markdown posts first (they take precedence)
  let post: BlogPost | undefined = undefined;
  const markdownPost = allPosts.find((post) => post.slug === slug);
  
  if (markdownPost) {
    post = normalizePost(markdownPost as any);
  } else {
    // If not found, check JSON posts
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
  let post: BlogPost | undefined = undefined;
  const markdownPost = allPosts.find((post) => post.slug === slug);
  
  if (markdownPost) {
    post = normalizePost(markdownPost as any);
  } else {
    // If not found, check JSON posts
    post = await getJsonBlogPostBySlug(slug);
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <article className="max-w-3xl mx-auto">
        <Link 
          href="/blog"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-8 inline-block"
        >
          ← Back to Blog
        </Link>
        
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="text-gray-600 dark:text-gray-400">
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
        </header>

        <div 
          className="prose prose-lg prose-gray dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
            prose-h1:text-4xl prose-h1:mt-8 prose-h1:mb-4 prose-h1:leading-tight
            prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:leading-tight
            prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:leading-snug
            prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3
            prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
            prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
            prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
            prose-pre:bg-gray-900 dark:prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:shadow-lg
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-900/50 prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
            prose-ul:list-disc prose-ul:pl-6 prose-ul:my-6
            prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-6
            prose-li:my-2 prose-li:text-gray-700 dark:prose-li:text-gray-300
            prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
            prose-hr:border-gray-300 dark:prose-hr:border-gray-700 prose-hr:my-8
            prose-table:w-full prose-table:my-6 prose-table:border-collapse
            prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-700 prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
            prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700 prose-td:px-4 prose-td:py-2"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>
    </div>
  );
}

