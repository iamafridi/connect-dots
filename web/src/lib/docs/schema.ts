export type CalloutTone = "info" | "warn" | "ok";

export type Block =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "code"; title?: string; lines: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "list"; items: string[]; ordered?: boolean }
  | { t: "callout"; tone: CalloutTone; title: string; text: string }
  | { t: "tree"; title: string; entries: Array<[string, string]> }
  | { t: "steps"; steps: Array<{ title: string; body: string }> }
  | { t: "link"; to: string; label: string }
  | { t: "divider" };

export interface DocPage {
  slug: string;
  title: string;
  brief: string;
  section: string;
  order: number;
  blocks: Block[];
}

/* Sections appear in the sidebar in this order. */
export const SECTION_ORDER = [
  "Getting started",
  "Core concepts",
  "Operations",
  "Reference",
] as const;

export function getPage(pages: readonly DocPage[], slug?: string): DocPage | undefined {
  return pages.find((p) => p.slug === slug);
}

export function groupPages(
  pages: readonly DocPage[],
): Array<{ section: string; pages: DocPage[] }> {
  const sorted = [...pages].sort((a, b) => a.order - b.order);
  return SECTION_ORDER.map((section) => ({
    section,
    pages: sorted.filter((p) => p.section === section),
  })).filter((g) => g.pages.length > 0);
}

export function getAdjacent(
  pages: readonly DocPage[],
  slug: string,
): { prev?: DocPage; next?: DocPage } {
  const sorted = [...pages].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((p) => p.slug === slug);
  if (index === -1) return {};
  return { prev: sorted[index - 1], next: sorted[index + 1] };
}