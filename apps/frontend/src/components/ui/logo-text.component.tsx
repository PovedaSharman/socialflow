'use client';

import React from 'react';
import { useVariables } from '@gitroom/react/helpers/variable.context';

export const LogoTextComponent = () => {
  const { brandName, brandPrimary } = useVariables();

  return (
    <div className="flex items-center gap-3" aria-label={brandName}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="10" fill={brandPrimary} />
        <path
          d="M8.5 8.5h10.75a4.25 4.25 0 0 1 0 8.5h-6.5a4.25 4.25 0 0 0 0 8.5h10.75"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[20px] font-[700] tracking-[-0.02em]">
        {brandName}
      </span>
    </div>
  );
};
