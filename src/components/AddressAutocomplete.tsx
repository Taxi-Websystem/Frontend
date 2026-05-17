import { useEffect, useId, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { searchLvivStreets, type AddressSelection } from '../utils/geo';

interface AddressAutocompleteProps {
  label: string;
  value: string;
  latitude: number | null;
  longitude: number | null;
  onChange: (next: AddressSelection | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function AddressAutocomplete({
  label,
  value,
  latitude,
  longitude,
  onChange,
  disabled,
  placeholder
}: AddressAutocompleteProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<AddressSelection[]>([]);

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

    if (trimmed === value.trim() && latitude != null && longitude != null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchLvivStreets(trimmed)
        .then((rows) => {
          setOptions(rows);
          setOpen(rows.length > 0);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, value, latitude, longitude, disabled]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (row: AddressSelection) => {
    setQuery(row.displayName);
    onChange(row);
    setOpen(false);
  };

  return (
    <label className="relative block text-sm font-medium text-slate-300">
      {label}
      <div ref={wrapRef} className="relative mt-2">
        <div className="relative">
          <input
            type="text"
            disabled={disabled}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              onChange(null);
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
              <li key={`${row.displayName}-${index}`}>
                <button
                  type="button"
                  role="option"
                  className="w-full px-4 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10 hover:text-[#EAB308]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(row)}
                >
                  {row.displayName}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </label>
  );
}
