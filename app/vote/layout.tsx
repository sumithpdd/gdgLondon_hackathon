import { PlatformChrome } from "@/components/PlatformChrome";

export default function VoteLayout({ children }: { children: React.ReactNode }) {
  return <PlatformChrome mainClassName="max-w-3xl mx-auto px-4 py-8">{children}</PlatformChrome>;
}
