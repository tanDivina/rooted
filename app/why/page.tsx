import Link from 'next/link'
import {
  TreeMark,
  ArrowLeftIcon,
  ArrowOutIcon,
  FallIcon,
  KettleIcon,
  VoiceIcon,
  SapIcon,
  ChimeIcon,
  FamilyIcon,
  HelpIcon,
} from '../components/icons'

export const metadata = {
  title: 'Why stay rooted · Rooted',
  description: 'The research behind aging in place, and how Rooted helps older adults stay where their roots are.',
}

const FINDINGS = [
  {
    figure: '77%',
    claim: 'of US adults aged 50 and over want to stay in their own homes as they age, and 79% want to stay in their communities.',
    source: 'AARP Home and Community Preferences Survey, 2021',
    href: 'https://www.aarp.org/research/topics/community/info-2021/2021-home-community-preferences.html',
  },
  {
    figure: '50%',
    claim:
      'greater odds of survival for people with stronger social relationships, pooled across 148 studies and more than 300,000 people. The authors compare the effect to well-established risk factors.',
    source: 'Holt-Lunstad, Smith & Layton, PLoS Medicine, 2010',
    href: 'https://doi.org/10.1371/journal.pmed.1000316',
  },
  {
    figure: '35%',
    claim:
      'lower risk of dying over five years for older adults who felt the most day-to-day happiness, compared with the least, after adjusting for age, health and habits (3,853 people aged 52–79).',
    source: 'Steptoe & Wardle, PNAS, 2011',
    href: 'https://pubmed.ncbi.nlm.nih.gov/22042845/',
  },
  {
    figure: '11–15%',
    claim: 'longer lifespan on average for the most optimistic people, with better odds of living past 85.',
    source: 'Lee et al., PNAS, 2019',
    href: 'https://doi.org/10.1073/pnas.1900712116',
  },
  {
    figure: 'Neighbours',
    claim:
      'Among 3,154 older adults in Chicago, living alone was tied to higher mortality only for people who felt little connection to their neighbours. Where neighbours were close, the extra risk disappeared.',
    source: 'Jiang et al., Rutgers (PINE cohort study)',
    href: 'https://www.rutgers.edu/news/strong-connection-neighbors-may-improve-health-outcomes',
  },
  {
    figure: 'Uprooting',
    claim:
      'Relocating older people without preparation carries a higher risk of poor outcomes than an orderly, prepared move. Transplanting has a cost.',
    source: 'Holder & Jolley, Reviews in Clinical Gerontology, 2012',
    href: 'https://kar.kent.ac.uk/32428/',
  },
]

const ROOTS = [
  { Icon: FallIcon, title: 'A fall', body: 'A sudden drop to the floor and stillness afterwards, noticed on the Ring stream within seconds.' },
  { Icon: KettleIcon, title: 'A stove left on', body: 'A burner burning in an empty kitchen gets a gentle reminder, then a louder one.' },
  { Icon: VoiceIcon, title: 'A call for help', body: '“Help!”, “I fell!” or “¡Ayuda!” heard through the camera’s two-way audio.' },
  { Icon: SapIcon, title: 'A quiet camera', body: 'If Wi-Fi or power fails, a missing heartbeat switches alerts to cellular.' },
]

const STEPS = [
  { Icon: ChimeIcon, title: 'At home', body: 'A gentle chime in the home. One “I’m okay” and it’s over.' },
  { Icon: FamilyIcon, title: 'Family', body: 'No answer? An email to the family, and a text once SMS is set up.' },
  { Icon: HelpIcon, title: 'Emergency services', body: 'Still nothing? Dispatch, with a brief for paramedics.' },
]

export default function WhyPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/" className="btn-ghost">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to the dashboard
        </Link>

        {/* The metaphor */}
        <section className="grid items-center gap-10 py-16 md:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="eyebrow">Why stay rooted</div>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              You can’t transplant
              <br />
              an <em className="text-moss">old tree</em>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-bark-soft">
              An old oak has spent decades sending roots into one patch of ground: the neighbours, the corner shop,
              the chair by the window, the walk to church. Dig it up and move it, and even with the best care it
              struggles.
            </p>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-bark-soft">
              People are much the same. So instead of moving the tree, <strong className="text-bark">Rooted brings the care to its roots</strong>.
              It turns the Ring camera already in the home into a quiet guardian that only speaks up when something’s wrong.
            </p>
          </div>
          <div className="flex justify-center">
            <TreeMark className="w-64 h-64 animate-sway drop-shadow-sm" />
          </div>
        </section>

        {/* The research */}
        <section className="py-8">
          <div className="eyebrow">What the research says</div>
          <h2 className="mt-2 font-serif text-3xl font-semibold">People flourish where their roots are</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FINDINGS.map((f) => (
              <article key={f.source} className="card flex flex-col !p-6">
                <div className="font-serif text-4xl font-semibold text-moss">{f.figure}</div>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-bark">{f.claim}</p>
                <a
                  href={f.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-bark-mute underline decoration-bark-line underline-offset-4 hover:text-moss"
                >
                  {f.source}
                  <ArrowOutIcon className="w-3.5 h-3.5" />
                </a>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-bark-mute">
            A note on the evidence: these are observational studies. They show strong, consistent associations rather
            than proof of cause, and happier or better-connected people may differ in other ways too. But they all point
            the same way: people do better where they feel at home and connected.
          </p>
        </section>

        {/* The risk */}
        <section className="my-12 rounded-[28px] bg-bark px-8 py-10 text-parchment-paper md:px-12">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-parchment-deep/70">The worry</div>
          <p className="mt-3 max-w-3xl font-serif text-3xl leading-snug">
            About 1 in 4 adults over 65 falls each year. And panic pendants tend to be left on the nightstand.
          </p>
          <p className="mt-4 max-w-2xl text-parchment-deep/80">
            That fear of a fall nobody sees is often what pushes families toward a move. Rooted is built to take that
            fear away.{' '}
            <a
              href="https://www.cdc.gov/falls/data-research/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 decoration-parchment-deep/40 hover:decoration-parchment-paper"
            >
              Source: CDC
            </a>
          </p>
        </section>

        {/* How it works */}
        <section className="py-8">
          <div className="eyebrow">How Rooted keeps watch</div>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Four roots, three steps</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {ROOTS.map(({ Icon, title, body }) => (
              <div key={title} className="card !p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-moss-wash text-moss">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-bark-soft">{body}</p>
              </div>
            ))}
          </div>

          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ Icon, title, body }, i) => (
              <li key={title} className="flex gap-4 rounded-2xl border border-bark-line p-5">
                <span className="font-serif text-3xl font-semibold text-bark-line">{i + 1}</span>
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon className="w-4 h-4 text-ember" />
                    {title}
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-bark-soft">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-16 flex flex-col items-center gap-3 border-t border-bark-line py-12 text-center">
          <TreeMark className="w-14 h-14" />
          <p className="font-serif text-2xl">
            Aging in place. <em className="text-moss">Never alone.</em>
          </p>
          <Link href="/" className="btn-moss mt-2">
            Open the dashboard
          </Link>
          <p className="mt-4 text-[12px] text-bark-mute">
            Built for the Amazon Ring Hackathon 2026 · Caretaking &amp; Accessibility · MIT licensed
          </p>
        </footer>
      </div>
    </main>
  )
}
