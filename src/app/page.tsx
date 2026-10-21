import Link from 'next/link';
import { ArrowRight, BadgeCheck, FilePenLine, GraduationCap, Search, SearchCheck, Send, Sparkles, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteShell } from '@/components/site/site-shell';
import { ProjectCard } from '@/components/shared/project-card';
import { HeroBackground } from '@/components/motion/hero-background';
import { Reveal } from '@/components/motion/reveal';
import { CountUp } from '@/components/motion/count-up';
import { getDepartments } from '@/features/catalog/queries';
import { getFeaturedProjects, getPublicStats, getTechnologyUsage } from '@/features/repository/queries';

const STEPS = [
  { icon: FilePenLine, title: 'Create a draft', text: 'Add the abstract, team, technologies, images and your report. It autosaves as you go.' },
  { icon: Send, title: 'Submit for review', text: 'Your team leader submits when everything is ready. The project locks while it is reviewed.' },
  { icon: SearchCheck, title: 'Screening & faculty review', text: 'A student representative screens it, then your guide or department faculty decides.' },
  { icon: BadgeCheck, title: 'Published', text: 'Approved projects appear in the repository for every batch that follows to learn from.' },
];

const ROLES = [
  { icon: UsersRound, title: 'Students', text: 'Showcase your work with a permanent public profile and project page.' },
  { icon: SearchCheck, title: 'Representatives', text: 'Screen submissions from your department and keep quality high.' },
  { icon: GraduationCap, title: 'Faculty', text: 'Guide teams, give feedback and approve projects in one place.' },
];

export default async function HomePage() {
  const [stats, featured, departments, techs] = await Promise.all([
    getPublicStats(),
    getFeaturedProjects(6),
    getDepartments(),
    getTechnologyUsage(14),
  ]);

  return (
    <SiteShell>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-b">
        <HeroBackground />
        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
          <Reveal stagger onScroll={false} className="mx-auto max-w-3xl text-center">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-3.5 text-primary" /> The department’s project repository
            </p>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
              Every engineering project, <span className="text-primary">reviewed</span> and easy to find.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Submit your project, get feedback from representatives and faculty, and publish it to a repository that
              future batches can search, learn from and build upon.
            </p>
            <form action="/projects" className="mx-auto mt-8 flex max-w-xl gap-2 rounded-xl border bg-background/80 p-1.5 shadow-lg shadow-primary/5 backdrop-blur">
              <label htmlFor="hero-q" className="sr-only">Search projects</label>
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="hero-q" name="q" placeholder="Try “IoT”, “face recognition”, “robot”…" className="h-11 border-0 pl-9 shadow-none focus-visible:ring-0" />
              </div>
              <Button type="submit" size="lg" className="h-11">Search</Button>
            </form>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/projects">Browse all projects <ArrowRight /></Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/dashboard/projects/new">Submit your project</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal stagger delay={0.3} onScroll={false} className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Approved projects', value: stats.projects },
              { label: 'Student contributors', value: stats.contributors },
              { label: 'Departments', value: stats.departments },
              { label: 'Technologies', value: stats.technologies },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card/70 p-4 text-center backdrop-blur">
                <CountUp value={s.value} className="text-3xl font-bold tabular-nums" />
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Featured projects</h2>
              <p className="mt-1 text-muted-foreground">Hand-picked work from across the department.</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/projects">View all <ArrowRight /></Link>
            </Button>
          </div>
          <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </Reveal>
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="border-y bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How a project gets published</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">A clear, two-stage review so every project in the repository meets the department’s standard.</p>
          <Reveal stagger={0.12} className="relative mt-12 grid gap-6 md:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative rounded-xl border bg-background p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">STEP {i + 1}</span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Browse ───────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Browse by department</h2>
          <Reveal stagger className="mt-5 grid gap-3">
            {departments.map((d) => (
              <Link key={d.id} href={`/projects?department=${d.code}`} className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/50">
                <div>
                  <p className="font-semibold">{d.name}</p>
                  {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                </div>
                <span className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                  {d.code} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </Reveal>
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Popular technologies</h2>
          <Reveal stagger={0.03} className="mt-5 flex flex-wrap gap-2">
            {techs.map((t) => (
              <Link key={t.id} href={`/technologies/${t.slug}`} className="rounded-lg border bg-card px-3 py-2 font-mono text-sm transition-colors hover:border-primary/50 hover:text-primary">
                {t.name} <span className="text-muted-foreground">· {t.projectCount}</span>
              </Link>
            ))}
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {ROLES.map((r) => (
              <div key={r.title} className="rounded-xl border bg-card p-4">
                <r.icon className="size-5 text-primary" />
                <p className="mt-2 font-semibold">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <Reveal className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-primary-foreground sm:px-12">
          <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Finished a project? Put it on record.</h2>
              <p className="mt-2 max-w-xl opacity-90">Create your account with your college email and submit your project in minutes.</p>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Create your account <ArrowRight /></Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </SiteShell>
  );
}
