import { PlatformChrome } from "@/components/PlatformChrome";

export default function CodeOfConductLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformChrome mainClassName="w-full max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {children}
    </PlatformChrome>
  );
}
