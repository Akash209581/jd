import { ResumePreviewProvider } from '@/components/common/resume_previewer_context';
import { LocalizedErrorBoundary } from '@/components/common/error-boundary';

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResumePreviewProvider>
      <LocalizedErrorBoundary>
        <main className="min-h-screen flex flex-col">{children}</main>
      </LocalizedErrorBoundary>
    </ResumePreviewProvider>
  );
}
