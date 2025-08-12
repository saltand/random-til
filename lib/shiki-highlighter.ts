import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

export async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: [
        'javascript',
        'typescript',
        'jsx',
        'tsx',
        'python',
        'ruby',
        'go',
        'rust',
        'java',
        'c',
        'cpp',
        'csharp',
        'php',
        'swift',
        'kotlin',
        'bash',
        'shell',
        'sql',
        'html',
        'css',
        'scss',
        'json',
        'yaml',
        'xml',
        'markdown',
        'docker',
        'graphql',
        'elixir',
        'vim',
        'lua',
        'r',
        'matlab',
        'scala',
        'clojure',
        'haskell',
        'erlang',
        'ocaml',
        'fsharp',
        'dart',
        'vue',
        'svelte',
        'astro',
        'prisma',
        'toml',
        'ini',
        'diff',
        'plaintext'
      ]
    });
  }
  return highlighterPromise;
}

export async function highlightCode(code: string, lang: string, isDark: boolean) {
  const highlighter = await getHighlighter();
  
  // Map common aliases
  const langMap: Record<string, string> = {
    'sh': 'bash',
    'zsh': 'bash',
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'yml': 'yaml',
    'text': 'plaintext',
    '': 'plaintext'
  };
  
  const mappedLang = langMap[lang] || lang;
  
  // Check if language is supported
  const loadedLangs = highlighter.getLoadedLanguages();
  const finalLang = loadedLangs.includes(mappedLang as any) ? mappedLang : 'plaintext';
  
  const html = highlighter.codeToHtml(code, {
    lang: finalLang,
    theme: isDark ? 'github-dark' : 'github-light'
  });
  
  return html;
}