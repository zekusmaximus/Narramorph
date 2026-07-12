import type { ReactElement, ReactNode } from 'react';

export function MarkdownContent({ content }: { content: string }): ReactElement {
  const cleanContent = content.replace(/^---[\s\S]*?\n---\n+/, '');
  let paragraphs = cleanContent.split('\n\n').filter((paragraph) => paragraph.trim());
  if (paragraphs.length === 1) {
    paragraphs = cleanContent.split('\n').filter((paragraph) => paragraph.trim());
  }

  return (
    <>
      {paragraphs.map((paragraph, paragraphIndex) => {
        const processedParts: ReactNode[] = [];
        const boldPattern = /(\*\*|__)(.*?)\1/g;
        let match: RegExpExecArray | null;
        let lastIndex = 0;
        let key = 0;

        while ((match = boldPattern.exec(paragraph)) !== null) {
          if (match.index > lastIndex) {
            processedParts.push(paragraph.slice(lastIndex, match.index));
          }
          processedParts.push(<strong key={`bold-${key++}`}>{match[2]}</strong>);
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < paragraph.length) {
          processedParts.push(paragraph.slice(lastIndex));
        }

        const finalParts: ReactNode[] = [];
        const italicPattern = /(\*|_)(.*?)\1/g;
        processedParts.forEach((part) => {
          if (typeof part !== 'string') {
            finalParts.push(part);
            return;
          }
          let stringLastIndex = 0;
          for (const italicMatch of part.matchAll(italicPattern)) {
            const matchIndex = italicMatch.index ?? 0;
            if (matchIndex > stringLastIndex) {
              finalParts.push(part.slice(stringLastIndex, matchIndex));
            }
            finalParts.push(<em key={`italic-${key++}`}>{italicMatch[2]}</em>);
            stringLastIndex = matchIndex + italicMatch[0].length;
          }
          if (stringLastIndex < part.length) {
            finalParts.push(part.slice(stringLastIndex));
          }
        });

        return (
          <p key={`paragraph-${paragraphIndex}`} className="mb-6 last:mb-0">
            {finalParts
              .filter((part) => part !== '')
              .map((part, partIndex) => (
                <span key={`part-${paragraphIndex}-${partIndex}`}>{part}</span>
              ))}
          </p>
        );
      })}
    </>
  );
}
