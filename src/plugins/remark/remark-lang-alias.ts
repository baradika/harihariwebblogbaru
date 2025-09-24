import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

// Map languages that Shiki doesn't support to closest alternatives
const ALIASES: Record<string, { highlight: string; display?: string }> = {
  gdscript: { highlight: 'python', display: 'GDScript' },
  gdbscript: { highlight: 'python', display: 'GDScript' }, // common typo
};

export default function remarkLangAlias() {
  return function (tree: Root) {
    visit(tree, 'code', (node: any) => {
      if (!node.lang) return;
      const raw = String(node.lang).toLowerCase();
      const alias = ALIASES[raw];

      // Always normalize language casing for Shiki
      node.lang = raw;

      if (alias) {
        // Apply alias highlight while preserving display language in meta
        node.lang = alias.highlight;
        const display = alias.display || raw;
        const meta = node.meta ? String(node.meta) + ' ' : '';
        node.meta = `${meta}displayLang="${display}"`.trim();
      }
    });
  };
}
