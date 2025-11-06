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
          className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-code:text-blue-600 dark:prose-code:text-blue-400"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>
    </div>
  );
}

