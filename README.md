# Blog Publishing System

An automated, serverless blog publishing system for Next.js with Content Collections. Publish blog posts by sending JSON to an API endpoint - the system handles everything from markdown conversion to GitHub PR creation.

## ✨ Features

- **🚀 Serverless-First**: Works perfectly on Vercel, Netlify, and other platforms
- **📝 JSON to Markdown**: Automatic conversion with YAML frontmatter
- **🔄 GitHub Integration**: Creates branches, commits, and PRs via API
- **👥 Review Workflow**: Built-in PR review process with labels and reviewers
- **⚡ Fast Publishing**: Publish in seconds with a single API call
- **📦 Batch Support**: Publish multiple blogs at once
- **🎯 Type-Safe**: Full TypeScript support

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:

```bash
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=my-app
```

[Get a GitHub token](https://github.com/settings/tokens) with `repo` scope.

### 3. Run Development Server

```bash
npm run dev
```

### 4. Publish Your First Blog

```bash
curl -X POST http://localhost:3000/api/publish-blog \
  -H "Content-Type: application/json" \
  -d '{
    "blogs": [{
      "title": "My First Post",
      "description": "An amazing blog post",
      "author": "Your Name",
      "date": "2025-10-17",
      "content": "# Hello World\n\nThis is my first post!"
    }]
  }'
```

Check your GitHub repository for a new Pull Request! 🎉

## 📖 Documentation

Comprehensive documentation is available in the `docs` folder, built with Mintlify.

**[View Full Documentation →](./docs/)**

### Quick Links

- [Introduction](./docs/introduction.mdx)
- [Quickstart Guide](./docs/quickstart.mdx)
- [API Reference](./docs/api-reference/publish-blog.mdx)
- [Examples](./docs/examples/single-blog.mdx)
- [Deployment Guide](./docs/deployment/vercel.mdx)

### Preview Documentation Locally

```bash
npm i -g mintlify
cd docs
mintlify dev
```

## 🏗️ Architecture

```
┌─────────────┐
│ JSON Input  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  API Endpoint       │
│  /api/publish-blog  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Serverless         │
│  Blog Publisher     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  GitHub API         │
│  (Branch, PR, File) │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Pull Request       │
│  Created ✓          │
└─────────────────────┘
```

## 📂 Project Structure

```
my-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── publish-blog/
│   │   │       └── route.ts          # API endpoint
│   │   └── blog/                      # Blog pages
│   └── lib/
│       └── services/
│           ├── blog-converter.ts      # JSON → Markdown
│           ├── github-file-service.ts # GitHub file ops
│           ├── github-service.ts      # PR management
│           └── serverless-blog-publisher.ts # Main orchestrator
├── content/
│   └── posts/                         # Blog markdown files
├── blogs/                             # n8n automation blog storage
├── docs/                              # Mintlify documentation
├── examples/                          # Code examples
└── content-collections.ts             # Content config
```

## 🔧 API Usage

### Publish Single Blog

```typescript
const response = await fetch('https://your-app.vercel.app/api/publish-blog', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    blogs: [{
      title: "My Blog Post",
      description: "A great post",
      author: "John Doe",
      date: "2025-10-17",
      content: "# My Blog Post\n\nContent here..."
    }],
    options: {
      labels: ['blog', 'automated'],
      reviewers: ['editor']
    }
  })
});

const result = await response.json();
console.log(result.results[0].prUrl); // PR URL
```

### Batch Publishing

```typescript
const response = await fetch('https://your-app.vercel.app/api/publish-blog', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'batch',
    batchTitle: 'Weekly Posts',
    blogs: [/* multiple blog objects */]
  })
});
```

## 🚀 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/my-app)

Or manually:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `GITHUB_TOKEN`
   - `GITHUB_OWNER`
   - `GITHUB_REPO`
4. Deploy!

## 🎯 Use Cases

- **CMS Integration**: Connect WordPress, Contentful, Strapi, etc.
- **Automated Publishing**: Schedule posts or trigger from events
- **Multi-Author Blogs**: Team content with PR-based review
- **Editorial Workflow**: Use GitHub's review system for content approval
- **n8n Automation**: Testing automation via n8n to automate blog posting with SEO (see [n8n-automation-test](https://github.com/pasindusampath/n8n-automation-test))

## 🧩 Integration Examples

### WordPress

```php
add_action('publish_post', function($post_id) {
    $post = get_post($post_id);
    wp_remote_post('https://your-app.vercel.app/api/publish-blog', [
        'body' => json_encode([
            'blogs' => [[
                'title' => $post->post_title,
                'content' => $post->post_content,
                // ...
            ]]
        ])
    ]);
});
```

### Contentful Webhook

```typescript
export async function POST(request: Request) {
  const webhook = await request.json();
  // Transform and publish
  await fetch('/api/publish-blog', {
    method: 'POST',
    body: JSON.stringify({ blogs: [transformedBlog] })
  });
}
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📚 Technologies

- **Next.js 15** - React framework
- **Content Collections** - Type-safe content management
- **Octokit** - GitHub API client
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **Marked** - Markdown parser

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🆘 Support

- 📖 [Full Documentation](./docs/)
- 🐛 [Report Issues](https://github.com/yourusername/my-app/issues)
- 💬 [Discussions](https://github.com/yourusername/my-app/discussions)

## ⭐ Show Your Support

If you find this project helpful, please give it a star on GitHub!

---

Made with ❤️ for the Next.js community
