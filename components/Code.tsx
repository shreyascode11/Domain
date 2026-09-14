import { Fragment, type ReactNode } from "react";

/**
 * Renders lesson text: `code`, **bold** and *italic*. Code spans are parsed
 * first, so asterisks inside code are left alone.
 */
export function Code({ text }: { text: string }) {
  const out: ReactNode[] = [];
  text.split(/(`[^`]+`)/g).forEach((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      out.push(
        <code key={i} className="code-chip">
          {part.slice(1, -1)}
        </code>
      );
      return;
    }
    part.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).forEach((seg, j) => {
      if (seg.startsWith("**") && seg.endsWith("**") && seg.length > 4) {
        out.push(
          <strong key={`${i}-${j}`} className="font-semibold text-ink-100">
            {seg.slice(2, -2)}
          </strong>
        );
      } else if (seg.startsWith("*") && seg.endsWith("*") && seg.length > 2) {
        out.push(<em key={`${i}-${j}`}>{seg.slice(1, -1)}</em>);
      } else if (seg) {
        out.push(<Fragment key={`${i}-${j}`}>{seg}</Fragment>);
      }
    });
  });
  return <>{out}</>;
}
