/**
 * Utility to clean markdown formatting, raw code blocks, and URLs
 * so that Web Speech API reads text naturally without reciting syntax symbols.
 */
export function cleanSpeechText(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  // 1. Replace multi-line code blocks with a brief spoken notice
  text = text.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, ' [Code omitted] ');

  // 2. Inline code: remove backticks but keep text
  text = text.replace(/`([^`]+)`/g, '$1');

  // 3. Remove image tags ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');

  // 4. Convert markdown links [text](url) to just text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 5. Replace bare URLs with "link"
  text = text.replace(/https?:\/\/[^\s]+/g, 'link');

  // 6. Remove markdown headers (#, ##, ###, etc.)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 7. Remove bold and italic markers (*, **, _, __)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');

  // 8. Remove strikethrough (~~text~~)
  text = text.replace(/~~(.*?)~~/g, '$1');

  // 9. Remove blockquotes (>)
  text = text.replace(/^>\s+/gm, '');

  // 10. Remove bullet points and numbered list markers (- , * , 1. )
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');

  // 11. Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // 12. Remove HTML tags if any
  text = text.replace(/<[^>]*>/g, '');

  // 13. Normalize whitespace and clean up double periods or orphan punctuation
  text = text
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\.+/g, '.')
    .replace(/\s*\.\s*/g, '. ')
    .trim();

  return text;
}
