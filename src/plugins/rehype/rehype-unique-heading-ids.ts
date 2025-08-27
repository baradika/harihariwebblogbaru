// https://github.com/withastro/astro/blob/main/packages/markdown/remark/src/rehype-collect-headings.ts

import type { Expression, Super } from 'estree';
import Slugger from "github-slugger";
import { visit } from "unist-util-visit";
import type { MdxTextExpression } from 'mdast-util-mdx-expression';
import type { Node } from 'unist';

const defaultSlugger = new Slugger();
const savedSlugger = new Map();

const rawNodeTypes = new Set(['text', 'raw', 'mdxTextExpression']);
const codeTagNames = new Set(['code', 'pre']);

export default function rehypeUniqueHeadingIds() {
  return (tree: any, file: any) => {
    const frontmatter = file.data.astro?.frontmatter;
		const isMDX = isMDXFile(file);

    const pathSegments = file.history[0]
      .replace(/\\/g, '/')
      .split("/");
    const isDataEvents = pathSegments.includes("data") && pathSegments.includes("events");
    
    let slugger = defaultSlugger;
    slugger.reset();

    if (isDataEvents) {
      const path = pathSegments
        .slice(pathSegments.length - 5, pathSegments.length - 3)
        .join("/");

      slugger = savedSlugger.get(path);
      if (!slugger) {
        slugger = new Slugger();
        savedSlugger.set(path, slugger);
      }
    }

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

      // const depth = Number.parseInt(level);

      let text = '';
      visit(node, (child: any, __: any, parent: any) => {
        if (child.type === 'element' || parent == null) {
          return;
        }
        
        if (child.type === 'raw') {
          if (/^\n?<.*>\n?$/.test(child.value)) {
            return;
          }
        }

        if (rawNodeTypes.has(child.type)) {
          if (isMDX || codeTagNames.has(parent.tagName)) {
            let value = child.value;
            if (isMdxTextExpression(child) && frontmatter) {
              const frontmatterPath = getMdxFrontmatterVariablePath(child);
              if (Array.isArray(frontmatterPath) && frontmatterPath.length > 0) {
                const frontmatterValue = getMdxFrontmatterVariableValue(
                  frontmatter,
                  frontmatterPath,
                );
                if (typeof frontmatterValue === 'string') {
                  value = frontmatterValue;
                }
              }
            }

            text += value;
          } else {
            text += child.value.replace(/\{/g, '${');
          }
        }
      });

      if (typeof node.properties.id !== 'string') {
        let slug = slugger.slug(text);
        if (slug.endsWith('-')) {
          slug = slug.slice(0, -1);
        }

        node.properties.id = slug;
      }
    });
  };
}

function isMDXFile(file: any) {
	return Boolean(file.history[0]?.endsWith('.mdx'));
}

/**
 * Check if an ESTree entry is `frontmatter.*.VARIABLE`.
 * If it is, return the variable path (i.e. `["*", ..., "VARIABLE"]`) minus the `frontmatter` prefix.
 */
function getMdxFrontmatterVariablePath(node: MdxTextExpression): string[] | Error {
	if (!node.data?.estree || node.data.estree.body.length !== 1) return new Error();

	const statement = node.data.estree.body[0];

	// Check for "[ANYTHING].[ANYTHING]".
	if (statement?.type !== 'ExpressionStatement' || statement.expression.type !== 'MemberExpression')
		return new Error();

	let expression: Expression | Super = statement.expression;
	const expressionPath: string[] = [];

	// Traverse the expression, collecting the variable path.
	while (
		expression.type === 'MemberExpression' &&
		expression.property.type === (expression.computed ? 'Literal' : 'Identifier')
	) {
		expressionPath.push(
			expression.property.type === 'Literal'
				? String(expression.property.value)
				: expression.property.name,
		);

		expression = expression.object;
	}

	// Check for "frontmatter.[ANYTHING]".
	if (expression.type !== 'Identifier' || expression.name !== 'frontmatter') return new Error();

	return expressionPath.reverse();
}

function getMdxFrontmatterVariableValue(frontmatter: Record<string, any>, path: string[]) {
	let value = frontmatter;

	for (const key of path) {
		if (!value[key]) return undefined;

		value = value[key];
	}

	return value;
}

function isMdxTextExpression(node: Node): node is MdxTextExpression {
	return node.type === 'mdxTextExpression';
}
