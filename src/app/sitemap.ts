import type { MetadataRoute } from "next";

import { getAllJsonBlogPosts } from "@/lib/services/json-blog-service";
import { normalizePost } from "@/types/blog";
import { allPosts } from "../../.content-collections/generated/index.js";
import type { BlogPost } from "@/types/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const jsonPosts = await getAllJsonBlogPosts();
  const markdownPosts = allPosts.map(post => normalizePost(post as any));

  const markdownSlugs = new Set(markdownPosts.map((post: BlogPost) => post.slug));
  const uniqueJsonPosts = jsonPosts.filter((post: BlogPost) => !markdownSlugs.has(post.slug));

  const allBlogPosts: BlogPost[] = [...markdownPosts, ...uniqueJsonPosts];

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: "daily",
      priority: 1,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: "daily",
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/blog-v2`,
      changeFrequency: "daily",
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/admin`,
      changeFrequency: "weekly",
      priority: 0.5,
      lastModified: new Date(),
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = allBlogPosts.map((post) => ({
    url: `${baseUrl}${post.url}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...blogRoutes];
}


