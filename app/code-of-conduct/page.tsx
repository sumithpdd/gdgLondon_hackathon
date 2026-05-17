import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Heart,
  Megaphone,
  Ban,
  Mail,
  Scale,
  Handshake,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";

export const metadata: Metadata = {
  title: "Code of Conduct | GDG London Hackathon",
  description:
    "GDG London community guidelines and anti-harassment policy for Build with AI hackathon events.",
};

const ZERO_TOLERANCE_ITEMS = [
  "Deliberate intimidation",
  "Harassing photography or recording",
  "Sustained disruption of talks or other events",
  "Offensive verbal language",
  "Verbal language that reinforces social structures of domination",
  "Sexual imagery and language",
  "Unwelcome sexual or physical attention",
  "Physical or cyber threats",
];

const PROTECTED_CATEGORIES = [
  "Neurodiversity",
  "Race",
  "Color",
  "National origin",
  "Gender identity",
  "Gender expression",
  "Sexual orientation",
  "Age",
  "Body size",
  "Disabilities",
  "Appearance",
  "Religion",
  "Pregnancy",
  "Military status",
  "Social demographic",
];

const ATTRIBUTION_SOURCES = [
  "Ohio LinuxFest Anti-Harassment policy",
  "Con Anti-Harassment Project",
  "Geek Feminism Wiki (created by the Ada Initiative)",
  "ConfCodeofConduct.com",
  "JSconf",
  "Rust",
  "Diversity in Python",
  "Write/Speak/Code",
];

