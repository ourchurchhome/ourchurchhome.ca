---
title: Kitchen Sink
subtitle: A demo page exercising every CMS field type
description: This singleton page exists solely to verify that every available CMS control renders and saves correctly in development.
order: 1
active: false
publishedAt: 2026-01-01
website: https://example.com
contactEmail: test@example.com
status: draft
tags:
  - demo
  - dev
author:
  name: Test Author
  bio: A fictional author used to demo the Group control.
tableDemo:
  - label: Row A
    value: Value A
  - label: Row B
    value: Value B
sections:
  - heading: First Section
    content: This section demonstrates the Repeater control.
    featured: true
  - heading: Second Section
    content: Another entry in the repeater.
    featured: false
widgets:
  - type: callout
    heading: Welcome to the kitchen sink
    body: This callout widget demonstrates the info tone.
    tone: info
  - type: image
    url: https://example.com/sample.jpg
    caption: A sample image widget with a caption.
    fullWidth: false
---

# Kitchen Sink

This is the visual editor (body) area. Edit this content to verify the **markdown editor** works correctly.

## Features to test

- **Bold** and *italic* text
- `Inline code` formatting
- Bullet lists like this one
- [Links](https://example.com)

## Code block

```
function hello() {
  return "world";
}
```

> Blockquote text to verify the blockquote control works.

---

Horizontal rule above. All done!

