import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState('FR');
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  useEffect(() => {
    const langCode = i18n.language ? i18n.language.toUpperCase() : 'FR';
    setCurrentLang(langCode);
    document.documentElement.dir = langCode === 'AR' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const languages = [
    { code: 'FR', label: 'Français' },
    { code: 'AR', label: 'العربية' },
    { code: 'EN', label: 'English' },
  ];

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    i18n.changeLanguage(langCode.toLowerCase());
    document.documentElement.dir = langCode === 'AR' ? 'rtl' : 'ltr';
    setShowLangDropdown(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setShowLangDropdown(!showLangDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white/90 backdrop-blur-md hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all shadow-xs cursor-pointer"
      >
        <Globe size={14} className="text-emerald-600 shrink-0" />
        <span>{currentLang}</span>
        <ChevronDown size={13} className="text-slate-400 shrink-0" />
      </button>

      {showLangDropdown && (
        <div className="absolute right-0 ltr:right-0 rtl:left-0 mt-2 w-36 bg-white border border-slate-200/80 rounded-xl shadow-lg py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left ltr:text-left rtl:text-right px-4 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                currentLang === lang.code ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-700'
              }`}
            >
              <span>{lang.label}</span>
              <span className="text-[10px] text-slate-400 uppercase">{lang.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}