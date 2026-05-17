import { PlatformChrome } from "@/components/PlatformChrome";

export default function CodeOfConductLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformChrome mainClassName="w-full max-w-3xl mx-auto">
      {children}
    </PlatformChrome>
  );
}
