import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { TerminalBlock } from "./Primitives";
import type { Block } from "../lib/docs/schema";

/* Tiny inline parser: `code` and **bold** → React nodes. No dependencies. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <strong key={key++} className="docs-strong">
          {m[1]}
        </strong>,
      );
    } else {
      out.push(
        <code key={key++} className="doc-c">
          {m[2]}
        </code>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function headingId(text: string): string {
  return `doc-${slugify(text)}`;
}

export function collectHeadings(
  blocks: readonly Block[],
): Array<{ level: 2 | 3; id: string; text: string }> {
  const heads: Array<{ level: 2 | 3; id: string; text: string }> = [];
  for (const b of blocks) {
    if (b.t === "h2") {
      heads.push({ level: 2, id: headingId(b.text), text: b.text });
    } else if (b.t === "h3") {
      heads.push({ level: 3, id: headingId(b.text), text: b.text });
    }
  }
  return heads;
}

function Terminal({ title, lines }: { title?: string; lines: string[] }) {
  return (
    <TerminalBlock
      title={title ?? "terminal"}
      lines={lines.map((line) =>
        line.startsWith("#") || line.startsWith("//")
          ? { y: line }
          : { c: line },
      )}
    />
  );
}

function renderBlock(block: Block, i: number): ReactNode {
  switch (block.t) {
    case "p":
      return (
        <p className="docs-p" key={i}>
          {inline(block.text)}
        </p>
      );
    case "h2":
      return (
        <h2 className="docs-h2" id={headingId(block.text)} key={i}>
          {inline(block.text)}
        </h2>
      );
    case "h3":
      return (
        <h3 className="docs-h3" id={headingId(block.text)} key={i}>
          {inline(block.text)}
        </h3>
      );
    case "code":
      return (
        <div className="docs-code" key={i}>
          <Terminal title={block.title} lines={block.lines} />
        </div>
      );
    case "table":
      return (
        <div className="table-wrap docs-table" key={i}>
          <table className="compare">
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h}>{inline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{inline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "list":
      return block.ordered ? (
        <ol className="docs-list docs-list--num" key={i}>
          {block.items.map((item, ii) => (
            <li key={ii}>{inline(item)}</li>
          ))}
        </ol>
      ) : (
        <ul className="docs-list" key={i}>
          {block.items.map((item, ii) => (
            <li key={ii}>{inline(item)}</li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div className={`callout callout--${block.tone}`} key={i}>
          <span className="callout__k">{block.title}</span>
          <p>{inline(block.text)}</p>
        </div>
      );
    case "tree":
      return (
        <div className="docs-tree" key={i}>
          <span className="docs-tree__root">{block.title}</span>
          <ul>
            {block.entries.map(([name, note], ei) => (
              <li key={name}>
                <span className="docs-tree__gl" aria-hidden="true">
                  {ei === block.entries.length - 1 ? "└─" : "├─"}
                </span>
                <b>{name}</b>
                <span className="docs-tree__note">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "steps":
      return (
        <ol className="doc-steps" key={i}>
          {block.steps.map((step, si) => (
            <li key={si}>
              <b>{step.title}</b>
              <p>{inline(step.body)}</p>
            </li>
          ))}
        </ol>
      );
    case "link":
      return (
        <div className="docs-linkline" key={i}>
          {block.to.startsWith("http") ? (
            <a
              className="link-line"
              href={block.to}
              target="_blank"
              rel="noreferrer"
            >
              {block.label}
            </a>
          ) : (
            <Link className="link-line" to={block.to}>
              {block.label}
            </Link>
          )}
        </div>
      );
    case "divider":
      return <hr className="docs-hr" key={i} />;
  }
}

export function DocsRenderer({ blocks }: { blocks: readonly Block[] }) {
  return <div className="docs-article">{blocks.map(renderBlock)}</div>;
}