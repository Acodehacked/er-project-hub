import Link from 'next/link';
import { ArrowRight, BadgeCheck, FilePenLine, GraduationCap, Search, SearchCheck, Send, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteShell } from '@/components/site/site-shell';
import { ProjectCard } from '@/components/shared/project-card';
import { HeroBackground } from '@/components/motion/hero-background';
import { GradientTiles } from '@/components/motion/gradient-tiles';
import { SpectrumSwitch } from '@/components/motion/spectrum-switch';
import { Reveal } from '@/components/motion/reveal';
import { CountUp } from '@/components/motion/count-up';
import { getDepartments } from '@/features/catalog/queries';
import { getFeaturedProjects, getPublicStats, getTechnologyUsage } from '@/features/repository/queries';

const STEPS = [
  { icon: FilePenLine, tile: 1, title: 'Create a draft', text: 'Add the abstract, team, technologies, images and your report. It autosaves as you go.' },
  { icon: Send, tile: 3, title: 'Submit for review', text: 'Your team leader submits when everything is ready. The project locks while it is reviewed.' },
  { icon: SearchCheck, tile: 4, title: 'Screening & faculty review', text: 'A student representative screens it, then your guide or department faculty decides.' },
  { icon: BadgeCheck, tile: 6, title: 'Published', text: 'Approved projects appear in the repository for every batch that follows to learn from.' },
];

const ROLES = [
  { icon: UsersRound, tile: 1, title: 'Students', text: 'Showcase your work with a permanent public profile and project page.' },
  { icon: SearchCheck, tile: 3, title: 'Representatives', text: 'Screen submissions from your department and keep quality high.' },
  { icon: GraduationCap, tile: 5, title: 'Faculty', text: 'Guide teams, give feedback and approve projects in one place.' },
];

/** Inline style for a solid-colour `.tile` chip. */
const tileStyle = (n: number) => ({ '--tile': `var(--tile-${n})`, '--s': 1 }) as React.CSSProperties;

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
      <section className="relative isolate overflow-hidden border-b bg-card">
        <HeroBackground />
        <div className="relative mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-24 lg:pt-28">
          <Reveal stagger onScroll={false} className="max-w-4xl lg:pl-[6%]">
            <h1 className="text-[2.7rem] leading-[1.04] font-semibold tracking-[-0.045em] sm:text-7xl lg:text-[5.4rem]">
              Every <span className="text-ink-soft">engineering</span> <SpectrumSwitch />
              <br />
              <span className="text-ink-soft">project,</span> on record.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-foreground/80">
              Submit, review and publish student projects — a searchable archive every batch that follows can learn from.
            </p>
            <form action="/projects" className="mt-9 flex max-w-xl items-center gap-1.5 rounded-full border bg-card p-1.5 shadow-soft">
              <label htmlFor="hero-q" className="sr-only">Search projects</label>
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="hero-q"
                  name="q"
                  placeholder="Try “IoT”, “face recognition”, “robot”…"
                  className="h-11 rounded-full border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
              </div>
              <Button type="submit" size="lg">Search</Button>
            </form>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 pl-2 text-sm">
              <Link href="/projects" className="group inline-flex items-center gap-1.5 font-medium">
                Browse all projects <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/dashboard/projects/new" className="text-muted-foreground hover:text-foreground">
                Submit your project
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="relative mt-14 px-2 sm:mt-16 sm:px-3">
          <GradientTiles cols={14} rows={4} />
          <Reveal
            stagger
            delay={0.5}
            onScroll={false}
            className="mx-auto grid max-w-4xl grid-cols-2 gap-3 py-4 md:absolute md:inset-x-0 md:bottom-8 md:grid-cols-4 md:py-0"
          >
            {[
              { label: 'Approved projects', value: stats.projects },
              { label: 'Student contributors', value: stats.contributors },
              { label: 'Departments', value: stats.departments },
              { label: 'Technologies', value: stats.technologies },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4 text-center shadow-soft">
                <CountUp value={s.value} className="text-3xl font-semibold tabular-nums" />
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Featured <span className="text-ink-soft">projects</span>
              </h2>
              <p className="mt-2 text-muted-foreground">Hand-picked work from across the department.</p>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/projects">View all <ArrowRight /></Link>
            </Button>
          </div>
          <Reveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </Reveal>
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y bg-card">
        <div
          className="bg-columns absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-semibold sm:text-4xl">
            How a project gets <span className="text-ink-soft">published</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            A clear, two-stage review so every project in the repository meets the department’s standard.
          </p>
          <div className="relative mt-14">
            <div className="bg-spectrum absolute top-6 right-[12%] left-[12%] hidden h-px opacity-50 md:block" aria-hidden />
            <Reveal stagger={0.12} className="relative grid gap-10 md:grid-cols-4 md:gap-6">
              {STEPS.map((step, i) => (
                <div key={step.title} className="text-center">
                  <span className="tile mx-auto grid size-12 place-items-center text-white" style={tileStyle(step.tile)}>
                    <step.icon className="size-5 drop-shadow-sm" />
                  </span>
                  <p className="mt-4 font-mono text-[11px] tracking-widest text-muted-foreground">STEP {i + 1}</p>
                  <h3 className="mt-1 font-semibold">{step.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-60 text-sm text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Browse ───────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">
            Browse by <span className="text-ink-soft">department</span>
          </h2>
          <Reveal stagger className="mt-6 grid gap-3">
            {departments.map((d) => (
              <Link
                key={d.id}
                href={`/projects?department=${d.code}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 pl-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-tile-3/50"
              >
                <div>
                  <p className="font-semibold">{d.name}</p>
                  {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                </div>
                <span className="flex shrink-0 items-center gap-3 font-mono text-sm text-muted-foreground">
                  {d.code}
                  <span className="grid size-8 place-items-center rounded-full bg-secondary transition-colors group-hover:bg-primary group-hover:text-accent-foreground-foreground">
                    <ArrowRight className="size-4" />
                  </span>
                </span>
              </Link>
            ))}
          </Reveal>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">
            Popular <span className="text-ink-soft">technologies</span>
          </h2>
          <Reveal stagger={0.03} className="mt-6 flex flex-wrap gap-2">
            {techs.map((t) => (
              <Link
                key={t.id}
                href={`/technologies/${t.slug}`}
                className="rounded-full border bg-card px-3.5 py-1.5 font-mono text-sm transition-colors hover:border-tile-3/60 hover:bg-accent hover:text-accent-foreground"
              >
                {t.name} <span className="text-muted-foreground">· {t.projectCount}</span>
              </Link>
            ))}
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {ROLES.map((r) => (
              <div key={r.title} className="rounded-2xl border bg-card p-4 shadow-soft">
                <span className="tile grid size-9 place-items-center text-white" style={tileStyle(r.tile)}>
                  <r.icon className="size-4" />
                </span>
                <p className="mt-3 font-semibold">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <Reveal className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-primary-foreground shadow-lift sm:px-12">
          <GradientTiles
            cols={9}
            rows={4}
            seed={3}
            className="absolute -right-2 -bottom-2 hidden w-[52%] [mask-image:linear-gradient(to_right,transparent,black_45%)] md:grid"
          />
          <div className="relative max-w-lg">
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Finished a project? <span className="opacity-60">Put it on record.</span>
            </h2>
            <p className="mt-3 opacity-80">Create your account with your college email and submit your project in minutes.</p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link href="/register">Create your account <ArrowRight /></Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </SiteShell>
  );
}
