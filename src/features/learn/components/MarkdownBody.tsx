import React from 'react';

interface MarkdownBodyProps {
  content: string;
}

export function MarkdownBody({ content }: MarkdownBodyProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="prose prose-invert max-w-none space-y-6 text-zinc-300 text-sm md:text-base leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={i} className="text-xl md:text-2xl font-bold text-white pt-4 pb-1 border-b border-zinc-800">
                {renderInline(block.text)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="text-lg md:text-xl font-semibold text-white pt-2">
                {renderInline(block.text)}
              </h3>
            );
          case 'ul':
            return (
              <ul key={i} className="list-disc list-inside space-y-2 text-zinc-300 ml-2">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case 'p':
          default:
            return (
              <p key={i} className="leading-relaxed">
                {renderInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let currentParagraph: string[] = [];
  let currentList: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'p', text: currentParagraph.join(' ').trim() });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: 'ul', items: currentList });
      currentList = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h3', text: line.slice(4).trim() });
    } else if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph();
      currentList.push(line.slice(2).trim());
    } else {
      flushList();
      currentParagraph.push(line);
    }
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInline(text: string): React.ReactNode[] {
  // Parse **bold** and `code`
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/);
    const codeMatch = remaining.match(/^(.*?)`(.+?)`(.*)$/);

    if (boldMatch && (!codeMatch || boldMatch[1].length <= codeMatch[1].length)) {
      if (boldMatch[1]) {
        parts.push(boldMatch[1]);
      }
      parts.push(
        <strong key={key++} className="font-semibold text-white">
          {boldMatch[2]}
        </strong>
      );
      remaining = boldMatch[3];
    } else if (codeMatch) {
      if (codeMatch[1]) {
        parts.push(codeMatch[1]);
      }
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-200 text-xs rounded font-mono">
          {codeMatch[2]}
        </code>
      );
      remaining = codeMatch[3];
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts;
}
