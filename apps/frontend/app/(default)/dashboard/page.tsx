'use client';

import { ResumeUploadDialog } from '@/components/dashboard/resume-upload-dialog';
import { MasterResumeChoiceDialog } from '@/components/dashboard/master-resume-choice-dialog';
import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { useAuth } from '@/lib/context/auth-context';

import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Settings from 'lucide-react/dist/esm/icons/settings';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Clock from 'lucide-react/dist/esm/icons/clock';

import {
  fetchResume,
  fetchResumeList,
  deleteResume,
  retryProcessing,
  fetchJobDescription,
  type ResumeListItem,
} from '@/lib/api/resume';
import { useStatusCache } from '@/lib/context/status-cache';

type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'loading';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(email: string): string {
  const local = email.split('@')[0];
  const name = local.replace(/[._-]/g, ' ').replace(/\d+/g, '').trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function DashboardPage() {
  const { t, locale } = useTranslations();
  const { user, logout } = useAuth();
  const [masterResumeId, setMasterResumeId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('loading');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tailoredResumes, setTailoredResumes] = useState<ResumeListItem[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isMasterChoiceDialogOpen, setIsMasterChoiceDialogOpen] = useState(false);
  const router = useRouter();

  const {
    status: systemStatus,
    isLoading: statusLoading,
    incrementResumes,
    decrementResumes,
    setHasMasterResume,
  } = useStatusCache();

  const loadRequestIdRef = useRef(0);
  const jobSnippetCacheRef = useRef<Record<string, string>>({});

  const isLlmConfigured = !statusLoading && systemStatus?.llm_configured;
  const isTailorEnabled = Boolean(masterResumeId) && processingStatus === 'ready' && isLlmConfigured;

  const formatDate = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    const dateLocale =
      locale === 'es' ? 'es-ES' : locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : 'en-US';
    return date.toLocaleDateString(dateLocale, { month: 'short', day: '2-digit' });
  };

  const checkResumeStatus = useCallback(async (resumeId: string) => {
    try {
      setProcessingStatus('loading');
      const data = await fetchResume(resumeId);
      const status = data.raw_resume?.processing_status || 'pending';
      setProcessingStatus(status as ProcessingStatus);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('404')) {
        localStorage.removeItem('master_resume_id');
        setMasterResumeId(null);
        return;
      }
      setProcessingStatus('failed');
    }
  }, []);

  useEffect(() => {
    const storedId = localStorage.getItem('master_resume_id');
    if (storedId) {
      setMasterResumeId(storedId);
      checkResumeStatus(storedId);
    } else {
      setProcessingStatus('pending');
    }
  }, [checkResumeStatus]);

  const loadTailoredResumes = useCallback(async () => {
    try {
      const data = await fetchResumeList(true);
      const masterFromList = data.find((r) => r.is_master);
      const storedId = localStorage.getItem('master_resume_id');
      const resolvedMasterId = masterFromList?.resume_id || storedId;

      if (resolvedMasterId) {
        localStorage.setItem('master_resume_id', resolvedMasterId);
        setMasterResumeId(resolvedMasterId);
        checkResumeStatus(resolvedMasterId);
      } else {
        localStorage.removeItem('master_resume_id');
        setMasterResumeId(null);
        setProcessingStatus('pending');
      }

      const filtered = data.filter((r) => r.resume_id !== resolvedMasterId);
      setTailoredResumes(filtered);

      const tailoredWithParent = filtered.filter((r) => r.parent_id);
      const requestId = ++loadRequestIdRef.current;
      const jobSnippets: Record<string, string> = {};

      await Promise.all(
        tailoredWithParent.map(async (r) => {
          if (jobSnippetCacheRef.current[r.resume_id]) {
            jobSnippets[r.resume_id] = jobSnippetCacheRef.current[r.resume_id];
            return;
          }
          try {
            const jd = await fetchJobDescription(r.resume_id);
            const snippet = (jd?.content || '').slice(0, 80);
            jobSnippetCacheRef.current[r.resume_id] = snippet;
            jobSnippets[r.resume_id] = snippet;
          } catch {
            jobSnippetCacheRef.current[r.resume_id] = '';
            jobSnippets[r.resume_id] = '';
          }
        })
      );

      if (requestId === loadRequestIdRef.current) {
        setTailoredResumes((prev) =>
          prev.map((r) => ({ ...r, jobSnippet: jobSnippets[r.resume_id] || '' }))
        );
      }
    } catch (err) {
      console.error('Failed to load tailored resumes:', err);
    }
  }, [checkResumeStatus]);

  useEffect(() => { loadTailoredResumes(); }, [loadTailoredResumes]);

  useEffect(() => {
    const handleFocus = () => loadTailoredResumes();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadTailoredResumes]);

  const handleUploadComplete = (resumeId: string) => {
    localStorage.setItem('master_resume_id', resumeId);
    setMasterResumeId(resumeId);
    checkResumeStatus(resumeId);
    incrementResumes();
    setHasMasterResume(true);
  };

  const handleRetryProcessing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!masterResumeId) return;
    setIsRetrying(true);
    try {
      const result = await retryProcessing(masterResumeId);
      setProcessingStatus(
        result.processing_status === 'ready' ? 'ready' :
        (result.processing_status === 'processing' || result.processing_status === 'pending')
          ? result.processing_status
          : 'failed'
      );
    } catch {
      setProcessingStatus('failed');
    } finally {
      setIsRetrying(false);
    }
  };

  const confirmDeleteAndReupload = async () => {
    if (!masterResumeId) return;
    try {
      await deleteResume(masterResumeId);
      decrementResumes();
      setHasMasterResume(false);
      localStorage.removeItem('master_resume_id');
      setMasterResumeId(null);
      setProcessingStatus('loading');
      setIsUploadDialogOpen(true);
      await loadTailoredResumes();
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  // Derive greeting and name client-side only to avoid SSR hydration mismatch
  // (getTimeGreeting() uses Date.now() and user comes from localStorage/context)
  const [greeting, setGreeting] = useState('');
  const [firstName, setFirstName] = useState('');
  useEffect(() => {
    setGreeting(getTimeGreeting());
    setFirstName(user?.email ? getFirstName(user.email) : 'there');
  }, [user?.email]);

  const tips = [
    "Tailor bullet points to focus on measurable impact — numbers stand out.",
    "Mirror the exact keywords from job posts to pass ATS filters.",
    "Use strong action verbs: 'Architected', 'Spearheaded', 'Scaled'.",
    "Keep your master resume comprehensive; tailored versions should be focused.",
    "Track every application — patterns reveal what's working.",
  ];
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 6000);
    return () => clearInterval(id);
  }, [tips.length]);

  const statusBadge = () => {
    switch (processingStatus) {
      case 'loading':
        return <span className="flex items-center gap-1.5 text-zinc-400 text-xs"><Loader2 className="w-3 h-3 animate-spin" />Checking…</span>;
      case 'processing':
        return <span className="flex items-center gap-1.5 text-blue-400 text-xs"><Loader2 className="w-3 h-3 animate-spin" />Processing</span>;
      case 'ready':
        return <span className="flex items-center gap-1.5 text-emerald-400 text-xs"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Ready</span>;
      case 'failed':
        return <span className="flex items-center gap-1.5 text-red-400 text-xs"><AlertCircle className="w-3 h-3" />Failed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">

      {/* ── Hero Greeting ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-mono text-indigo-400/80 uppercase tracking-widest mb-1">
            {greeting}
          </p>
          <h1 className="text-4xl font-sans font-black text-white tracking-tight">
            {firstName}<span className="gradient-text">.</span>
          </h1>
          <p className="text-white/40 text-sm mt-2 max-w-md">
            {masterResumeId
              ? tailoredResumes.length > 0
                ? `You have ${tailoredResumes.length} tailored resume${tailoredResumes.length > 1 ? 's' : ''} — keep applying.`
                : 'Your master resume is ready. Start tailoring for your next role.'
              : 'Upload your master resume to get started.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {masterResumeId && isLlmConfigured && (
            <button
              onClick={() => router.push('/tailor')}
              disabled={!isTailorEnabled}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-40 disabled:scale-100 shadow-lg shadow-violet-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Tailor Resume
            </button>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2.5 text-white/30 hover:text-white/70 text-sm font-mono transition-colors rounded-xl hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── LLM Warning Banner ────────────────────────────── */}
      {masterResumeId && !isLlmConfigured && !statusLoading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300/70 flex-1">
            Configure your AI provider to enable resume tailoring.
          </p>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </Link>
        </div>
      )}

      {/* ── Master Resume Section ─────────────────────────── */}
      <section className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono text-white/40 uppercase tracking-widest">Master Resume</h2>
          {masterResumeId && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="text-xs font-mono text-white/30 hover:text-white/60 transition-colors"
            >
              Replace
            </button>
          )}
        </div>

        {!masterResumeId ? (
          <button
            onClick={() => setIsMasterChoiceDialogOpen(true)}
            className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl border border-dashed border-white/10 hover:border-indigo-500/40 bg-transparent hover:bg-indigo-500/5 transition-all duration-200 group text-left"
          >
            <div className="w-10 h-10 rounded-xl border border-white/10 group-hover:border-indigo-500/40 bg-white/5 flex items-center justify-center shrink-0 transition-colors">
              <Plus className="w-5 h-5 text-white/30 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/60 group-hover:text-white transition-colors">Upload your master resume</p>
              <p className="text-xs text-white/25 mt-0.5">PDF or build with AI wizard</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 ml-auto transition-colors" />
          </button>
        ) : (
          <button
            onClick={() => router.push(`/resumes/${masterResumeId}`)}
            className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl hover:bg-white/5 transition-all duration-200 group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Master Resume</p>
              <div className="mt-0.5">{statusBadge()}</div>
            </div>
            {processingStatus === 'failed' && (
              <button
                onClick={handleRetryProcessing}
                disabled={isRetrying}
                className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
              >
                {isRetrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Retry
              </button>
            )}
            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
          </button>
        )}
      </section>

      {/* ── Tailored Resumes ──────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Tailored Resumes
            {tailoredResumes.length > 0 && (
              <span className="ml-2 text-zinc-600">({tailoredResumes.length})</span>
            )}
          </h2>
          {isTailorEnabled && (
            <button
              onClick={() => router.push('/tailor')}
              className="flex items-center gap-1.5 text-xs font-mono text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          )}
        </div>

        {tailoredResumes.length === 0 ? (
          <div className="px-6 py-8 text-center rounded-2xl border border-dashed border-white/8">
            <Briefcase className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/25">No tailored resumes yet</p>
            {isTailorEnabled && (
              <button
                onClick={() => router.push('/tailor')}
                className="mt-3 text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 mx-auto"
              >
                Create your first <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-900/60">
            {tailoredResumes.map((resume) => {
              const title = resume.title || resume.jobSnippet || resume.filename || 'Tailored Resume';
              const date = formatDate(resume.updated_at || resume.created_at);
              return (
                <button
                  key={resume.resume_id}
                  onClick={() => router.push(`/resumes/${resume.resume_id}`)}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 transition-all duration-150 group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-400/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 font-medium truncate group-hover:text-white transition-colors">
                      {title}
                    </p>
                    {date && (
                      <p className="text-xs text-white/25 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{date}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-white/40 transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Quick Actions ─────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Applications', icon: Briefcase, href: '/applications', desc: 'Track your pipeline' },
            { label: 'Settings', icon: Settings, href: '/settings', desc: 'AI & preferences' },
          ].map(({ label, icon: Icon, href, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/8 transition-all duration-150 group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-white/30 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white/60 font-medium group-hover:text-white transition-colors">{label}</p>
                <p className="text-xs text-white/25">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Rotating Career Tip ──────────────────────────── */}
      <section
        onClick={() => setTipIndex(i => (i + 1) % tips.length)}
        className="cursor-pointer group"
      >
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-white/6 hover:border-indigo-500/20 transition-colors bg-indigo-500/5">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-mono text-indigo-400/70 uppercase tracking-wider mb-1.5">Career Tip</p>
            <p className="text-sm text-white/50 group-hover:text-white/70 transition-colors leading-relaxed">
              {tips[tipIndex]}
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0 mt-0.5">
            {tipIndex + 1}/{tips.length}
          </span>
        </div>
      </section>

      {/* ── Dialogs ───────────────────────────────────────── */}
      <MasterResumeChoiceDialog
        open={isMasterChoiceDialogOpen}
        onOpenChange={setIsMasterChoiceDialogOpen}
        onChooseUpload={() => { setIsMasterChoiceDialogOpen(false); setIsUploadDialogOpen(true); }}
        onChooseWizard={() => { setIsMasterChoiceDialogOpen(false); router.push('/resume-wizard'); }}
      />
      <ResumeUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
        trigger={<button type="button" className="hidden" tabIndex={-1} aria-hidden="true" />}
      />
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('confirmations.deleteMasterResumeTitle')}
        description={t('confirmations.deleteMasterResumeDescription')}
        confirmLabel={t('dashboard.deleteAndReupload')}
        cancelLabel={t('confirmations.keepResumeCancelLabel')}
        onConfirm={confirmDeleteAndReupload}
        variant="danger"
      />
    </div>
  );
}
