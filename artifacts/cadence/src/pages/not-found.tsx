import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-start justify-center" aria-labelledby="not-found-heading">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C2410C]">404</p>
      <h1 id="not-found-heading" className="mt-2 text-3xl font-extrabold tracking-[-0.05em] text-stone-900">This page is off the calendar.</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-500">The route does not exist in this Cadence sample.</p>
      <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[#C2410C] px-5 text-sm font-bold text-white hover:bg-[#9a340a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] focus-visible:ring-offset-2">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to overview
      </Link>
    </section>
  );
}
