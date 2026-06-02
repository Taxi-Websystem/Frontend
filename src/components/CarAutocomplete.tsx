import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { Loader2 } from 'lucide-react';
import { FormFieldSpinner } from './FormFieldSpinner';

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
  profileLoading?: boolean;
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
  hint,
  profileLoading = false
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
      setOpen(false);
      return;
    }

    if (pickedValue && trimmed === value.trim()) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      void search(trimmed)
        .then((searchResults) => {
          const normalizedOptions = searchResults
            .map((option) => normalize(option).trim())
            .filter(Boolean)
            .filter(
              (option, index, allOptions) =>
                allOptions.findIndex((candidate) => candidate.toLowerCase() === option.toLowerCase()) === index
            );
          setOptions(normalizedOptions);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, value, pickedValue, search, disabled]);

  const closeDropdown = useCallback(() => setOpen(false), []);
  useOnClickOutside(wrapRef, closeDropdown);

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
        {profileLoading ? (
          <FormFieldSpinner />
        ) : (
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
              setOpen(next.trim().length >= 2);
            }}
            className="field-input w-full pr-10 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={placeholder}
            autoComplete="off"
            name={`car-field-${listId}`}
            aria-expanded={open}
            aria-controls={listId}
          />
          {loading ? (
            <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </span>
          ) : null}
        </div>
        )}
        {open && options.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-[100] mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0F172A] py-1 shadow-2xl"
          >
            {options.map((option, index) => (
              <li key={`${option}-${index}`}>
                <button
                  type="button"
                  role="option"
                  className="w-full px-4 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10 hover:text-[#EAB308]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(option)}
                >
                  {option}
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
