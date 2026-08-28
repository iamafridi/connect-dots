import { useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { DOC_PAGES, DOC_ROOT } from "../lib/docs/content";
import { getAdjacent, getPage, groupPages, type DocPage } from "../lib/docs/schema";
import { DocCrumbs } from "./Breadcrumbs";
import { collectHeadings, DocsRenderer } from "./DocsRenderer";

function Groups({
  pages,
  active,
  onNavigate,
}: {
  pages: DocPage[];
  active: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {groupPages(pages).map((group) => (
        <div className="docs__group" key={group.section}>
          <h4>{group.section}</h4>
          {group.pages.map((p) => (
            <Link
              to={`/docs/${p.slug}`}
              key={p.slug}
              className={`docs__link${p.slug === active ? " is-active" : ""}`}
              onClick={onNavigate}
            >
              <span>{p.title}</span>
              <span className="docs__link-tag">{String(p.order).padStart(2, "0")}</span>
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}

export default function DocsLayout() {
  const { slug } = useParams();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const page = slug ? getPage(DOC_PAGES, slug) : getPage(DOC_PAGES, DOC_ROOT);
  if (!page) return <Navigate to={`/docs/${DOC_ROOT}`} replace />;

  const { prev, next } = getAdjacent(DOC_PAGES, page.slug);
  const headings = collectHeadings(page.blocks);
  const active = page.slug;

  const closeMobile = () => {
    const d = detailsRef.current;
    if (d) d.open = false;
  };

  return (
    <section className="section section--first">
      <div className="container">
        <div className="docs">
          <aside className="docs__sidebar" aria-label="Documentation">
            <Groups pages={DOC_PAGES} active={active} />
            {headings.length > 1 ? (
              <div className="docs__toc">
                <h5>On this page</h5>
                {headings.map((h) => (
                  <button
                    type="button"
                    key={h.id}
                    className="docs__toc-link"
                    onClick={() => {
                      document.getElementById(h.id)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    {h.text}
                  </button>
                ))}
              </div>
            ) : null}
          </aside>

          <div className="docs__main">
            <details className="docs-nav-mobile" ref={detailsRef}>
              <summary>Docs menu</summary>
              <nav aria-label="Documentation (mobile)">
                <Groups
                  pages={DOC_PAGES}
                  active={active}
                  onNavigate={closeMobile}
                />
              </nav>
            </details>

            <DocCrumbs page={page} />
            <h1 className="docs__title">{page.title}</h1>
            <p className="docs__brief">{page.brief}</p>

            <DocsRenderer blocks={page.blocks} />

            <div className="docs-prevnext">
              {prev ? (
                <Link to={`/docs/${prev.slug}`} className="docs-pn">
                  <span>Previous</span>
                  <b>{prev.title}</b>
                </Link>
              ) : (
                <span className="docs-pn" aria-hidden="true" />
              )}
              {next ? (
                <Link to={`/docs/${next.slug}`} className="docs-pn docs-pn--next">
                  <span>Next</span>
                  <b>{next.title}</b>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}