function Section({
  id,
  icon: Icon,
  title,
  children,
  variant = "default",
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "violet" | "rose";
}) {
  const border =
    variant === "violet"
      ? "border-violet-500/30"
      : variant === "rose"
        ? "border-rose-500/30"
        : "border-border";
  const iconColor =
    variant === "violet"
      ? "text-violet-400"
      : variant === "rose"
        ? "text-rose-400"
        : "text-primary";

  return (
    <section id={id} className="scroll-mt-24">
      <Card className={`bg-card/80 backdrop-blur-sm ${border}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl sm:text-2xl text-foreground flex items-center gap-3 sm:gap-4">
            <SectionIcon icon={Icon} className={iconColor} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="prose-muted space-y-5">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 pl-1 text-base">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/80" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CodeOfConductPage() {
  return (
    <article className="page-stack pb-10">
      <header className="text-center space-y-6 sm:space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300">
          <Shield className="h-4 w-4" />
          Community guidelines
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Code of Conduct &amp; Anti-Harassment Policy
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Google Developer Groups (&quot;GDG&quot;) GDG London is dedicated to providing a
          harassment-free and inclusive event experience for everyone regardless of gender identity
          and expression, sexual orientation, disabilities, neurodiversity, physical appearance,
          body size, ethnicity, nationality, race, age, religion, or other protected category. We do
          not tolerate harassment of event participants in any form. GDG London takes violations of
          our policy seriously and will respond appropriately.
        </p>
        <p className="text-sm text-muted-foreground">
          All participants of GDG London events must abide by the following policy.
        </p>
        <nav
          aria-label="On this page"
          className="flex flex-wrap justify-center gap-2 pt-2 text-sm"
        >
          {[
            ["excellent", "Be excellent"],
            ["speak-up", "Speak up"],
            ["zero-tolerance", "Zero tolerance"],
            ["reporting", "Reporting"],
            ["why", "Why it matters"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-foreground/90 hover:bg-accent hover:text-foreground transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <Section id="excellent" icon={Heart} title="Be Excellent To Each Other" variant="violet">
        <p>
          We want the event to be an excellent experience for everyone regardless of gender identity
          and expression, sexual orientation, disabilities, neurodiversity, physical appearance, body
          size, ethnicity, nationality, race, age, religion, or other protected category. Treat
          everyone with respect. Participate while acknowledging that everyone deserves to be here
          — and each of us has the right to enjoy our experience without fear of harassment,
          discrimination, or condescension, whether blatant or via micro-aggressions.
        </p>
        <p>
          Jokes shouldn&apos;t demean others. Consider what you are saying and how it would feel if
          it were said to or about you.
        </p>
      </Section>

      <Section id="speak-up" icon={Megaphone} title="Speak Up If You See Or Hear Something">
        <p>
          Harassment is not tolerated, and you are empowered to politely engage when you or others
          are disrespected. The person making you feel uncomfortable may not be aware of what they
          are doing, and politely bringing their behavior to their attention is encouraged.
        </p>
        <p>
          If a participant engages in harassing or uncomfortable behavior, the event organizers may
          take any action they deem appropriate, including warning or expelling the offender from
          the event with no refund. If you are being harassed or feel uncomfortable, notice that
          someone else is being harassed, or have any other concerns, please contact a member of the
          event staff immediately.
        </p>
      </Section>

      <Section id="zero-tolerance" icon={Ban} title="Zero Tolerance Policy" variant="rose">
        <p>
          Harassment is not tolerated. We have a zero tolerance policy for in-person or online
          harassment of any kind, including but not limited to:
        </p>
        <BulletList items={ZERO_TOLERANCE_ITEMS} />
        <p>
          We are dedicated to providing a harassment-free and inclusive event experience for
          everyone regardless of gender identity and expression, sexual orientation, disabilities,
          neurodiversity, physical appearance, body size, ethnicity, nationality, race, age,
          religion, or other protected category. We do not tolerate harassment of event participants
          in any form. We take violations of our policy seriously and will respond appropriately.
        </p>
        <p>
          All participants of GDG London events, including in-person and online attendees, event
          staff, speakers, and Googlers, must abide by this policy. Zero tolerance policy applies to
          harassment of any kind, in relation to, but not limited to:
        </p>
        <div className="flex flex-wrap gap-2">
          {PROTECTED_CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs sm:text-sm text-foreground/90"
            >
              {cat}
            </span>
          ))}
        </div>
        <p>
          Participants asked to stop any harassing behavior are expected to comply immediately.
          This policy extends to talks, forums, workshops, codelabs, social media, parties,
          hallway conversations, all attendees, partners, sponsors, volunteers, event staff, etc.
          You catch our drift.
        </p>
        <p>
          GDG London reserves the right to refuse admittance to, or remove any person from, any GDG
          London hosted event (including future GDG London events) at any time in its sole
          discretion. This includes, but is not limited to, attendees behaving in a disorderly
          manner or failing to comply with this policy, and the terms and conditions herein.
        </p>
        <p>
          Our event staff can usually be identified by special badges/attire. Our zero tolerance
          policy means that we will look into and review every allegation of violation of our Event
          Community Guidelines and Anti-Harassment Policy and respond appropriately. Please note,
          while we take all concerns raised seriously, we will use our discretion as to determining
          when and how to follow up on reported incidents, and may decline to take any further
          action and/or may direct the participant to other resources for resolution.
        </p>
        <p>
          Event staff will be happy to help participants contact hotel/venue security or local law
          enforcement, provide escorts, or otherwise assist those experiencing discomfort or
          harassment to feel safe for the duration of the event. We value your attendance.
        </p>
      </Section>

      <Section id="partners" icon={Handshake} title="Partners &amp; Exhibitors">
        <p>
          Exhibiting partners, sponsors or vendor booths, or similar activities are also subject to
          this policy. In particular, exhibitors should not use sexualized images, activities, or
          other material. Booth staff (including volunteers) should not use sexualized
          clothing/uniforms/costumes, or otherwise create a sexualized environment. Participants and
          exhibiting partners or sponsors disobeying this policy will be notified and are expected to
          stop any offending behavior immediately.
        </p>
      </Section>

      <Section id="reporting" icon={Mail} title="Reporting" variant="violet">
        <p>
          If someone makes you or anyone else feel unsafe or unwelcome, please report it as soon as
          possible. Harassment and other code of conduct violations reduce the value of our event
          for everyone. We want you to be happy at our event. People like you make our event a
          better place.
        </p>
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6 space-y-3 not-prose">
          <p className="text-foreground font-medium">Contact the organisers</p>
          <a
            href="mailto:hello@gdglondon.dev?subject=Code%20of%20Conduct%20report"
            className="inline-flex items-center gap-2 text-lg font-semibold text-violet-300 hover:text-violet-200 underline underline-offset-4 transition-colors"
          >
            <Mail className="h-5 w-5" />
            hello@gdglondon.dev
          </a>
          <p className="text-sm">
            You can report personally by email. For anonymous reports, ask event staff for the
            confidential reporting form at the venue — we will fully investigate and take whatever
            action is necessary to prevent a recurrence.
          </p>
        </div>
      </Section>

      <Section id="why" icon={Scale} title="Why This Policy Is Important">
        <p>
          Harassment at events and in online communities is unfortunately common. Creating an official
          policy aims to improve this by making it clear that harassment of anyone for any reason is
          not acceptable within our events and communities. This policy may prevent harassment by
          clearly defining expectations for behavior, aims to provide reassurance, and encourages
          people who have had bad experiences at other events to participate in this one.
        </p>
      </Section>

      <Section id="license" icon={FileText} title="License and Attribution">
        <p>
          This policy is licensed under the{" "}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium underline underline-offset-2 hover:text-primary/80"
          >
            Creative Commons Zero license
          </a>
          . This policy is based on and influenced by several other community policies including:{" "}
          {ATTRIBUTION_SOURCES.join(", ")}.
        </p>
      </Section>

      <p className="text-center text-sm text-muted-foreground pt-4">
        <Link href="/hackathon" className="text-primary hover:underline">
          ← Back to hackathon hub
        </Link>
      </p>
    </article>
  );
}
