import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import Navbar from './Navbar';
import skillscenter from '../logo/skillscenter.jpg';
import logo from '../logo/logo.svg';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Search, 
  X, 
  Calendar, 
  MapPin, 
  User, 
  BookOpen, 
  Globe,
  Users,
  Eye,
  AlertCircle,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ALGERIAN_ARABIC_MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState(null);
  const [importErrorMsg, setImportErrorMsg] = useState(null);

  useEffect(() => {
    fetchFormations();
  }, []);

  useEffect(() => {
    document.title = `${t("Dashboard")} | Algérie Télécom`;
  }, [i18n.language, t]);

  const fetchFormations = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('formations')
        .select('*, presences(id)')
        .order('id', { ascending: false });

      if (error) {
        console.error('Erreur de récupération des formations:', error);
        setFetchError(error.message);
      } else {
        setFormations(data || []);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    const match = String(timeStr).match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const hours = match[1].padStart(2, '0');
      const minutes = match[2];
      return `${hours}:${minutes}`;
    }
    return String(timeStr);
  };

  const isWorkshopEnded = (dateStr, timeStr) => {
    if (!dateStr) return false;

    try {
      let year, month, day;

      if (dateStr.includes('-')) {
        const parts = dateStr.slice(0, 10).split('-');
        if (parts[0].length === 4) {
          [year, month, day] = parts.map(Number);
        } else {
          [day, month, year] = parts.map(Number);
        }
      } else if (dateStr.includes('/')) {
        const parts = dateStr.slice(0, 10).split('/');
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

      let hours = 23;
      let minutes = 59;
      let seconds = 59;

      if (timeStr) {
        const timeMatch = String(timeStr).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (timeMatch) {
          hours = parseInt(timeMatch[1], 10);
          minutes = parseInt(timeMatch[2], 10);
          seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
        }
      }

      const workshopStart = new Date(year, month - 1, day, hours, minutes, seconds);

      if (isNaN(workshopStart.getTime())) return false;

      const workshopEndTime = new Date(workshopStart.getTime() + (2 * 60 * 60 * 1000));

      return workshopEndTime < new Date();
    } catch (err) {
      console.error('Erreur de calcul du statut:', err);
      return false;
    }
  };

  const totalCount = formations.length;
  const endedCount = formations.filter((f) => isWorkshopEnded(f.date, f.time)).length;
  const upcomingCount = totalCount - endedCount;

  const confirmDeleteFormation = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');

    try {
      await supabase.from('presences').delete().eq('formation_id', deleteTarget.id);

      const { error } = await supabase
        .from('formations')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) {
        setDeleteError(error.message);
      } else {
        setFormations((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateFormation = async (e) => {
    e.preventDefault();
    setModalError('');

    if (
      !title.trim() || 
      !description.trim() || 
      !trainerName.trim() || 
      !date || 
      !time || 
      !location.trim()
    ) {
      setModalError(t('Please fill in all required fields before submitting.'));
      return;
    }

    if (date) {
      const selectedYear = new Date(date).getFullYear();
      if (isNaN(selectedYear) || selectedYear < 2024 || selectedYear > 2035) {
        setModalError(t('Please select a valid date between 2024 and 2035.'));
        return;
      }
    }

    if (time) {
      const [hours] = time.split(':').map(Number);
      if (hours < 7 || hours >= 19) {
        setModalError(t('Workshop hours must be scheduled between 07:00 AM and 07:00 PM.'));
        return;
      }
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('formations').insert([
        {
          title,
          date,
          time,
          trainer_name: trainerName,
          location,
          description,
          trainer_id: user?.id || null,
        },
      ]);

      if (!error) {
        setTitle('');
        setDate('');
        setTime('');
        setTrainerName('');
        setLocation('');
        setDescription('');
        setModalError('');
        setShowCreateModal(false);
        fetchFormations();
      } else {
        setModalError(t('Error creating workshop') + ': ' + error.message);
      }
    } catch (err) {
      setModalError(t('Error creating workshop') + ': ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const parseExcelDate = (val) => {
    if (val === undefined || val === null || val === '') return null;

    if (val instanceof Date) {
      if (isNaN(val.getTime())) return null;
      const shifted = new Date(val.getTime() + 12 * 60 * 60 * 1000);
      const year = shifted.getUTCFullYear();
      const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
      const day = String(shifted.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    if (typeof val === 'number') {
      const utcMs = Math.round((val - 25569) * 86400 * 1000) + (12 * 60 * 60 * 1000);
      const date = new Date(utcMs);
      if (isNaN(date.getTime())) return null;
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const str = String(val).trim();
    if (!str) return null;

    const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    const euMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (euMatch) {
      const [, d, m, y] = euMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    return str;
  };

  const parseExcelTime = (val) => {
    if (val === undefined || val === null || val === '') return null;

    if (val instanceof Date) {
      if (isNaN(val.getTime())) return null;
      const isTimeOnly = val.getUTCFullYear() <= 1900;
      const hours = String(isTimeOnly ? val.getUTCHours() : val.getHours()).padStart(2, '0');
      const minutes = String(isTimeOnly ? val.getUTCMinutes() : val.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    if (typeof val === 'number') {
      let timeFraction = val >= 1 ? val % 1 : val;
      const totalSeconds = Math.round(timeFraction * 86400);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    const str = String(val).trim();
    if (!str) return null;

    const colonMatch = str.match(/(\d{1,2}):(\d{2})/);
    if (colonMatch) {
      return `${colonMatch[1].padStart(2, '0')}:${colonMatch[2]}`;
    }

    const hMatch = str.match(/(\d{1,2})[hH](\d{2})?/);
    if (hMatch) {
      const hours = hMatch[1].padStart(2, '0');
      const minutes = hMatch[2] ? hMatch[2] : '00';
      return `${hours}:${minutes}`;
    }

    const dotMatch = str.match(/^(\d{1,2})\.(\d{2})$/);
    if (dotMatch) {
      return `${dotMatch[1].padStart(2, '0')}:${dotMatch[2]}`;
    }

    return str;
  };

  const getFieldValue = (row, keywords) => {
    const keys = Object.keys(row);
    for (const key of keys) {
      const cleanKey = key.trim().toLowerCase();
      if (keywords.some((kw) => cleanKey === kw.toLowerCase())) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') return val;
      }
    }
    for (const key of keys) {
      const cleanKey = key.trim().toLowerCase();
      if (keywords.some((kw) => cleanKey.includes(kw.toLowerCase()))) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') return val;
      }
    }
    return undefined;
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingExcel(true);
    setImportErrorMsg(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rawData.length === 0) {
        setImportErrorMsg(t('The uploaded Excel file is empty.'));
        setUploadingExcel(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const titleKeywords = ['title', 'titre', 'nom', 'atelier', 'formation', 'subject', 'sujet', 'name'];
      const dateKeywords = ['date', 'jour', 'date_session', 'session_date'];
      const timeKeywords = ['time', 'heure', 'horaire', 'horaires', 'start_time', 'time_start', 'debut', 'début'];
      const trainerKeywords = ['trainer', 'formateur', 'instructor', 'animateur', 'teacher', 'enseignant'];
      const locationKeywords = ['location', 'lieu', 'salle', 'room', 'place', 'adresse'];
      const descKeywords = ['description', 'desc', 'détails', 'details', 'summary', 'about'];

      const formattedRows = rawData
        .filter((row) => {
          const rawTitle = getFieldValue(row, titleKeywords);
          return Boolean(rawTitle && String(rawTitle).trim());
        })
        .map((row) => {
          const rawTitle = getFieldValue(row, titleKeywords);
          const rawDate = getFieldValue(row, dateKeywords);
          const rawTime = getFieldValue(row, timeKeywords);
          const rawTrainer = getFieldValue(row, trainerKeywords);
          const rawLocation = getFieldValue(row, locationKeywords);
          const rawDesc = getFieldValue(row, descKeywords);

          return {
            title: String(rawTitle).trim(),
            date: parseExcelDate(rawDate),
            time: parseExcelTime(rawTime),
            trainer_name: rawTrainer ? String(rawTrainer).trim() : '',
            location: rawLocation ? String(rawLocation).trim() : '',
            description: rawDesc ? String(rawDesc).trim() : '',
            trainer_id: user?.id || null,
          };
        });

      if (formattedRows.length === 0) {
        setImportErrorMsg(t('No valid rows with titles found in the uploaded file.'));
        setUploadingExcel(false);
        return;
      }

      const { error } = await supabase.from('formations').insert(formattedRows);

      if (error) throw error;

      setImportSuccessCount(formattedRows.length);
      fetchFormations();
    } catch (err) {
      console.error('Error uploading Excel file:', err);
      setImportErrorMsg(t('Error importing file: ') + err.message);
    } finally {
      setUploadingExcel(false);
      e.target.value = '';
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return t('Date TBD');
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return t('Date TBD');

    const lang = i18n.language || 'fr';

    if (lang.startsWith('ar')) {
      const dayNum = parsed.getDate();
      const monthName = ALGERIAN_ARABIC_MONTHS[parsed.getMonth()];
      const yearNum = parsed.getFullYear();
      return `${dayNum} ${monthName} ${yearNum}`;
    }

    return parsed.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredFormations = formations.filter((f) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      f.title?.toLowerCase().includes(term) ||
      f.trainer_name?.toLowerCase().includes(term) ||
      f.description?.toLowerCase().includes(term);

    const hasEnded = isWorkshopEnded(f.date, f.time);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ended' && hasEnded) ||
      (statusFilter === 'upcoming' && !hasEnded);

    let matchesDate = true;
    if (dateFilter) {
      if (!f.date) {
        matchesDate = false;
      } else {
        const rawDate = f.date.slice(0, 10);
        matchesDate = rawDate === dateFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const isAnyFilterActive = searchTerm !== '' || statusFilter !== 'all' || dateFilter !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header Banner Component */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5 max-w-2xl">
            <img 
              src={skillscenter} 
              alt="Logo Skills Center" 
              className="sm:h-20 sm:w-20 rounded-4xl object-cover shrink-0 border border-slate-100 shadow-xs"
            />
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {t("Formation & Workshop Management")}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                {t("Manage all official corporate training sessions, monitor student sign-in registers, and export session data.")}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end justify-between gap-4 w-full lg:w-auto shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <button
              onClick={() => {
                setModalError('');
                setTitle('');
                setDate('');
                setTime('');
                setTrainerName('');
                setLocation('');
                setDescription('');
                setShowCreateModal(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <Plus size={16} />
              <span>{t("Add New Formation")}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
                <Globe size={13} className="text-slate-500" />
                <span>{t("Total")}: <strong className="text-slate-900">{totalCount}</strong></span>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800">
                <Clock size={13} className="text-emerald-600" />
                <span>{t("Upcoming")}: <strong className="text-emerald-950 font-bold">{upcomingCount}</strong></span>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
                <CheckCircle2 size={13} className="text-slate-500" />
                <span>{t("Ended")}: <strong className="text-slate-800">{endedCount}</strong></span>
              </div>

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

              <a
                href="https://docs.google.com/spreadsheets/d/1tgTz4Z9GHGPs_E8MyzmcENCb82wItINFNupCeUn86iY/edit?gid=1526140983#gid=1526140983"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs hover:shadow-md cursor-pointer no-underline"
                title="Google Sheets"
              >
                <FileSpreadsheet size={14} />
                <span>Google Sheets</span>
              </a>

              <label
                className={`inline-flex items-center justify-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs hover:shadow-md cursor-pointer ${
                  uploadingExcel ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <Upload size={14} />
                <span>{uploadingExcel ? t("Importing...") : t("Import Excel")}</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelImport}
                  className="hidden"
                  disabled={uploadingExcel}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("Search by workshop title or trainer name")}
                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 transition-all text-slate-800 placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto justify-center">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t("Total")}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'upcoming'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t("Upcoming")}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ended')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'ended'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t("Ended")}
              </button>
            </div>

            <div className="relative w-full md:w-auto shrink-0">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full md:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 transition-all"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {isAnyFilterActive && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1.5 whitespace-nowrap cursor-pointer shrink-0"
              >
                {t("Cancel")}
              </button>
            )}

            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 whitespace-nowrap hidden lg:inline-block shrink-0">
              {filteredFormations.length} {filteredFormations.length === 1 ? t('Workshop Available') : t('Workshops Available')}
            </span>
          </div>
        </div>

        {fetchError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs">
            <AlertCircle size={18} className="shrink-0 text-red-600" />
            <p><strong>{t("Error")}:</strong> {fetchError}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-emerald-600 mb-3" />
            <p className="text-slate-500 text-xs font-medium">{t("Loading session database...")}</p>
          </div>
        ) : filteredFormations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3">
              <BookOpen size={26} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {isAnyFilterActive ? t('No matching workshops found') : t('No training sessions available')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {isAnyFilterActive
                ? `${t('No results match')} "${searchTerm || statusFilter || dateFilter}".`
                : t('Click "Add New Formation" above to create your first session register.')}
            </p>
            {isAnyFilterActive && (
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {t("Cancel")}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFormations.map((item) => {
              const registerCount = item.presences?.length || 0;
              const hasEnded = isWorkshopEnded(item.date, item.time);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        {hasEnded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <CheckCircle2 size={11} />
                            {t("Ended")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Clock size={11} />
                            {t("Upcoming")}
                          </span>
                        )}

                        <h2 className="text-base font-bold text-slate-900 capitalize leading-snug line-clamp-2">
                          {item.title || t('Untitled Workshop')}
                        </h2>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200/60 shrink-0">
                        <Users size={13} className="text-emerald-600" />
                        {registerCount}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                        {item.description}
                      </p>
                    )}

                    <div className="h-px w-full bg-slate-100" />

                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-xl shrink-0">
                          <User size={15} />
                        </div>
                        <div className="truncate">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{t("Trainer")}</p>
                          <p className="text-slate-900 font-semibold truncate">
                            {item.trainer_name || t('Unassigned')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <Calendar size={14} className="text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-700 text-[11px] truncate" title={formatDateDisplay(item.date)}>
                            {formatDateDisplay(item.date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <Clock size={14} className="text-emerald-600 shrink-0" />
                          <span className="font-medium text-slate-700 text-[11px] truncate" title={item.time ? formatTimeDisplay(item.time) : t('Time TBD')}>
                            {item.time ? formatTimeDisplay(item.time) : t('Time TBD')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <MapPin size={14} className="text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-700 text-[11px] truncate" title={item.location || t('Location TBD')}>
                          {item.location || t('Location TBD')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center gap-2">
                    <Link
                      to={`/session/${item.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 font-semibold text-slate-800 bg-slate-100 hover:bg-emerald-600 hover:text-white active:bg-emerald-700 py-2.5 px-4 rounded-xl text-xs transition-colors duration-200 cursor-pointer touch-manipulation border border-slate-200/80 hover:border-emerald-600"
                    >
                      <Eye size={15} />
                      <span>{t("View Workshop")}</span>
                    </Link>

                    <button
                      onClick={() => {
                        setDeleteError('');
                        setDeleteTarget({ id: item.id, title: item.title });
                      }}
                      className="inline-flex items-center justify-center p-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white transition-colors duration-200 cursor-pointer border border-rose-200/80 shrink-0"
                      title={t("Delete Workshop")}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative border border-slate-200 my-auto">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold">{t("Create New Workshop")}</h3>
                <p className="text-[11px] text-slate-300">{t("Add a formation program register.")}</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFormation} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t("Workshop Title *")}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="......................"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-slate-50 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t("Description *")}
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="......................"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-slate-50 text-slate-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t("Trainer Name *")}
                </label>
                <input
                  type="text"
                  required
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  placeholder="......................"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-slate-50 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t("Session Date *")}
                  </label>
                  <input
                    type="date"
                    required
                    min="2024-01-01"
                    max="2035-12-31"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-slate-50 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t("Session Time *")}
                  </label>
                  <input
                    type="time"
                    required
                    min="07:00"
                    max="19:00"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t("Location / Room *")}
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="......................"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 bg-slate-50 text-slate-900"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-50"
                >
                  {creating ? t('Saving...') : t('Create Workshop')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{t("Delete Workshop?")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("Are you sure you want to delete")} <strong className="text-slate-800">"{deleteTarget.title}"</strong>? {t("This action cannot be undone.")}
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs text-left">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteFormation}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-50"
              >
                {deleting ? t("Deleting...") : t("Yes, Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {importSuccessCount !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={26} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{t("Import Successful")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("Successfully imported")}{" "}
                <strong className="text-emerald-700 font-bold">{importSuccessCount}</strong>{" "}
                {importSuccessCount === 1 ? t("workshop") : t("workshops")}!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setImportSuccessCount(null)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/20 cursor-pointer"
            >
              {t("OK")}
            </button>
          </div>
        </div>
      )}

      {importErrorMsg !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle size={26} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{t("Import Error")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {importErrorMsg}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setImportErrorMsg(null)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              {t("OK")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}