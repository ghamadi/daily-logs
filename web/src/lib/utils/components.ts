import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names together, removing duplicates and resolving conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Merges a wrapper component with its units, allowing for a compound component pattern.
 */
export function composeCompoundComponent<TWrapper extends object, TUnits extends object>(
  wrapper: TWrapper,
  units: TUnits,
) {
  const CompoundComponent = Object.assign(wrapper, units);
  return CompoundComponent as TWrapper & TUnits;
}
