import { Children, cloneElement, ComponentPropsWithRef, isValidElement, ReactElement } from 'react';

type SvgProps = ComponentPropsWithRef<'svg'>;

export type IconProps = SvgProps & {
  isFunctional?: boolean;
};

export function Icon(props: IconProps) {
  const { children, isFunctional = false, 'aria-hidden': ariaHidden, focusable, role, ...rest } = props;

  const ariaHiddenValue = ariaHidden ?? (isFunctional ? 'true' : 'false');
  const focusableValue = focusable ?? (isFunctional ? 'false' : 'true');
  const roleValue = role ?? (isFunctional ? undefined : 'img');

  const child = Children.only(children);

  if (!isValidElement(child)) {
    throw new Error('Icon component expects a single child element');
  }

  const svg = cloneElement(child as ReactElement<SvgProps>, {
    'aria-hidden': ariaHiddenValue,
    focusable: focusableValue,
    role: roleValue,
    ...rest,
  });

  return svg;
}
