import { defineCollection, defineConfig } from "@content-collections/core";
import { z } from "zod";
import { marked } from "marked";

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.md",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    date: z.string(),
    published: z.boolean().default(true),
  }),
  transform: async (data) => {
    const slug = data._meta.path.replace(/\.md$/, '');
    const html = await marked(data.content);
    return {
      ...data,
      slug,
      url: `/blog/${slug}`,
      html,
    };
  },
});

export default defineConfig({
  collections: [posts],
});

