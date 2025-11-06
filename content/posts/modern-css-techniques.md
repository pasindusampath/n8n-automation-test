---
title: "Modern CSS Techniques"
description: "Explore modern CSS features that will improve your styling workflow"
author: "Alex Johnson"
date: "2025-03-05"
published: true
---

# Modern CSS Techniques

CSS has evolved significantly in recent years. Let's explore some modern techniques that can enhance your styling workflow.

## CSS Grid

CSS Grid is a powerful layout system that makes creating complex layouts simple:

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
```

## CSS Custom Properties

Also known as CSS variables, they allow you to reuse values throughout your stylesheet:

```css
:root {
  --primary-color: #3b82f6;
  --spacing: 1rem;
}

.button {
  background-color: var(--primary-color);
  padding: var(--spacing);
}
```

## Container Queries

Container queries allow you to style elements based on their container's size:

```css
@container (min-width: 500px) {
  .card {
    display: flex;
  }
}
```

## Flexbox

Flexbox remains essential for one-dimensional layouts:

```css
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

## Conclusion

Modern CSS provides powerful tools for creating responsive and maintainable layouts. Embrace these techniques to level up your CSS game!

