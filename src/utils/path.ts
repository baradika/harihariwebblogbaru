export const stripLeadingSlash =
  (href: string) => href[0] === '/' ? href.slice(1) : href;
export const stripTrailingSlash =
  (href: string) => href[href.length - 1] === '/' ? href.slice(0, -1) : href;
