import { useMemo, useState } from 'react';
import { knowledgeBaseArticles, type KnowledgeArticle } from '../data/seedData';
import type { Session } from '../types/helpdesk';
import { normalizeRole } from './helpers';

const categories = ['Alle', 'Konto og passord', 'Nettverk', 'Printer', 'HelpDesk', 'Sikkerhet'] as const;

export default function KnowledgeBase({ session }: { session: Session }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('Alle');
  const [selectedId, setSelectedId] = useState(knowledgeBaseArticles[0]?.id);
  const normalizedRole = normalizeRole(session.role);
  const canEdit = normalizedRole === 'support' || normalizedRole === 'admin';

  const visibleArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return knowledgeBaseArticles.filter(article => {
      const allowed =
        article.visibility === 'Alle' ||
        (article.visibility === 'Support' && (normalizedRole === 'support' || normalizedRole === 'admin')) ||
        (article.visibility === 'Admin' && normalizedRole === 'admin');
      const categoryMatch = category === 'Alle' || article.category === category;
      const queryMatch = !normalized || [article.title, article.description, article.category, article.steps.join(' ')].join(' ').toLowerCase().includes(normalized);
      return allowed && categoryMatch && queryMatch;
    });
  }, [category, query, normalizedRole]);

  const selected = visibleArticles.find(article => article.id === selectedId) ?? visibleArticles[0];

  return (
    <div className="kb-page">
      <section className="kb-hero">
        <div>
          <span className="badge badge-open">HelpDesk knowledge</span>
          <h1>Kunnskapsbase</h1>
          <p>Sok etter vanlige losninger, AD-rutiner og supportprosedyrer for eksamensmiljoet.</p>
        </div>
        {canEdit && (
          <div className="kb-admin-actions">
            <button className="btn btn-primary" type="button">Ny artikkel</button>
            <button className="btn btn-ghost" type="button">Publiseringsstatus</button>
          </div>
        )}
      </section>

      <section className="kb-tools">
        <div className="kb-search">
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Sok etter losning..." />
        </div>
        <div className="kb-filters">
          {categories.map(item => (
            <button key={item} className={`filter-tab ${category === item ? 'active' : ''}`} type="button" onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
      </section>

      <div className="kb-layout">
        <section className="kb-card-grid">
          {visibleArticles.map(article => (
            <ArticleCard key={article.id} article={article} active={article.id === selected?.id} canEdit={canEdit} onClick={() => setSelectedId(article.id)} />
          ))}
        </section>

        {selected ? (
          <article className="kb-detail">
            <div className="kb-detail-header">
              <div>
                <span className="badge badge-tag">{selected.category}</span>
                <h2>{selected.title}</h2>
                <p>{selected.description}</p>
              </div>
              <span className="badge badge-new">{selected.readTime}</span>
            </div>

            {canEdit && (
              <div className="kb-publish-row">
                <span><strong>Publiseringsstatus:</strong> {selected.status}</span>
                <span><strong>Sist oppdatert av:</strong> {selected.updatedBy}</span>
                <button className="btn btn-ghost" type="button">Rediger</button>
              </div>
            )}

            <div className="kb-checklist">
              <div className="section-title">Steg / sjekkliste</div>
              {selected.steps.map(step => (
                <label key={step} className="kb-check">
                  <input type="checkbox" />
                  <span>{step}</span>
                </label>
              ))}
            </div>

            <div className="kb-related">
              <div className="section-title">Relaterte artikler</div>
              <div className="tag-list">
                {selected.related.map(title => <span className="tag-item" key={title}>{title}</span>)}
              </div>
            </div>

            <div className="kb-feedback">
              <span>Loste dette problemet?</span>
              <button className="btn btn-primary" type="button">Ja</button>
              <button className="btn btn-ghost" type="button">Nei</button>
            </div>
          </article>
        ) : (
          <div className="kb-detail empty-state">Ingen artikler matcher soket.</div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article, active, canEdit, onClick }: { article: KnowledgeArticle; active: boolean; canEdit: boolean; onClick: () => void }) {
  return (
    <button className={`kb-article-card ${active ? 'active' : ''}`} type="button" onClick={onClick}>
      <div className="kb-card-top">
        <span className="badge badge-tag">{article.category}</span>
        <span className="badge badge-open">{article.visibility}</span>
      </div>
      <h3>{article.title}</h3>
      <p>{article.description}</p>
      <div className="kb-card-meta">
        <span>{article.readTime}</span>
        <span>Oppdatert {article.updatedAt}</span>
      </div>
      {canEdit && (
        <div className="kb-card-admin">
          <span>{article.status}</span>
          <span>{article.updatedBy}</span>
        </div>
      )}
    </button>
  );
}
