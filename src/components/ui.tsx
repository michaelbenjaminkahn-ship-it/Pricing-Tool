import { useEffect, useRef, useState, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Small form/layout primitives shared across the app.
// ---------------------------------------------------------------------------

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm print-block ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between px-4 pt-3.5 pb-1">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

const inputBase =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

export function TextInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputBase} ${className}`}
    />
  );
}

/**
 * Number input that tolerates in-progress typing ("2.", "-") without fighting
 * the caret, and renders 0/null as empty. `nullable` emits null for empty
 * instead of 0.
 */
export function NumInput({
  value,
  onChange,
  nullable = false,
  prefix,
  suffix,
  placeholder,
  step,
  align = 'right',
  className = '',
}: {
  value: number | null;
  onChange: (v: number) => void;
  nullable?: boolean;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  step?: number;
  align?: 'left' | 'right';
  className?: string;
}) {
  const toText = (v: number | null) => (v == null || v === 0 ? '' : String(v));
  const [text, setText] = useState(toText(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(toText(value));
  }, [value]);

  const emit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (raw.trim() === '' || Number.isNaN(parsed)) {
      onChange(nullable ? (null as unknown as number) : 0);
    } else {
      onChange(parsed);
    }
  };

  return (
    <div className={`relative flex items-center min-w-0 ${className}`}>
      {prefix && <span className="absolute left-2 text-xs text-slate-400 pointer-events-none">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        value={text}
        step={step}
        placeholder={placeholder}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          setText(toText(value));
        }}
        onChange={e => {
          setText(e.target.value);
          emit(e.target.value);
        }}
        className={`${inputBase} num ${align === 'right' ? 'text-right' : ''} ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-9' : ''}`}
      />
      {suffix && <span className="absolute right-2 text-xs text-slate-400 pointer-events-none">{suffix}</span>}
    </div>
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`${inputBase} ${className}`}>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Dropdown over a managed pick-list, with an inline "＋ Add…" escape hatch so
 * a new supplier/customer/port can be added without leaving the deal. The
 * current value is always present in the list, even if it came from old data.
 */
export function ComboSelect({
  value,
  onChange,
  options,
  onAdd,
  addLabel = 'Add new…',
  placeholder = 'Select…',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  onAdd?: (v: string) => void;
  addLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  const all = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select
      value={value}
      onChange={e => {
        if (e.target.value === '__add__') {
          const name = prompt(addLabel)?.trim();
          if (name) {
            onAdd?.(name);
            onChange(name);
          }
          return;
        }
        onChange(e.target.value);
      }}
      className={`${inputBase} ${className}`}
    >
      {!value && <option value="">{placeholder}</option>}
      {all.map(o => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
      {onAdd && <option value="__add__">＋ {addLabel}</option>}
    </select>
  );
}

/** Overflow menu — keeps secondary actions off the header. */
export function Menu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" onClick={() => setOpen(o => !o)} title="More actions">
        ⋯
      </Button>
      {open && (
        <div className="absolute right-0 mt-1 z-20 w-44 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 ${
                item.danger ? 'text-rose-600' : 'text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Pill-style segmented control (used for incoterm, shipping type, etc.) */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-0.5">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-xs font-medium text-slate-700">{label}</span>
      </label>
      {checked && children && <div className="mt-2">{children}</div>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  className = '',
  title,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  title?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent shadow-sm',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-sm',
    ghost: 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent',
    danger: 'bg-white text-rose-600 hover:bg-rose-50 border border-slate-300 shadow-sm',
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

/** GP% chip with margin-quality color. */
export function GpPill({ gp }: { gp: number | null }) {
  if (gp == null) return <span className="text-xs text-slate-400">—</span>;
  const tone =
    gp < 0
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : gp < 5
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return (
    <span className={`num inline-block rounded-full border px-1.5 py-0.5 text-[11px] font-semibold ${tone}`}>
      {gp.toFixed(1)}%
    </span>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[88vh] flex flex-col`}
        >
          <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
