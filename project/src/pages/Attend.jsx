import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import logo from '../logo/logo.svg';
import LanguageSelector from './LanguageSelector';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Info,
  Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ⚠️ REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/library/d/1LqFHptiLTHYULa9ZLRf8uN9ZMYnvIUBZQhl7CXJf2p17iXhCXK3xqtVN/3';

const ALGERIAN_ARABIC_MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function Attend() {
  const { t, i18n } = useTranslation();
  const { title } = useParams();
  const [workshop, setWorkshop] = useState(null);
  const [loadingWorkshop, setLoadingWorkshop] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (title) {
      fetchWorkshopDetails();
    }
  }, [title]);

  useEffect(() => {
    if (workshop?.title) {
      document.title = `${workshop.title} - ${t("Attendance Register")} | Algérie Télécom`;
    } else {
      document.title = `${t("Attendance Register")} | Algérie Télécom`;
    }
  }, [workshop, i18n.language, t]);

  const fetchWorkshopDetails = async () => {
    setLoadingWorkshop(true);
    const param = title ? decodeURIComponent(title) : '';

    // Check whether URL param is a numeric ID (e.g. /attend/23) or title text (e.g. /attend/React%20101)
    const isNumericId = /^\d+$/.test(param);

    const { data, error } = await supabase
      .from('formations')
      .select('*')
      .eq(isNumericId ? 'id' : 'title', isNumericId ? parseInt(param, 10) : param)
      .single();

    if (error) {
      console.error('Error fetching workshop details:', error);
      setWorkshop(null);
    } else if (data) {
      setWorkshop(data);
    }
    setLoadingWorkshop(false);
  };

  const checkIsEnded = () => {
    if (!workshop) return false;

    // 1. Explicit DB Status Check
    const statusStr = String(workshop.status || '').toLowerCase().trim();
    if (['ended', 'terminé', 'termine', 'closed', 'completed', 'finished', 'منتهية', 'منتهي'].includes(statusStr)) {
      return true;
    }

    // 2. Automatic Expiration Check (Start time + 2 hour duration window)
    if (workshop.date) {
      try {
        let year, month, day;
        const dateStr = String(workshop.date);

        if (dateStr.includes('-')) {
          const parts = dateStr.slice(0, 10).split('-');
          if (parts[0].length === 4) {
            [year, month, day] = parts.map(Number);
          } else {
            [day, month, year] = parts.map(Number);
          }
        } else {
          const parsedDate = new Date(dateStr);
          if (isNaN(parsedDate.getTime())) return false;
          year = parsedDate.getFullYear();
          month = parsedDate.getMonth() + 1;
          day = parsedDate.getDate();
        }

        let hours = 23, minutes = 59, seconds = 59;
        if (workshop.time) {
          const timeMatch = String(workshop.time).match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            hours = parseInt(timeMatch[1], 10);
            minutes = parseInt(timeMatch[2], 10);
            seconds = 0;
          }
        }

        const workshopStart = new Date(year, month - 1, day, hours, minutes, seconds);
        if (isNaN(workshopStart.getTime())) return false;

        const workshopEndTime = new Date(workshopStart.getTime() + (2 * 60 * 60 * 1000));
        return workshopEndTime < new Date();
      } catch (err) {
        console.error('Erreur d\'évaluation de la date:', err);
      }
    }

    return false;
  };

  const isEnded = checkIsEnded();

  const formatSessionDate = (dateStr, timeStr) => {
    if (!dateStr) return '';

    let year, month, day;
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const parts = dateStr.slice(0, 10).split('-');
      if (parts[0].length === 4) {
        [year, month, day] = parts.map(Number);
      } else {
        [day, month, year] = parts.map(Number);
      }
    } else {
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) return '';
      year = parsedDate.getFullYear();
      month = parsedDate.getMonth() + 1;
      day = parsedDate.getDate();
    }

    const dateObj = new Date(year, month - 1, day);
    const lang = i18n.language || 'fr';

    let formattedDate = '';
    if (lang.startsWith('ar')) {
      const dayName = dateObj.toLocaleDateString('ar-DZ', { weekday: 'long' });
      const monthName = ALGERIAN_ARABIC_MONTHS[month - 1];
      formattedDate = `${dayName}، ${day} ${monthName} ${year}`;
    } else {
      formattedDate = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }

    return timeStr ? `${formattedDate} ${t("at")} ${timeStr}` : formattedDate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEnded) {
      setErrorMsg(t("Sign-ins are now closed for this session. Thank you for your interest!"));
      return;
    }

    if (!workshop?.id) {
      setErrorMsg(t("Workshop session invalid or not loaded."));
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    // 1. Insert into Supabase
    const { error } = await supabase.from('presences').insert([
      {
        formation_id: workshop.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status: status.trim(),
        reason: reason.trim(),
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
    } else {
      // 2. Direct Sync to Google Sheets
      if (GOOGLE_SHEETS_SCRIPT_URL && GOOGLE_SHEETS_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        try {
          await fetch(GOOGLE_SHEETS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              table: 'presences',
              workshop_title: workshop?.title || '',
              full_name: fullName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              status: status.trim(),
              reason: reason.trim(),
              created_at: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error("Google Sheets Sync Error:", err);
        }
      }

      setSubmitted(true);
    }

    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20">
          <LanguageSelector />
        </div>
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-slate-200/80 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t("Attendance Recorded!")}</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t("Your registration for")} <strong className="text-slate-900">{workshop?.title || t('the workshop')}</strong> {t("has been submitted successfully.")}
          </p>
        </div>
      </div>
    );
  }

  // Display dedicated "Workshop Ended" message screen when ended
  if (!loadingWorkshop && isEnded) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12 flex flex-col justify-center items-center p-4 relative">
        <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20">
          <LanguageSelector />
        </div>

        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/80 p-8 text-center space-y-5">
          <div className="flex justify-center mb-1">
            <img 
              src={logo} 
              alt="Algérie Télécom" 
              className="h-20 w-auto object-contain"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-slate-900 capitalize">
              {workshop?.title}
            </h2>
            {workshop?.date && (
              <p className="text-xs text-slate-500 font-medium capitalize">
                {formatSessionDate(workshop.date, workshop.time)}
              </p>
            )}
          </div>

          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
            <Clock size={32} />
          </div>

          <div className="space-y-2 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60">
            <h1 className="text-lg font-extrabold text-amber-900">
              {t("This workshop has ended")}
            </h1>
            <p className="text-xs text-amber-800 leading-relaxed">
              {t("Sign-ins are now closed for this session. Thank you for your interest!")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12 flex flex-col justify-center items-center p-4 relative">
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20">
        <LanguageSelector />
      </div>

      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/80">
        <div className="p-6 text-center space-y-3">
          <div className="flex justify-center mb-5">
            <img 
              src={logo} 
              alt="Algérie Télécom" 
              className="h-24 w-auto object-contain"
            />
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-bold">
            <Sparkles size={12} /> {t("Welcome to this Workshop")}
          </div>

          {loadingWorkshop ? (
            <div className="flex justify-center items-center gap-2 text-xs text-slate-500 py-2">
              <Loader2 size={16} className="animate-spin text-emerald-500" />
              <span>{t("Loading workshop details...")}</span>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <h1 className="text-xl font-extrabold text-slate-900 capitalize tracking-tight">
                {workshop?.title || t('Workshop Sign-In')}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold text-slate-600">
                {workshop?.trainer_name && (
                  <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-700">
                    <User size={13} className="text-emerald-600 shrink-0" />
                    <span>{workshop.trainer_name}</span>
                  </span>
                )}
                {workshop?.date && (
                  <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-700 capitalize">
                    <Calendar size={13} className="text-emerald-600 shrink-0" />
                    <span>{formatSessionDate(workshop.date, workshop.time)}</span>
                  </span>
                )}
                {workshop?.location && (
                  <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-700">
                    <MapPin size={13} className="text-emerald-600 shrink-0" />
                    <span>{workshop.location}</span>
                  </span>
                )}
              </div>

              {workshop?.description && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 text-left rtl:text-right leading-relaxed flex items-start gap-2.5">
                  <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">{t("Description")}:</span>
                    <p className="whitespace-pre-line">{workshop.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t("Full Name *")}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="......................"
                className="w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t("Email Address *")}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="......................"
                className="w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t("Phone Number")}
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="......................"
                className="w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t("Status / Function")}
            </label>
            <div className="relative">
              <Briefcase size={16} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="......................"
                className="w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t("Reason / Motivation")}
            </label>
            <div className="relative">
              <FileText size={16} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3 text-slate-400" />
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="......................"
                className="w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("CONFIRMING...")}</span>
              </>
            ) : (
              <span>{t("CONFIRM ATTENDANCE")}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}