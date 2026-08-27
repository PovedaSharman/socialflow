'use client';

import { useEffect, useState } from 'react';

type VisibilityDocument = Pick<
  Document,
  'hidden' | 'addEventListener' | 'removeEventListener'
>;
type VisibilityWindow = Pick<
  Window,
  'addEventListener' | 'removeEventListener'
>;

export const initialPageVisibility = (target?: VisibilityDocument) =>
  target ? !target.hidden : true;

export const subscribePageVisibility = (
  page: number,
  setVisible: (visible: boolean) => void,
  documentTarget?: VisibilityDocument,
  windowTarget?: VisibilityWindow
) => {
  if (!documentTarget || !windowTarget || page > 1) {
    return () => undefined;
  }

  const handleVisibilityChange = () => setVisible(!documentTarget.hidden);
  const onBlur = () => setVisible(false);
  const onFocus = () => setVisible(true);

  windowTarget.addEventListener('blur', onBlur);
  windowTarget.addEventListener('focus', onFocus);
  documentTarget.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    documentTarget.removeEventListener(
      'visibilitychange',
      handleVisibilityChange
    );
    windowTarget.removeEventListener('blur', onBlur);
    windowTarget.removeEventListener('focus', onFocus);
  };
};

export function usePageVisibility(page: number) {
  const [isVisible, setIsVisible] = useState(() =>
    initialPageVisibility(
      typeof document === 'undefined' ? undefined : document
    )
  );
  useEffect(
    () =>
      subscribePageVisibility(
        page,
        setIsVisible,
        typeof document === 'undefined' ? undefined : document,
        typeof window === 'undefined' ? undefined : window
      ),
    [page]
  );
  return isVisible;
}
