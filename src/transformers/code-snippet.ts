import { h } from "hastscript";
import type { ShikiTransformer } from "shiki";

export const codeSnippetTransformer = (): ShikiTransformer => {
  return {
    name: "shiki-transformer-code-snippet",
    pre(node) {
      const { meta, lang } = this.options as any;

      const wrapper = h(
        "div",
        { class: "relative code-wrapper not-prose" },
        node
      );

      const headerContainer = h(
        "div",
        {
          class: "header-container flex items-center justify-between px-3 py-2 border-b border-flexoki-base-100 dark:border-flexoki-base-900 bg-flexoki-base-50/50 dark:bg-flexoki-base-950/50"
        },
        []
      );

      const matchFilename = meta?.__raw?.match(/filename=['"]([^'"]+)['"]/);
      if (matchFilename) {
        const fileName = matchFilename[0]
          .replace(/filename=['"]/, "")
          .replace(/['"]$/, "");
        // We'll append filename to the left-side group below
        (headerContainer as any).__fileName = fileName;
      }

      const rawLang = (typeof lang === 'string' && lang) ? lang.toLowerCase() : '';
      // Prefer displayLang passed via meta (e.g., from remark-lang-alias), e.g. displayLang="GDScript"
      const displayLangMatch = meta?.__raw?.match(/displayLang=["']([^"']+)["']/i);
      const languageMap: Record<string, string> = {
        'c': 'C',
        'cpp': 'C++', 'c++': 'C++', 'cc': 'C++',
        'csharp': 'C#', 'cs': 'C#',
        'java': 'Java',
        'javascript': 'JavaScript', 'js': 'JavaScript',
        'typescript': 'TypeScript', 'ts': 'TypeScript',
        'python': 'Python', 'py': 'Python',
        'bash': 'Bash', 'sh': 'Shell', 'shell': 'Shell',
        'powershell': 'PowerShell', 'ps1': 'PowerShell',
        'go': 'Go', 'golang': 'Go',
        'rust': 'Rust', 'rs': 'Rust',
        'ruby': 'Ruby', 'rb': 'Ruby',
        'php': 'PHP',
        'swift': 'Swift',
        'kotlin': 'Kotlin', 'kt': 'Kotlin',
        'dart': 'Dart',
        'sql': 'SQL',
        'html': 'HTML',
        'css': 'CSS',
        'json': 'JSON',
        'yaml': 'YAML', 'yml': 'YAML',
        'toml': 'TOML',
        'md': 'Markdown', 'markdown': 'Markdown',
        'gdscript': 'GDScript', 'godot': 'GDScript'
      };
      const language = displayLangMatch?.[1]
        ? displayLangMatch[1]
        : (rawLang ? (languageMap[rawLang] ?? rawLang) : '');
      const leftGroupChildren: any[] = [];
      if (language) {
        leftGroupChildren.push(
          h(
            'span',
            {
              class:
                'text-xs font-medium px-2 py-0.5 rounded bg-flexoki-base-100 dark:bg-flexoki-base-900 text-flexoki-light-tx-2 dark:text-flexoki-dark-tx-2'
            },
            language
          )
        );
      }
      if ((headerContainer as any).__fileName) {
        leftGroupChildren.push(
          h('span', { class: 'title ml-2 text-xs text-flexoki-light-tx-2 dark:text-flexoki-dark-tx-2' }, (headerContainer as any).__fileName)
        );
      }

      // Append a minimal copy button container after the code block
      const copyBtn = h(
        'button',
        {
          class: 'copy-button',
          'data-code': this.source,
          type: 'button',
          'aria-label': 'Copy code',
        },
        [
          h('svg', {
            xmlns: 'http://www.w3.org/2000/svg', width: '18', height: '18', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
            'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
            'data-icon': 'copy',
          }, [h('path', { d: 'M16 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z' })]),
          h('span', { class: 'copy-label' }, 'Copy')
        ]
      );

      const copyContainer = h('div', { class: 'code-copy not-prose' }, [copyBtn]);
      (wrapper.children as any[]).push(copyContainer);

      return wrapper;
    }
  };
};