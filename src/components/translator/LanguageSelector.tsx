import type { SupportedLanguage } from "@/types";

interface LanguageSelectorProps {
  label: string;
  value: SupportedLanguage;
  languages: SupportedLanguage[];
  onChange: (lang: SupportedLanguage) => void;
}

export default function LanguageSelector({
  label,
  value,
  languages,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <label className="text-sm font-medium text-gray-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SupportedLanguage)}
        className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
      >
        {languages.map((lang) => (
          <option key={lang} value={lang} className="capitalize">
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
}
