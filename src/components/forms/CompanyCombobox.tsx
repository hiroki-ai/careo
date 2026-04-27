"use client";

import { useState, useMemo, useRef, useEffect } from "react";

interface Option {
  id: string;
  name: string;
}

interface Props {
  value: string;
  onChange: (name: string, id?: string) => void;
  options: Option[];
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export function CompanyCombobox({ value, onChange, options, label, required, placeholder = "企業名を入力" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options.slice(0, 8);
    const q = query.toLowerCase();
    return options.filter(o => o.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, options]);

  const pick = (o: Option) => {
    setQuery(o.name);
    onChange(o.name, o.id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-64 overflow-y-auto">
          {filtered.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => pick(o)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50 last:border-0"
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
