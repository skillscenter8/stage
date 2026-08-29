import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { LogOut, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '../logo/logo.svg';
import skillscenter from '../logo/skillscenter.jpg';

export default function Navbar() {
  const { t, i18n } = useTranslation();
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    i18n.changeLanguage(langCode.toLowerCase());
    document.documentElement.dir = langCode === 'AR' ? 'rtl' : 'ltr';
    setShowLangDropdown(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img 
                          src={logo} 
                          alt="Logo Algérie Télécom" 
                          className="size-10 w-auto rounded-2xl w-13 h-13 object-contain shrink-0"
                        />
          </div>
          <div className="flex items-center gap-3">
            
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
              >
                <Globe size={15} className="text-emerald-600" />
                <span>{currentLang}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        currentLang === lang.code ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      {lang.label}
                      <span className="text-[10px] text-slate-400 uppercase">{lang.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3.5 py-1.5 rounded-xl transition-all"
            >
              <LogOut size={15} />
              <span>{t("Sign Out")}</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}