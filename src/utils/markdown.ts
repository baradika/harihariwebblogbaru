import type { MarkdownHeading } from "astro";

export interface TableOfContentHeading extends MarkdownHeading {
  children: TableOfContentHeading[];
}

export const buildHierarchy = (headings: MarkdownHeading[]): TableOfContentHeading[] => {
  const stack: TableOfContentHeading[] = [];
  const result: TableOfContentHeading[] = [];

  result.push({ depth: 1, slug: "_halll", text: "Overview", children: [] });

  headings.forEach(heading => {
    const { depth, slug, text } = heading;

    const newHeading: TableOfContentHeading = { depth, slug, text, children: [] };

    // Determine where to insert the new heading
    while (stack.length > 0 && stack[stack.length - 1] !== undefined && stack[stack.length - 1]!.depth >= depth) {
      stack.pop(); // Pop higher or equal depth items
    }

    if (stack.length === 0) {
      result.push(newHeading); // Add to the root level
    } else {
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(newHeading); // Add to the parent's children
      }
    }

    stack.push(newHeading); // Add the current heading to the stack
  });

  return result;
}
