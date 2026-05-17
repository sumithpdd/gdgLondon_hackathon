import { PlatformChrome } from "@/components/PlatformChrome";

export default function PastProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformChrome mainClassName="container mx-auto max-w-6xl px-5 sm:px-8 py-10 sm:py-14">
      {children}
    </PlatformChrome>
  );
}
