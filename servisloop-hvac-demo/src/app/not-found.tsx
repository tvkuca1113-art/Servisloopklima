import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="sadrzaj" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="rounded bg-demo px-2 py-0.5 text-xs font-bold text-white">DEMO PROTOTIP</p>
      <h1 className="text-2xl font-bold">Stranica nije pronađena</h1>
      <p className="text-ink-2">Ova adresa ne postoji u pokaznom primjeru.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-[10px] border border-line-2 bg-surface px-4 font-semibold">Početna</Link>
        <Link href="/demo" className="inline-flex min-h-11 items-center rounded-[10px] bg-primary px-4 font-semibold text-white">Otvori demo</Link>
      </div>
    </main>
  );
}
