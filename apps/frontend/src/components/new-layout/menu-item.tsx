'use client';
import { FC, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Link from 'next/link';

export const MenuItem: FC<{
  label: string;
  icon: ReactNode;
  path: string;
  onClick?: () => void;
}> = ({ label, icon, path, onClick }) => {
  const currentPath = usePathname();
  const isActive = isMenuPathActive(currentPath, path);

  const className = clsx(
    'group w-full minCustom:h-[54px] custom:h-[44px] py-[8px] px-[6px] minCustom:gap-[4px] custom:gap-[2px] flex flex-col font-[600] items-center justify-center rounded-[12px] hover:text-textItemFocused hover:bg-boxFocused transition-colors mobile:!h-[54px] mobile:min-w-[64px] mobile:w-[64px] mobile:py-[4px]',
    isActive ? 'text-textItemFocused bg-boxFocused' : 'text-textItemBlur'
  );

  const inner = (
    <>
      <div className="custom:scale-90 transition-transform">{icon}</div>
      <div className="custom:text-[9px] minCustom:text-[10px] leading-[1.1] text-center">
        {label}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        className={className}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      prefetch={true}
      href={path}
      title={label}
      aria-current={isActive ? 'page' : undefined}
      {...(path.indexOf('http') === 0 && {
        target: '_blank',
        rel: 'noreferrer',
      })}
      className={className}
    >
      {inner}
    </Link>
  );
};

export function isMenuPathActive(currentPath: string, itemPath: string) {
  return (
    itemPath.startsWith('/') &&
    (currentPath === itemPath || currentPath.startsWith(`${itemPath}/`))
  );
}
