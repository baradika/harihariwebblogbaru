import { visit } from 'unist-util-visit';

// Matches https://github.com/{owner}/{repo} (no extra path segments)
const GITHUB_REPO_REGEX = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\/?(?:[#?].*)?)?$/;

export default function rehypeGitHubRepoCard() {
  return function (tree: any) {
    visit(tree, (node: any, index: number | undefined, parent: any) => {
      if (!parent || node.type !== 'element' || node.tagName !== 'a') return;
      const href: string | undefined = node.properties?.href;
      if (!href) return;

      const match = href.match(GITHUB_REPO_REGEX);
      if (!match) return;

      const owner = match[1];
      const repo = match[2];

      // Replace link with a placeholder container to be enhanced client-side
      const placeholder = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['github-repo-card', 'not-prose'],
          'data-owner': owner,
          'data-repo': repo,
          'data-href': href,
        },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: [
                'rounded',
                'text-flexoki-light-tx',
                'dark:text-flexoki-dark-tx',
                'bg-flexoki-base-50',
                'dark:bg-flexoki-base-950',
                'border',
                'border-flexoki-base-100',
                'dark:border-flexoki-base-900',
                'p-4',
                'flex',
                'flex-col',
                'gap-2',
              ],
            },
            children: [
              { type: 'text', value: 'Loading repository…' },
            ],
          },
        ],
      } as any;

      if (typeof index === 'number' && Array.isArray(parent.children)) {
        parent.children[index] = placeholder;
      }
    });
  };
}
