import { Link } from "react-router-dom";
import { DOC_PAGES, DOC_ROOT } from "../lib/docs/content";
import type { DocPage } from "../lib/docs/schema";

/* ---------- Breadcrumbs ---------- */
export interface Crumb {
  label: string;
  to?: string;
}

/**
 * Shared breadcrumb trail — uppercase mono, links in coral, current page as
 * plain text with aria-current. Middle crumbs hide on small screens.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span className="crumbs__item" key={`${item.label}-${i}`}>
            {item.to && !last ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current={last ? "page" : undefined}>{item.label}</span>
            )}
            {!last ? (
              <span className="crumbs__sep" aria-hidden="true">
                /
              </span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}

/**
 * Docs-specific trail: Home / Docs / {section} / {page}. Section links to the
 * section's first page; the crumb bar replaces the old two-item docs__crumb.
 */
export function DocCrumbs({ page }: { page: DocPage }) {
  const sectionFirst = DOC_PAGES.filter((p) => p.section === page.section).sort(
    (a, b) => a.order - b.order,
  )[0];

  return (
    <Breadcrumbs
      items={[
        { label: "Home", to: "/" },
        { label: "Docs", to: `/docs/${DOC_ROOT}` },
        {
          label: page.section,
          to: `/docs/${sectionFirst ? sectionFirst.slug : DOC_ROOT}`,
        },
        { label: page.title },
      ]}
    />
  );
}