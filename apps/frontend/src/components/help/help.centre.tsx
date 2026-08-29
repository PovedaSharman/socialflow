'use client';

import { useMemo, useState } from 'react';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import {
  helpArticles,
  searchHelpArticles,
} from '@gitroom/frontend/components/help/help.articles';

export const HelpCentre = () => {
  const t = useT();
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(helpArticles[0]?.id || '');
  const results = useMemo(() => searchHelpArticles(query), [query]);
  const active =
    results.find((article) => article.id === activeId) || results[0];

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[6px]">
        <h1 className="text-[22px] font-[600]">
          {t('help_centre', 'Help centre')}
        </h1>
        <p className="text-[14px] text-customColor18">
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
        <span className="text-[13px] font-[600] text-customColor18">
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
          className="h-[44px] px-3 bg-newBgColorInner border border-newBorder rounded-[8px] text-textColor"
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
                className={`w-full text-start cursor-pointer px-[14px] py-[12px] rounded-[8px] border transition-colors ${
                  active?.id === article.id
                    ? 'bg-[#612BD3] text-white border-transparent'
                    : 'bg-newBgColorInner border-newBorder hover:bg-boxHover'
                }`}
              >
                <div className="text-[14px] font-[600]">{article.title}</div>
                <div
                  className={`text-[12px] mt-[4px] ${
                    active?.id === article.id
                      ? 'text-white/80'
                      : 'text-customColor18'
                  }`}
                >
                  {article.summary}
                </div>
              </button>
            </li>
          ))}
          {!results.length ? (
            <li className="text-[13px] text-customColor18 px-[4px]">
              {t('help_no_results', 'No articles match that search.')}
            </li>
          ) : null}
        </ul>

        {active ? (
          <article className="bg-newBgColorInner border border-newBorder rounded-[12px] p-[20px] flex flex-col gap-[12px]">
            <h2 className="text-[18px] font-[600]">{active.title}</h2>
            <p className="text-[14px] text-customColor18">{active.summary}</p>
            <pre className="whitespace-pre-wrap text-[14px] leading-[1.6] font-sans">
              {active.body}
            </pre>
          </article>
        ) : null}
      </div>
    </div>
  );
};
