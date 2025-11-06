/**
 * Generate 100 blog posts with 2000 words each using Faker
 * This script creates realistic blog content for testing large payloads
 */

import { faker } from '@faker-js/faker';

interface BlogPost {
  title: string;
  description: string;
  author: string;
  date: string;
  published: boolean;
  content: string;
}

// Generate a 2000-word blog post
function generateLongBlogPost(index: number): BlogPost {
  const title = faker.lorem.sentence(8);
  const description = faker.lorem.paragraph(2);
  const author = faker.person.fullName();
  const date = faker.date.recent({ days: 30 }).toISOString().split('T')[0];
  
  // Generate 2000 words of content
  const content = generateLongContent(index);
  
  return {
    title,
    description,
    author,
    date,
    published: true,
    content
  };
}

// Generate 2000 words of realistic blog content
function generateLongContent(index: number): string {
  const sections = [
    `# ${faker.lorem.sentence(6)}\n\n`,
    `## Introduction\n\n${faker.lorem.paragraphs(3, '\n\n')}\n\n`,
    `## The Problem\n\n${faker.lorem.paragraphs(4, '\n\n')}\n\n`,
    `## Understanding the Context\n\n${faker.lorem.paragraphs(3, '\n\n')}\n\n`,
    `## Key Concepts\n\n${faker.lorem.paragraphs(5, '\n\n')}\n\n`,
    `## Implementation Details\n\n${faker.lorem.paragraphs(4, '\n\n')}\n\n`,
    `## Best Practices\n\n${faker.lorem.paragraphs(3, '\n\n')}\n\n`,
    `## Common Pitfalls\n\n${faker.lorem.paragraphs(2, '\n\n')}\n\n`,
    `## Real-World Examples\n\n${faker.lorem.paragraphs(4, '\n\n')}\n\n`,
    `## Performance Considerations\n\n${faker.lorem.paragraphs(3, '\n\n')}\n\n`,
    `## Security Implications\n\n${faker.lorem.paragraphs(2, '\n\n')}\n\n`,
    `## Future Trends\n\n${faker.lorem.paragraphs(3, '\n\n')}\n\n`,
    `## Conclusion\n\n${faker.lorem.paragraphs(2, '\n\n')}\n\n`,
    `## References\n\n${faker.lorem.paragraphs(1, '\n\n')}\n\n`
  ];
  
  // Add some code blocks and lists to make it more realistic
  const codeBlocks = [
    `\n\`\`\`typescript\n${faker.lorem.paragraph()}\n\`\`\`\n\n`,
    `\n\`\`\`javascript\n${faker.lorem.paragraph()}\n\`\`\`\n\n`,
    `\n\`\`\`bash\n${faker.lorem.paragraph()}\n\`\`\`\n\n`
  ];
  
  const lists = [
    `\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}\n\n`,
    `\n1. ${faker.lorem.sentence()}\n2. ${faker.lorem.sentence()}\n3. ${faker.lorem.sentence()}\n4. ${faker.lorem.sentence()}\n\n`
  ];
  
  let content = sections.join('');
  
  // Insert some code blocks and lists randomly
  const insertPoints = [3, 6, 9, 12];
  insertPoints.forEach(point => {
    if (Math.random() > 0.5) {
      content = content.slice(0, point * 200) + 
                codeBlocks[Math.floor(Math.random() * codeBlocks.length)] + 
                content.slice(point * 200);
    }
  });
  
  const listInsertPoints = [2, 5, 8, 11];
  listInsertPoints.forEach(point => {
    if (Math.random() > 0.5) {
      content = content.slice(0, point * 150) + 
                lists[Math.floor(Math.random() * lists.length)] + 
                content.slice(point * 150);
    }
  });
  
  // Add a footer
  content += `---\n\n*This is blog post ${index} of 100 in a massive batch test. Generated with Faker.js for realistic content testing.*\n\n**Word Count**: Approximately 2000 words\n**Generated**: ${new Date().toISOString()}\n**Author**: ${faker.person.fullName()}\n**Category**: ${faker.helpers.arrayElement(['Technology', 'Programming', 'Web Development', 'Data Science', 'AI/ML', 'DevOps', 'Security', 'Design'])}`;
  
  return content;
}

// Generate 100 blog posts
function generate100BlogPosts(): BlogPost[] {
  const blogs: BlogPost[] = [];
  
  console.log('🚀 Generating 100 blog posts with 2000 words each...');
  
  for (let i = 1; i <= 100; i++) {
    const blog = generateLongBlogPost(i);
    blogs.push(blog);
    
    if (i % 10 === 0) {
      console.log(`✅ Generated ${i}/100 blog posts`);
    }
  }
  
  console.log('🎉 All 100 blog posts generated successfully!');
  return blogs;
}

// Main execution
if (require.main === module) {
  const blogs = generate100BlogPosts();
  
  // Calculate total size
  const totalSize = JSON.stringify(blogs).length;
  const totalWords = blogs.reduce((acc, blog) => {
    return acc + blog.content.split(' ').length;
  }, 0);
  
  console.log('\n📊 Generation Summary:');
  console.log(`- Total blog posts: ${blogs.length}`);
  console.log(`- Total JSON size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Total word count: ${totalWords.toLocaleString()} words`);
  console.log(`- Average words per post: ${Math.round(totalWords / blogs.length)}`);
  
  // Save to file
  const fs = require('fs');
  const outputFile = './examples/100-blogs.json';
  fs.writeFileSync(outputFile, JSON.stringify(blogs, null, 2));
  console.log(`\n💾 Saved to: ${outputFile}`);
  
  // Create API payload
  const apiPayload = {
    blogs,
    mode: 'batch', // Force batch mode - all blogs in one PR
    batchTitle: `100 New Blog Posts - ${new Date().toLocaleDateString()}`,
    options: {
      labels: ['massive-batch', '100-posts', '2000-words', 'faker-generated'],
      autoMerge: true
    }
  };
  
  const payloadFile = './examples/100-blogs-api-payload.json';
  fs.writeFileSync(payloadFile, JSON.stringify(apiPayload, null, 2));
  console.log(`💾 API payload saved to: ${payloadFile}`);
  
  console.log('\n🚀 Ready to test with 100 blog posts!');
  console.log('Run: curl -X POST http://localhost:3002/api/publish-blog -H "Content-Type: application/json" -d @examples/100-blogs-api-payload.json');
}

export { generate100BlogPosts, generateLongBlogPost };
