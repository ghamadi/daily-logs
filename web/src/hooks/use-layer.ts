'use client';

import { useEffect, useId, useMemo } from 'react';
import { LayerBand, useLayerStack } from '@/components/root-providers/layer-stack-provider';

export function useLayer<TElement extends HTMLElement = HTMLDivElement>(
  band: LayerBand,
  options?: { container?: TElement },
) {
  const { container: inputContainer } = options ?? {};

  const id = useId();
  const { register, unregister, zIndexById } = useLayerStack();

  useEffect(() => {
    register({ id, band });
    return () => unregister(id);
  }, [band, id, register, unregister]);

  const container = useMemo(() => {
    if (typeof document === 'undefined') {
      return null;
    }

    const defaultContainer = document.getElementById(`${band}-layer-root`);
    if (!defaultContainer) {
      throw new Error(`Could not find layer root \`#${band}-layer-root\`.`);
    }

    return (inputContainer ?? defaultContainer) as TElement | null;
  }, [band, inputContainer]);

  return {
    container,
    zIndex: zIndexById[id] ?? 0,
  };
}
