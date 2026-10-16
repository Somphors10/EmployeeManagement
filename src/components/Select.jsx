import { Children, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCheck, IconChevron } from './Icons';

function collectOptions(children) {
  return Children.toArray(children).flatMap((child) => {
    if (!child || child.type !== 'option') return [];
    return [
      {
        value: child.props.value ?? '',
        label: child.props.children,
        disabled: Boolean(child.props.disabled),
      },
    ];
  });
}

export default function Select({
  value,
  onChange,
  children,
  name,
  id,
  disabled = false,
  required = false,
  className = '',
}) {
  const options = useMemo(() => collectOptions(children), [children]);
  const selected = options.find((option) => String(option.value) === String(value)) || options[0];
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});
  const listId = useId();

  function emit(nextValue) {
    onChange?.({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue },
    });
  }

  function placeMenu() {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxHeight = 280;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const openUp = spaceBelow < 160 && rect.top > spaceBelow;
    const width = Math.max(rect.width, 180);
    const left = Math.min(rect.left, window.innerWidth - width - 12);
    setMenuStyle({
      position: 'fixed',
      left: Math.max(12, left),
      width,
      maxHeight,
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
      zIndex: 80,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    const index = Math.max(
      0,
      options.findIndex((option) => String(option.value) === String(value)),
    );
    setActiveIndex(index);
    placeMenu();
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (wrapRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        wrapRef.current?.querySelector('button')?.focus();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex((current) => {
          const next = current < 0 ? 0 : (current + step + options.length) % options.length;
          return next;
        });
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const option = options[activeIndex];
        if (option && !option.disabled) {
          emit(option.value);
          setOpen(false);
        }
      }
    }

    function onReposition(event) {
      if (menuRef.current?.contains(event.target)) return;
      placeMenu();
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, options, activeIndex]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const item = menuRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  return (
    <div
      className={`select ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
      ref={wrapRef}
    >
      <button
        type="button"
        id={id}
        className="select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
          }
        }}
      >
        <span className="select-value">{selected?.label || 'Select'}</span>
        <span className="select-chevron">
          <IconChevron />
        </span>
      </button>
      {name ? <input type="hidden" name={name} value={value ?? ''} required={required} /> : null}
      {open &&
        createPortal(
          <ul
            ref={menuRef}
            id={listId}
            className="select-menu"
            role="listbox"
            style={menuStyle}
            aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          >
            {options.map((option, index) => {
              const isSelected = String(option.value) === String(value);
              return (
                <li key={`${option.value}-${index}`} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    className={`select-option ${isSelected ? 'is-selected' : ''} ${index === activeIndex ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      if (option.disabled) return;
                      emit(option.value);
                      setOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {isSelected ? <IconCheck /> : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
