import { useEffect, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react';

/**
 * While `active`, calls `onDismiss` on Escape or on a pointer press outside `ref`. Listeners are only
 * attached while active; no state is set inside the effect itself.
 */
export function useDismiss(ref: RefObject<HTMLElement | null>, active: boolean, onDismiss: () => void): void {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onDismiss();
    };
    const onPointerDown = (event: PointerEvent | MouseEvent): void => {
      const target = event.target;
      if (target instanceof Node && ref.current && !ref.current.contains(target)) onDismiss();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [ref, active, onDismiss]);
}

/** Moves focus between `[role^="menuitem"]` elements inside `menu` with ArrowUp/ArrowDown/Home/End. */
export function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLElement>): void {
  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
  );
  if (items.length === 0) return;
  const index = items.indexOf(document.activeElement as HTMLElement);
  let next: number | null = null;
  switch (event.key) {
    case 'ArrowDown':
      next = index < 0 ? 0 : (index + 1) % items.length;
      break;
    case 'ArrowUp':
      next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = items.length - 1;
      break;
    default:
      return;
  }
  event.preventDefault();
  items[next].focus();
}
