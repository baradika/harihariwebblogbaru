// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeUniqueHeadingIds from './src/plugins/rehype/rehype-unique-heading-ids';
import rehypeShiftHeading from './src/plugins/rehype/rehype-shift-heading';
import { codeSnippetTransformer } from './src/transformers/code-snippet';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.baradika.vercel.app',
  redirects: {
    '/flag': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    '/flags': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  output: 'static',
  integrations: [
    icon(),
    sitemap({
      filter: (page) => 
        !page.includes('/components/')
    })
  ],
  markdown: {
    rehypePlugins: [
      rehypeUniqueHeadingIds,
      [rehypeShiftHeading, { shift: 1 }],
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            class: "autolink",
            ariaHidden: true,
            tabIndex: -1,
          },
          test: ['h2', 'h3', 'h4', 'h5'],
        },
      ],
    ],
    shikiConfig: {
      theme: 'css-variables',
      transformers: [
        codeSnippetTransformer()
      ]
    }
  },
  scopedStyleStrategy: 'where',
  vite: {
    // Type 'Plugin<any>[]' is not assignable to type 'PluginOption'.
    // @ts-ignore
    plugins: [tailwindcss()]
  }
});