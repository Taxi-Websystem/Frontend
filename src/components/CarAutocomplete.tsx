import { useEffect, useId, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CarAutocompleteProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  search: (query: string) => Promise<string[]>;
  normalize?: (value: string) => string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}

export default function CarAutocomplete({
  label,
  value,
  onChange,
  search,
  normalize = (v) => v,
  disabled,
  required,
  placeholder,
  hint
}: CarAutocompleteProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [pickedValue, setPickedValue] = useState<string | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (disabled) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setOptions([]);
      return;
    }

    if (pickedValue && trimmed === value.trim()) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      void search(trimmed)
        .then((rows) => {
          const normalizedRows = rows
            .map((row) => normalize(row).trim())
            .filter(Boolean)
            .filter((row, index, arr) => arr.findIndex((x) => x.toLowerCase() === row.toLowerCase()) === index);
          setOptions(normalizedRows);
          setOpen(normalizedRows.length > 0);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, value, pickedValue, search, disabled]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (option: string) => {
    const normalized = normalize(option).trim();
    setQuery(normalized);
    setPickedValue(normalized);
    setOptions([]);
    onChange(normalized);
    setOpen(false);
  };

  return (
    <label className="mb-1 block text-sm font-medium text-slate-300">
      {label}
      <div ref={wrapRef} className="relative mt-2">
        <div className="relative">
          <input
            required={required}
            type="text"
            disabled={disabled}
            value={query}
            onChange={(event) => {
              const next = normalize(event.target.value);
              setQuery(next);
              setPickedValue(null);
              onChange(next);
              setOpen(true);
            }}
            onFocus={() => {
              if (options.length > 0) setOpen(true);
            }}
            className="field-input w-full pr-10 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={placeholder}
            autoComplete="off"
            aria-expanded={open}
            aria-controls={listId}
          />
          {loading ? (
            <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </span>
          ) : null}
        </div>
        {open && options.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-[100] mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0F172A] py-1 shadow-2xl"
          >
            {options.map((row, index) => (
              <li key={`${row}-${index}`}>
                <button
                  type="button"
                  role="option"
                  className="w-full px-4 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10 hover:text-[#EAB308]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(row)}
                >
                  {row}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </label>
  );
}
