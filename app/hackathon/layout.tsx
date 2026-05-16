import { PlatformChrome } from "@/components/PlatformChrome";

export default function HackathonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformChrome>{children}</PlatformChrome>;
}
