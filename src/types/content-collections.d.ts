// Type declarations for Content Collections generated files
// This file helps TypeScript understand the module until .content-collections/generated.ts is created
// The file will be auto-generated when you run `npm run dev` or `npm run build`

declare module "*/.content-collections/generated" {
  export interface Post {
    title: string;
    description: string;
    author: string;
    date: string;
    published: boolean;
    slug: string;
    url: string;
    html: string;
  }
  
  export const allPosts: Post[];
}

