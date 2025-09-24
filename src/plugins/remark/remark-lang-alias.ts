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
      if (!alias) return;

      // Set the highlighting language
      node.lang = alias.highlight;

      // Preserve original display language in meta so Shiki transformer can show it
      const display = alias.display || raw;
      const meta = node.meta ? String(node.meta) + ' ' : '';
      node.meta = `${meta}displayLang="${display}"`.trim();
    });
  };
}
