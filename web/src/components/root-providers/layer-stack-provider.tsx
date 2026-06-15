'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { assertUnreachable } from '@daily-logs/utils/assertions';

export type LayerBand = 'notification' | 'interactive';

export type LayerStackContextValue = {
  register: (params: { id: string; band: LayerBand }) => void;
  unregister: (id: string) => void;
  zIndexById: Record<string, number>;
};

const LayerStackContext = createContext<LayerStackContextValue | undefined>(undefined);

/**
 * Tracks every open overlay layer and assigns each a z-index by open-order
 * within its band. The newest layer in a band always sits on top, regardless of
 * element type, so arbitrary nesting (tooltip in popover in dialog, nested
 * dialogs, ...) stacks correctly without per-component z-index.
 *
 * Bands are the `LayerBand` union above; each maps to a `#${band}-layer-root`
 * portal container whose own z-index in `globals.css` sets the band ordering
 * (interactive below notification). Within a band, the values here only order
 * layers relative to each other inside that container.
 */
export function LayerStackProvider(props: { children: ReactNode }) {
  const { children } = props;

  const notificationElementsRegistryRef = useRef<Set<string>>(new Set());
  const interactiveElementsRegistryRef = useRef<Set<string>>(new Set());

  const [zIndexById, setZIndexById] = useState<Record<string, number>>({});

  const recompute = useCallback(() => {
    const nextZIndexById: Record<string, number> = {};

    [...notificationElementsRegistryRef.current].forEach((id, index) => {
      nextZIndexById[id] = index + 1;
    });

    [...interactiveElementsRegistryRef.current].forEach((id, index) => {
      nextZIndexById[id] = index + 1;
    });

    setZIndexById(nextZIndexById);
  }, []);

  const register = useCallback(
    (params: { id: string; band: LayerBand }) => {
      const { id, band } = params;

      switch (band) {
        case 'notification':
          notificationElementsRegistryRef.current.add(id);
          break;
        case 'interactive':
          interactiveElementsRegistryRef.current.add(id);
          break;
        default:
          assertUnreachable(band);
      }

      recompute();
    },
    [recompute],
  );

  const unregister = useCallback(
    (id: string) => {
      notificationElementsRegistryRef.current.delete(id);
      interactiveElementsRegistryRef.current.delete(id);
      recompute();
    },
    [recompute],
  );

  const value = useMemo<LayerStackContextValue>(
    () => ({ register, unregister, zIndexById }),
    [register, unregister, zIndexById],
  );

  return <LayerStackContext.Provider value={value}>{children}</LayerStackContext.Provider>;
}

export function useLayerStack() {
  const context = useContext(LayerStackContext);
  if (!context) {
    throw new Error('useLayerStack must be used within a LayerStackProvider');
  }
  return context;
}
