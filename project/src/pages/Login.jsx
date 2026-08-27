import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import logo from '../logo/logo.svg';
import LanguageSelector from './LanguageSelector';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t, i18n } = useTranslation(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${t("Login")} | Algérie Télécom`;
  }, [i18n.language, t]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20">
        <LanguageSelector />
      </div>

      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 relative z-10">
        <div className="p-8 text-black text-center relative">
          <div className="flex justify-center mb-4">
            <div className="p-2">
              <img src={logo} alt="Algérie Télécom" className="h-24 w-auto object-contain" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-2 font-medium">{t("Sign in to manage training formations and registers")}</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-5 pt-0">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t("Email Address")}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="......................"
                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-700/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t("Password")}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-700/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("Authenticating...")}</span>
              </>
            ) : (
              <>
                <span>{t("Sign In To Admin Portal")}</span>
                <ArrowRight size={16} className="rtl:rotate-180" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}