'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import {
  helpArticles,
  searchHelpArticles,
} from '@gitroom/frontend/components/help/help.articles';

export const HelpCentre = () => {
  const t = useT();
  const searchParams = useSearchParams();
  const articleParam = searchParams.get('article') || '';
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(
    articleParam || helpArticles[0]?.id || ''
  );
  const results = useMemo(() => searchHelpArticles(query), [query]);
  const active =
    results.find((article) => article.id === activeId) ||
    helpArticles.find((article) => article.id === activeId) ||
    results[0];

  useEffect(() => {
    if (!articleParam) {
      return;
    }
    const match = helpArticles.find((article) => article.id === articleParam);
    if (match) {
      setActiveId(match.id);
      setQuery('');
    }
  }, [articleParam]);

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[24px] font-[600] tracking-[-0.02em] text-content">
          {t('help_centre', 'Help centre')}
        </h1>
        <p className="text-[14px] text-muted max-w-[60ch]">
          {t(
            'help_centre_intro',
            'Search short guides for connecting channels, scheduling, accessibility, MCP and billing.'
          )}
        </p>
      </div>

      <label
        className="flex flex-col gap-[6px] max-w-[480px]"
        htmlFor="help-search"
      >
        <span className="text-[13px] font-[600] text-muted">
          {t('search_help', 'Search help')}
        </span>
        <input
          id="help-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(
            'search_help_placeholder',
            'Try “schedule”, “MCP”, or “billing”'
          )}
          className="h-[44px] px-3 bg-surface border border-subtleBorder rounded-[8px] text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnPrimary"
        />
      </label>

      <div className="grid gap-[16px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <ul
          className="flex flex-col gap-[8px]"
          aria-label={t('help_topics', 'Help topics')}
        >
          {results.map((article) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => setActiveId(article.id)}
                className={`w-full text-start cursor-pointer px-[14px] py-[12px] rounded-[8px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnPrimary min-h-[44px] ${
                  active?.id === article.id
                    ? 'bg-btnPrimary text-white border-transparent'
                    : 'bg-surface border-subtleBorder hover:bg-boxHover text-content'
                }`}
              >
                <div className="text-[14px] font-[600]">{article.title}</div>
                <div
                  className={`text-[12px] mt-[4px] ${
                    active?.id === article.id ? 'text-white/85' : 'text-muted'
                  }`}
                >
                  {article.summary}
                </div>
              </button>
            </li>
          ))}
          {!results.length ? (
            <li className="text-[13px] text-muted px-[4px]">
              {t('help_no_results', 'No articles match that search.')}
            </li>
          ) : null}
        </ul>

        {active ? (
          <article className="bg-surface border border-subtleBorder rounded-[12px] p-[24px] flex flex-col gap-[12px]">
            <h2 className="text-[18px] font-[600] text-content">
              {active.title}
            </h2>
            <p className="text-[14px] text-muted">{active.summary}</p>
            <pre className="whitespace-pre-wrap text-[14px] leading-[1.65] font-sans text-content">
              {active.body}
            </pre>
          </article>
        ) : null}
      </div>
    </div>
  );
};
