import React, { useEffect, useRef } from 'react';

const getFocusableElements = (element: HTMLElement | null): HTMLElement[] => {
  if (!element) return [];

  const focusableSelectors = [
    'a[href]',
    'button',
    'input',
    'textarea',
    'select',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  return Array.from(element.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
  );
};

interface Props extends React.ComponentPropsWithoutRef<'div'> {
  children: React.ReactElement;
  onEscapeFocusTrap: () => void;
}

const FocusTrap = <T extends HTMLElement>({ children, onEscapeFocusTrap, ...props }: Props) => {
  const focusTrapRef = useRef<T>(null);
  const child = React.Children.only(children);
  const focusableElements = useRef<(HTMLElement | null)[]>([]);
  const currentFocusIndex = useRef(-1);

  useEffect(() => {
    if (focusTrapRef.current) {
      focusableElements.current = getFocusableElements(focusTrapRef.current) as HTMLElement[];
    }

    focusableElements.current[0]?.focus();

    return () => {
      focusableElements.current = [];
    };
  }, []);

  const firstElement = focusableElements.current[0];
  const lastElement = focusableElements.current[focusableElements.current.length - 1];

  useEffect(() => {
    const focusNextElement = () => {
      currentFocusIndex.current =
        (currentFocusIndex.current + 1) % focusableElements.current.length;
      focusableElements.current[currentFocusIndex.current]?.focus();
    };

    const focusPrevElement = () => {
      currentFocusIndex.current =
        (currentFocusIndex.current - 1 + focusableElements.current.length) %
        focusableElements.current.length;
      focusableElements.current[currentFocusIndex.current]?.focus();
    };

    const handleTabKeyDown = (event: KeyboardEvent) => {
      const isTabKeyDown = !event.shiftKey && event.key === 'Tab';
      if (!isTabKeyDown) return;

      event.preventDefault();
      focusNextElement();
    };

    const handleShiftTabKeyDown = (event: KeyboardEvent) => {
      const isShiftTabKeyDown = event.shiftKey && event.key === 'Tab';
      if (!isShiftTabKeyDown) return;

      event.preventDefault();
      focusPrevElement();
    };

    const handleEscapeKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapeFocusTrap();
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      handleTabKeyDown(event);
      handleShiftTabKeyDown(event);
      handleEscapeKeyDown(event);
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [firstElement, lastElement, onEscapeFocusTrap]);

  const Component = React.cloneElement(child, {
    ...{ ...props, ...child?.props },
    ref: focusTrapRef
  });

  return <>{Component}</>;
};

export default FocusTrap;
