import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '../config/supabaseClient';
import logo from '../logo/logo.svg';
import skillscenter from '../logo/skillscenter.jpg';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Users, 
  Copy, 
  Check, 
  Search, 
  Download, 
  Loader2,
  QrCode,
  X,
  FileText,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Info,
  FileSpreadsheet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ALGERIAN_ARABIC_MONTHS = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function SessionDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [deletingParticipant, setDeletingParticipant] = useState(false);
  const [participantDeleteError, setParticipantDeleteError] = useState('');

  const qrContainerRef = useRef(null);
  const studentFormUrl = `${window.location.origin}/attend/${id}`;

  useEffect(() => {
    fetchSessionData();
  }, [id]);

  useEffect(() => {
    if (workshop?.title) {
      document.title = `${workshop.title} | Algérie Télécom`;
    } else {
      document.title = `${t("Session Detail")} | Algérie Télécom`;
    }
  }, [workshop, i18n.language, t]);

  const fetchSessionData = async () => {
    setLoading(true);

    const { data: formationData } = await supabase
      .from('formations')
      .select('*')
      .eq('id', id)
      .single();

    const { data: presencesData } = await supabase
      .from('presences')
      .select('*')
      .eq('formation_id', id)
      .order('id', { ascending: false });

    setWorkshop(formationData);
    setAttendees(presencesData || []);
    setLoading(false);
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

  const formatSessionDate = (dateStr, timeStr) => {
    if (!dateStr) return t('Date TBD');

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
      if (isNaN(parsedDate.getTime())) return t('Date TBD');
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
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const cleanTime = formatTimeDisplay(timeStr);
    return cleanTime ? `${formattedDate} ${t('at')} ${cleanTime}` : formattedDate;
  };

  const formatSessionDateFrench = (dateStr, timeStr) => {
    if (!dateStr) return 'À déterminer';

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
      if (isNaN(parsedDate.getTime())) return 'À déterminer';
      year = parsedDate.getFullYear();
      month = parsedDate.getMonth() + 1;
      day = parsedDate.getDate();
    }

    const dateObj = new Date(year, month - 1, day);
    const formattedDate = dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const cleanTime = formatTimeDisplay(timeStr);
    return cleanTime ? `${formattedDate} à ${cleanTime}` : formattedDate;
  };

  const isWorkshopEnded = (dateStr, timeStr) => {
    if (!dateStr) return false;

    try {
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
        if (isNaN(parsedDate.getTime())) return false;
        year = parsedDate.getFullYear();
        month = parsedDate.getMonth() + 1;
        day = parsedDate.getDate();
      }

      let hours = 23, minutes = 59, seconds = 59;

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
      console.error('Erreur de calcul du statut de l\'atelier:', err);
      return false;
    }
  };

  const hasEnded = isWorkshopEnded(workshop?.date, workshop?.time);

  const confirmDeleteSession = async () => {
    setDeleting(true);
    setDeleteError('');

    try {
      await supabase.from('presences').delete().eq('formation_id', id);

      const { error } = await supabase
        .from('formations')
        .delete()
        .eq('id', id);

      if (error) {
        setDeleteError(error.message);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteParticipant = async () => {
    if (!participantToDelete) return;

    setDeletingParticipant(true);
    setParticipantDeleteError('');

    try {
      const { error } = await supabase
        .from('presences')
        .delete()
        .eq('id', participantToDelete.id);

      if (error) {
        setParticipantDeleteError(error.message);
      } else {
        setAttendees((prev) => prev.filter((student) => student.id !== participantToDelete.id));
        setParticipantToDelete(null);
      }
    } catch (err) {
      setParticipantDeleteError(err.message);
    } finally {
      setDeletingParticipant(false);
    }
  };

  const getLogoBase64 = (cornerRadius = 10) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = logo;
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const width = img.width || 60;
        const height = img.height || 40;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(0, 0, width, height, cornerRadius);
        } else {
          ctx.moveTo(cornerRadius, 0);
          ctx.arcTo(width, 0, width, height, cornerRadius);
          ctx.arcTo(width, height, 0, height, cornerRadius);
          ctx.arcTo(0, height, 0, 0, cornerRadius);
          ctx.arcTo(0, 0, width, 0, cornerRadius);
          ctx.closePath();
        }
        ctx.clip();

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
    });
  };

  const copyDirectLink = () => {
    navigator.clipboard.writeText(studentFormUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const svgElement = qrContainerRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const context = canvas.getContext('2d');
      
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, 500, 500);

      const png = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = png;
      downloadLink.download = `atelier_${id}_qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URLObject.revokeObjectURL(blobURL);
    };

    image.src = blobURL;
  };

  const exportPDF = async () => {
    const doc = new jsPDF();
    let startY = 15;

    const logoBase64 = await getLogoBase64();
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 85, startY, 40, 16);
      startY += 22;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    
    startY += 7;
    doc.setFontSize(13);
    doc.text('REGISTRE OFFICIEL DE PRÉSENCE', 105, startY, { align: 'center' });

    startY += 6;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, startY, 196, startY);

    startY += 8;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('DÉTAILS DE LA FORMATION', 14, startY);

    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'normal');

    startY += 6;
    doc.text(`• Nom de la formation: ${workshop?.title || 'N/A'}`, 14, startY);
    startY += 6;
    doc.text(`• Formateur: ${workshop?.trainer_name || 'Non assigné'}`, 14, startY);
    startY += 6;
    
    const formattedDateFr = formatSessionDateFrench(workshop?.date, workshop?.time);
    doc.text(`• Date: ${formattedDateFr}`, 14, startY);
    startY += 6;
    doc.text(`• Lieu: ${workshop?.location || 'N/A'}`, 14, startY);
    startY += 6;

    if (workshop?.description) {
      const splitDesc = doc.splitTextToSize(`• Description: ${workshop.description}`, 180);
      doc.text(splitDesc, 14, startY);
      startY += (splitDesc.length * 5);
    }

    startY += 4;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('LISTE DES PARTICIPANTS', 14, startY);

    const tableRows = attendees.map((student, index) => [
      index + 1,
      student.full_name || 'N/A',
      student.email || 'N/A',
      student.phone || 'N/A',
      student.status || 'Participant'
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [['#', 'Nom Complet', 'Adresse e-mail', 'Téléphone', 'Statut / Rôle']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9,
        lineWidth: 0.3,
        lineColor: [0, 0, 0]
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [0, 0, 0],
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      alternateRowStyles: {
        fillColor: false
      },
      margin: { left: 14, right: 14 }
    });

    let finalY = (doc.lastAutoTable?.finalY || 120) + 8;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total des participants: ${attendees.length}`, 14, finalY);

    finalY += 10;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('REMARQUES ET OBSERVATIONS DU FORMATEUR', 14, finalY);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([2, 2], 0);
    
    finalY += 8;
    doc.line(14, finalY, 196, finalY);
    finalY += 8;
    doc.line(14, finalY, 196, finalY);
    finalY += 8;
    doc.line(14, finalY, 196, finalY);

    doc.setLineDashPattern([], 0);

    finalY += 12;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('SIGNATURES ET CACHETS', 14, finalY);

    finalY += 6;

    doc.rect(14, finalY, 85, 28);
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Signature du formateur', 18, finalY + 6);

    doc.rect(111, finalY, 85, 28);
    doc.text('Signature et cachet du directeur', 115, finalY + 6);

    doc.save(`${workshop?.title || 'atelier'}_Registre_Officiel_Presence.pdf`);
  };

  const filteredAttendees = attendees.filter((a) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      a.full_name?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.phone?.toLowerCase().includes(term) ||
      a.status?.toLowerCase().includes(term) ||
      a.reason?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-600 transition-all bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md"
          >
            <ArrowLeft size={15} /> {t("Back to Dashboard")}
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-5 relative overflow-hidden">
          <div className="absolute top-6 right-6 rtl:right-auto rtl:left-6">
            {hasEnded ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <CheckCircle2 size={13} className="text-slate-500" />
                {t("Ended")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Clock size={13} className="text-emerald-600" />
                {t("Upcoming")}
              </span>
            )}
          </div>

          <div className="mb-2">
            <img src={skillscenter} alt="Logo" className="h-24 sm:h-28 rounded-4xl w-auto object-contain" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 capitalize tracking-tight max-w-2xl">
            {workshop?.title || t('Loading Session...')}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100">
              <User size={16} className="text-emerald-600 shrink-0" />
              <span>{t("Trainer")}: <strong className="text-slate-900">{workshop?.trainer_name || t('Unassigned')}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100">
              <Calendar size={16} className="text-emerald-600 shrink-0" />
              <span>{formatSessionDate(workshop?.date, workshop?.time)}</span>
            </div>

            {workshop?.location && (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-100">
                <MapPin size={16} className="text-emerald-600 shrink-0" />
                <span>{workshop.location}</span>
              </div>
            )}
          </div>

          {workshop?.description && (
            <div className="w-full max-w-2xl bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-600 text-left rtl:text-right leading-relaxed flex items-start gap-3">
              <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 w-full">
                <span className="font-bold text-slate-800 block">{t("Description")}:</span>
                <p className="whitespace-pre-line text-slate-600 leading-relaxed">{workshop.description}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4 border-t border-slate-100 w-full max-w-2xl">
            <button
              onClick={copyDirectLink}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-xl text-xs transition-all border border-slate-200 cursor-pointer"
              title={t("Copy Link")}
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? t('Copied Link') : t('Copy Link')}</span>
            </button>

            <button
              onClick={() => setShowQRModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              title={t("Show QR")}
            >
              <QrCode size={14} />
              <span>{t("Show QR")}</span>
            </button>

            <button
              onClick={downloadQRCode}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
              title={t("Save QR")}
            >
              <Download size={14} />
              <span>{t("Save QR")}</span>
            </button>

            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              title={t("Export PDF")}
            >
              <FileText size={14} />
              <span>{t("Export PDF")}</span>
            </button>

            <button
              onClick={() => {
                setDeleteError('');
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center gap-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold px-4 py-2 rounded-xl text-xs transition-all border border-rose-200/80 cursor-pointer"
              title={t("Delete Workshop")}
            >
              <Trash2 size={14} />
              <span>{t("Delete")}</span>
            </button>
          </div>
        </div>

        <div className="hidden" ref={qrContainerRef}>
          <QRCodeSVG value={studentFormUrl} size={500} level="H" includeMargin={true} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{t("List of Participants")}</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200/60">
              <Users size={14} />
              {attendees.length}
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="......................"
                  className="w-full pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-2xs"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 bg-white">
                <Loader2 size={26} className="animate-spin text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">{t("Loading participant register...")}</p>
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="text-center py-14 px-4 bg-white flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                  <Users size={22} />
                </div>
                <p className="text-xs font-bold text-slate-800">{t("No registered attendees found")}</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {searchTerm ? `${t('No results match')} "${searchTerm}".` : t('Share the QR code or direct link with participants to collect signatures.')}
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full table-fixed text-left rtl:text-right text-xs min-w-[650px]">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold border-b border-slate-100 tracking-wider">
                    <tr>
                      <th className="p-4 pl-6 w-[20%]">{t("Full Name")}</th>
                      <th className="p-4 w-[23%]">{t("Email Address")}</th>
                      <th className="p-4 w-[16%]">{t("Phone")}</th>
                      <th className="p-4 w-[14%]">{t("Status / Role")}</th>
                      <th className="p-4 w-[17%]">{t("Reason")}</th>
                      <th className="p-4 pr-6 w-[10%] text-center">{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAttendees.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="p-4 pl-6 font-bold text-slate-900 group-hover:text-emerald-700 transition-colors break-words whitespace-normal leading-relaxed">
                          {student.full_name || '—'}
                        </td>

                        <td className="p-4 text-slate-600 break-all whitespace-normal leading-relaxed">
                          {student.email || '—'}
                        </td>

                        <td className="p-4 text-slate-600 break-all whitespace-normal leading-relaxed">
                          {student.phone || '—'}
                        </td>

                        <td className="p-4 break-words whitespace-normal">
                          <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-900 font-bold rounded-lg border border-blue-200/60 text-[11px] break-words">
                            {student.status || t('Participant')}
                          </span>
                        </td>

                        <td className="p-4 text-slate-600 break-words whitespace-normal leading-relaxed">
                          {student.reason || '—'}
                        </td>

                        <td className="p-4 pr-6 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setParticipantDeleteError('');
                              setParticipantToDelete(student);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title={t("Delete Participant")}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showQRModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden text-center relative border border-slate-200/80">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">{t("Attendance QR Code")}</h3>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-md">
                <QRCodeSVG value={studentFormUrl} size={210} level="H" includeMargin={true} />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 max-w-xs line-clamp-1">
                  {workshop?.title}
                </p>
                <p className="text-xs text-slate-500">
                  {t("Scan with mobile camera to submit presence.")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full pt-2">
                <button
                  onClick={copyDirectLink}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl text-xs transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? t('Copied') : t('Copy Link')}</span>
                </button>

                <button
                  onClick={downloadQRCode}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} />
                  <span>{t("Save Image")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{t("Delete Workshop?")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("Are you sure you want to delete")} <strong className="text-slate-800">"{workshop?.title}"</strong>? {t("This action cannot be undone.")}
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
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteSession}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-50"
              >
                {deleting ? t("Deleting...") : t("Yes, Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {participantToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{t("Delete Participant?")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("Are you sure you want to remove")} <strong className="text-slate-800">"{participantToDelete.full_name || participantToDelete.email}"</strong> {t("from this session?")}
              </p>
            </div>

            {participantDeleteError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs text-left">
                {participantDeleteError}
              </div>
            )}

            <div className="flex gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={() => setParticipantToDelete(null)}
                disabled={deletingParticipant}
                className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteParticipant}
                disabled={deletingParticipant}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-50"
              >
                {deletingParticipant ? t("Deleting...") : t("Yes, Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}