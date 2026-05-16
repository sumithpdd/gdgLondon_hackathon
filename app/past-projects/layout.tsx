import { PlatformChrome } from "@/components/PlatformChrome";

export default function PastProjectsLayout({ children }: { children: React.ReactNode }) {
  return <PlatformChrome mainClassName="container mx-auto max-w-6xl px-4 py-8">{children}</PlatformChrome>;
}
