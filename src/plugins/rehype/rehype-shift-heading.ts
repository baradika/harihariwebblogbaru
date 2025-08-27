import type { Nodes, Root } from 'hast';
import { visit } from 'unist-util-visit';

export default function rehypeShiftHeading(options: { shift?: number }) {
  const shift = options.shift ?? 0;

  return (tree: Root, file: any) => {
    if (
      typeof shift !== 'number' ||
      !shift ||
      !Number.isFinite(shift) ||
      Math.floor(shift) !== shift
    ) {
      throw new TypeError(
        `Expected \`options.shift\` to be an integer, got \`${shift}\``
      );
    }

    visit(tree, 'element', function (node: Nodes) {
      if (node.type !== 'element') {
        return;
      }

      const { tagName } = node;
      if (tagName[0] !== 'h') {
        return;
      }

      const [, level] = /h([0-6])/.exec(tagName) ?? [];
      if (!level) {
        return;
      }

      const pathSegments = file.history[0]
        .replace(/\\/g, '/')
        .split("/");
      const isDataEvents = pathSegments.includes("data") && pathSegments.includes("events");

      const rank = parseInt(level, 10) + (isDataEvents ? 2 : shift);
      node.tagName = 'h' + (rank > 6 ? 6 : rank < 1 ? 1 : rank);
    });
  }
}
