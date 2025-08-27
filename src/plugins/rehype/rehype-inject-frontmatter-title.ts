import { visit } from "unist-util-visit";

export default function rehypeInjectFrontmatterTitle() {
  return (tree: any, file: any) => {
    const frontmatter = file.data.astro?.frontmatter;

    let headingLevelOne = false;
    visit(tree, (node: any) => {
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

      if (level === '1') {
        headingLevelOne = true;
        return;
      }
    });

    if (!headingLevelOne && frontmatter?.title) {
      const titleNode = {
        type: 'element',
        tagName: 'h1',
        children: [
          {
            type: 'text',
            value: frontmatter.title,
          },
        ],
      };

      console.log('Injecting frontmatter title:', frontmatter.title);
      tree.children.unshift(titleNode);
    }
  }
}