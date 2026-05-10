import { useMemo } from 'react';

export function usePortalContainer(params: {
  container?: Element | DocumentFragment | null;
  fallbackContainerId?: string;
}) {
  const { container: defaultContainer, fallbackContainerId } = params;

  const container = useMemo(() => {
    if (defaultContainer) {
      return defaultContainer;
    }
    if (typeof document !== 'undefined' && fallbackContainerId) {
      return document.getElementById(fallbackContainerId);
    }
    return null;
  }, [defaultContainer, fallbackContainerId]);

  return container;
}
