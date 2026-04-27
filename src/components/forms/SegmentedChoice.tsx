"use client";

interface Option<T extends string> {
  value: T;
  label: string;
  emoji?: string;
  color?: string;
}

interface Props<T extends string> {
  value: T | null | undefined;
  onChange: (v: T) => void;
  options: Option<T>[];
  label?: string;
  required?: boolean;
}

export function SegmentedChoice<T extends string>({ value, onChange, options, label, required }: Props<T>) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, minmax(0, 1fr))` }}>
        {options.map((opt) => {
          const sel = value === opt.value;
          return (
            <button
              type="button"
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 px-2 rounded-xl border-2 text-xs font-medium transition-all ${
                sel
                  ? `border-[#00c896] bg-[#00c896]/10 text-[#00a87e] font-bold`
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {opt.emoji && <span className="text-lg leading-none">{opt.emoji}</span>}
              <span className="leading-tight">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
