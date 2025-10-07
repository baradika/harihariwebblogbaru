import { visit } from 'unist-util-visit';

// Regex untuk mendeteksi URL eksternal (http/https)
const EXTERNAL_URL_REGEX = /^https?:\/\/(?!localhost|127\.0\.0\.1|.*\.local)(.+)/;

export default function rehypeLinkPreview() {
  return function (tree: any) {
    visit(tree, (node: any, index: number | undefined, parent: any) => {
      if (!parent || node.type !== 'element' || node.tagName !== 'a') return;
      const href: string | undefined = node.properties?.href;
      if (!href) return;

      const match = href.match(EXTERNAL_URL_REGEX);
      if (!match) return;

      // Ganti link dengan komponen LinkPreview
      const linkPreviewComponent = {
        type: 'raw',
        value: `<LinkPreview url="${href}" />`,
      } as any;

      if (typeof index === 'number' && Array.isArray(parent.children)) {
        parent.children[index] = linkPreviewComponent;
      }
    });
  };
}
