# Blog Publishing System Documentation

This directory contains the complete documentation for the Automated Blog Publishing System, built with [Mintlify](https://mintlify.com).

## 📚 Documentation Structure

- **Get Started**: Introduction, quickstart, and setup guides
- **Architecture**: System overview, services, and workflow
- **Deployment**: Vercel deployment, environment variables, troubleshooting
- **API Reference**: Complete API documentation
- **Examples**: Practical code examples and integrations
- **Advanced**: Authentication, webhooks, scheduled publishing

## 🚀 View Documentation Locally

### Option 1: Mintlify CLI (Recommended)

```bash
# Install Mintlify CLI
npm i -g mintlify

# Navigate to docs directory
cd docs

# Start local documentation server
mintlify dev
```

The documentation will be available at `http://localhost:3000`

### Option 2: Deploy to Mintlify

1. Go to [mintlify.com](https://mintlify.com)
2. Sign in with GitHub
3. Connect your repository
4. Select the `docs` directory
5. Deploy!

Your documentation will be live at `https://your-project.mintlify.app`

## 📝 Documentation Files

```
docs/
├── mint.json                           # Mintlify configuration
├── introduction.mdx                    # Welcome page
├── quickstart.mdx                      # Quick start guide
├── setup.mdx                           # Detailed setup
├── architecture/
│   ├── overview.mdx                   # Architecture overview
│   ├── services.mdx                   # Service components
│   └── workflow.mdx                   # Complete workflow
├── deployment/
│   ├── vercel.mdx                     # Vercel deployment
│   ├── environment-variables.mdx       # Environment config
│   └── troubleshooting.mdx            # Common issues
├── api-reference/
│   ├── introduction.mdx               # API intro
│   ├── publish-blog.mdx               # POST endpoint
│   └── check-status.mdx               # GET endpoint
├── examples/
│   ├── single-blog.mdx                # Single blog example
│   ├── multiple-blogs.mdx             # Multiple blogs
│   ├── batch-publishing.mdx           # Batch mode
│   └── integration.mdx                # CMS integrations
└── advanced/
    ├── authentication.mdx             # API auth
    ├── webhooks.mdx                   # Webhook setup
    └── scheduled-publishing.mdx       # Scheduled posts
```

## 🛠️ Customization

### Branding

Edit `mint.json`:

```json
{
  "name": "Your Project Name",
  "logo": {
    "dark": "/logo/dark.svg",
    "light": "/logo/light.svg"
  },
  "colors": {
    "primary": "#your-color",
    "light": "#your-light-color",
    "dark": "#your-dark-color"
  }
}
```

### Navigation

Add or remove pages in the `navigation` array in `mint.json`.

### Custom Domain

Once deployed to Mintlify, you can configure a custom domain (e.g., `docs.yourdomain.com`) in the Mintlify dashboard.

## 📖 Writing Documentation

Mintlify uses MDX (Markdown + React components). Special components available:

- `<Card>` - Display cards
- `<CardGroup>` - Group cards
- `<Accordion>` - Collapsible content
- `<AccordionGroup>` - Group accordions
- `<Tabs>` - Tabbed content
- `<Steps>` - Step-by-step guides
- `<CodeGroup>` - Multiple code examples
- `<Note>` - Informational notes
- `<Warning>` - Warning messages
- `<Check>` - Success messages
- `<ParamField>` - API parameters

Example:

```mdx
<CardGroup cols={2}>
  <Card title="Feature 1" icon="star">
    Description here
  </Card>
  <Card title="Feature 2" icon="rocket">
    Another description
  </Card>
</CardGroup>
```

## 🔗 Resources

- [Mintlify Documentation](https://mintlify.com/docs)
- [MDX Documentation](https://mdxjs.com/)
- [Blog Publishing System](https://github.com/yourusername/my-app)

## 🚀 Next Steps

1. **Install Mintlify CLI**: `npm i -g mintlify`
2. **Preview locally**: `mintlify dev` (in this directory)
3. **Deploy**: Connect to Mintlify or self-host
4. **Customize**: Update branding in `mint.json`
5. **Extend**: Add more documentation pages as needed

---

Built with ❤️ using [Mintlify](https://mintlify.com)

