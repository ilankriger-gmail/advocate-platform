'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  KeyboardEvent,
  MouseEvent,
} from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  menuRef: React.RefObject<HTMLDivElement>;
  focusedIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  itemsCount: number;
  registerItem: () => number;
  unregisterItem: (index: number) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu provider');
  }
  return context;
}

export interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenu({ children, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [itemsCount, setItemsCount] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRegistryRef = useRef<Set<number>>(new Set());

  const registerItem = () => {
    const index = itemsCount;
    itemsRegistryRef.current.add(index);
    setItemsCount(prev => prev + 1);
    return index;
  };

  const unregisterItem = (index: number) => {
    itemsRegistryRef.current.delete(index);
    setItemsCount(prev => prev - 1);
  };

  // Click outside detection
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape as any);
    return () => {
      document.removeEventListener('keydown', handleEscape as any);
    };
  }, [isOpen]);

  // Reset focused index when menu closes
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider
      value={{
        isOpen,
        setIsOpen,
        triggerRef,
        menuRef,
        focusedIndex,
        setFocusedIndex,
        itemsCount,
        registerItem,
        unregisterItem,
      }}
    >
      <div className={cn('relative', className)}>{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

export function DropdownMenuTrigger({
  children,
  className,
}: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen, triggerRef, setFocusedIndex } = useDropdownMenuContext();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    // Open menu with Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex(0); // Focus first item when opening with keyboard
    }
    // Arrow down opens and focuses first item
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex(0);
    }
    // Arrow up opens and focuses last item
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex(-1); // Will be handled in menu to focus last
    }
  };

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-haspopup="true"
      aria-expanded={isOpen}
      className={cn(
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full',
        className
      )}
    >
      {children}
    </button>
  );
}

export interface DropdownMenuContentProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

export function DropdownMenuContent({
  children,
  className,
  align = 'right',
}: DropdownMenuContentProps) {
  const { isOpen, menuRef, focusedIndex, setFocusedIndex, itemsCount, setIsOpen, triggerRef } =
    useDropdownMenuContext();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev + 1;
          return next >= itemsCount ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? itemsCount - 1 : next;
        });
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(itemsCount - 1);
        break;
      case 'Tab':
        // Let Tab work naturally to exit the menu
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      onKeyDown={handleKeyDown}
      className={cn(
        'absolute mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1',
        'focus:outline-none',
        align === 'right' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

export function DropdownMenuItem({
  children,
  onClick,
  href,
  className,
  disabled = false,
  variant = 'default',
}: DropdownMenuItemProps) {
  const { focusedIndex, setFocusedIndex, setIsOpen, registerItem, unregisterItem, triggerRef } =
    useDropdownMenuContext();
  const [itemIndex] = useState(() => registerItem());
  const itemRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const isFocused = focusedIndex === itemIndex;

  useEffect(() => {
    return () => {
      unregisterItem(itemIndex);
    };
  }, [itemIndex, unregisterItem]);

  // Focus management
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.focus();
    }
  }, [isFocused]);

  const handleClick = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    onClick?.();
    setIsOpen(false);
    setFocusedIndex(-1);

    // Return focus to trigger after action
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
  };

  const handleMouseEnter = () => {
    setFocusedIndex(itemIndex);
  };

  const baseClassName = cn(
    'w-full text-left px-4 py-2 text-sm transition-colors',
    'focus:outline-none',
    disabled
      ? 'opacity-50 cursor-not-allowed'
      : variant === 'danger'
      ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
      : 'text-gray-700 hover:bg-gray-50 focus:bg-gray-50',
    className
  );

  const commonProps = {
    ref: itemRef as any,
    role: 'menuitem',
    tabIndex: isFocused ? 0 : -1,
    disabled,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    onMouseEnter: handleMouseEnter,
    'aria-disabled': disabled,
  };

  if (href && !disabled) {
    return (
      <a
        {...commonProps}
        href={href}
        className={cn('block', baseClassName)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      {...commonProps}
      type="button"
      className={baseClassName}
    >
      {children}
    </button>
  );
}

export interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <hr
      role="separator"
      className={cn('my-1 border-t border-gray-200', className)}
    />
  );
}

export interface DropdownMenuLabelProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <div
      className={cn(
        'px-4 py-2 border-b border-gray-100',
        className
      )}
    >
      {children}
    </div>
  );
}
