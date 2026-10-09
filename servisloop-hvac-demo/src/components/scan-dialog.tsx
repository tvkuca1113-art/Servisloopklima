'use client';

import jsQR from 'jsqr';
import { Camera, CameraOff, Keyboard, ScanLine } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { deviceIdFromQr } from '@/lib/checklists';
import { deviceTitle, lookup, resolveCode } from '@/lib/derive';
import { customerUrl, qrPngDataUrl } from '@/lib/qr';
import { useDemo } from '@/lib/store';
import type { WorkOrder } from '@/lib/types';

import { Button, Modal, Notice, inputClass } from './ui';

type Method = 'qr' | 'rucno';

interface Problem {
  tone: 'danger' | 'warn';
  text: string;
  addable?: string;
}

/**
 * Identifikacija uređaja na licu mjesta. Serviser skenira QR naljepnicu (kamerom
 * telefona), a aplikacija provjeri da je to uređaj s ovog naloga prije bilo kakvog unosa.
 * Isti QR koji kupac skenira — aplikacija servisera iz adrese čita oznaku uređaja.
 */
export function ScanDialog({
  open,
  onClose,
  order,
  expected,
  onIdentified,
  onBlankLabel,
  mode = 'uredaj',
}: {
  open: boolean;
  onClose: () => void;
  order: WorkOrder;
  /** Uređaj koji serviser namjerava obraditi (samo za naslov); prihvata se bilo koji s naloga. */
  expected?: string | null;
  onIdentified: (deviceId: string, method: Method) => void;
  /** Skenirana je prazna naljepnica iz rezervnog kompleta — serviser dodaje novi uređaj. */
  onBlankLabel: (code: string) => void;
  mode?: 'uredaj' | 'nova';
}) {
  const { state, addItem } = useDemo();
  const L = lookup(state);
  const uid = useId();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [manual, setManual] = useState('');
  const [camera, setCamera] = useState<'off' | 'starting' | 'on' | 'error'>('off');
  const [cameraError, setCameraError] = useState('');
  const [stickers, setStickers] = useState<{ id: string; title: string; png: string; decoy: boolean; blank: boolean }[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });
  const rafRef = useRef<number | null>(null);

  const location = L.location(order.locationId);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera('off');
  }, []);

  const handle = useCallback(
    (text: string, method: Method) => {
      const code = deviceIdFromQr(text);
      if (!code) {
        setProblem({ tone: 'danger', text: 'Ovaj QR kod nije naljepnica uređaja iz evidencije. Ništa nije upisano.' });
        return;
      }
      const resolved = resolveCode(state, code);
      if (resolved.kind === 'label' && !resolved.deviceId) {
        if (!state.labels.some((l) => l.code === code)) {
          setProblem({ tone: 'danger', text: `Naljepnica ${code} nije iz kompleta ove firme. Ništa nije upisano.` });
          return;
        }
        setProblem(null);
        stopCamera();
        onBlankLabel(code);
        return;
      }
      const id = resolved.deviceId!;
      if (order.items.some((i) => i.deviceId === id)) {
        setProblem(null);
        stopCamera();
        onIdentified(id, method);
        return;
      }
      const device = state.devices.find((d) => d.id === id);
      if (!device) {
        setProblem({ tone: 'danger', text: `Uređaj ${id} ne postoji u evidenciji. Ništa nije upisano.` });
        return;
      }
      if (device.locationId === order.locationId) {
        setProblem({ tone: 'warn', text: `${deviceTitle(state, device)} je na ovom objektu, ali nije na nalogu ${order.id}.`, addable: id });
        return;
      }
      const loc = L.deviceLocation(device);
      setProblem({
        tone: 'danger',
        text: `Pogrešan uređaj: ${device.id} pripada lokaciji „${loc?.name}, ${loc?.city}”, a nalog ${order.id} je za „${location?.name}”. Ništa nije upisano.`,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [order, state.devices, state.labels, stopCamera, onIdentified, onBlankLabel],
  );

  // Simulirane naljepnice za demo: uređaji na objektu + jedna s drugog objekta (za prikaz greške).
  useEffect(() => {
    if (!open) return;
    setProblem(null);
    setManual('');
    const here = state.devices.filter((d) => d.locationId === order.locationId);
    const decoy = state.devices.find((d) => d.locationId !== order.locationId && d.kind === here[0]?.kind) ?? state.devices.find((d) => d.locationId !== order.locationId);
    const list = [
      ...here.map((d) => ({ id: d.label ?? d.id, title: d.label ? `${d.id} · ${d.name}` : d.name, decoy: false, blank: false })),
      ...state.labels.filter((l) => !l.deviceId).slice(0, mode === 'nova' ? 2 : 1).map((l) => ({ id: l.code, title: 'Prazna naljepnica (rezervni komplet)', decoy: false, blank: true })),
      ...(decoy && mode === 'uredaj' ? [{ id: decoy.id, title: decoy.name, decoy: true, blank: false }] : []),
    ];
    let alive = true;
    Promise.all(list.map(async (x) => ({ ...x, png: await qrPngDataUrl(customerUrl(x.id), 168) }))).then((s) => {
      if (alive) setStickers(mode === 'nova' ? [...s.filter((x) => x.blank), ...s.filter((x) => !x.blank)] : s);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order.locationId, state.devices, mode]);

  useEffect(() => {
    if (!open) stopCamera();
    return () => stopCamera();
  }, [open, stopCamera]);

  async function startCamera() {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('error');
      setCameraError('Kamera nije dostupna u ovom pregledniku. Koristite demo naljepnice ispod ili ručni unos.');
      return;
    }
    setCamera('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setCamera('on');
      const tick = () => {
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c || !streamRef.current) return;
        if (v.readyState >= 2 && v.videoWidth > 0) {
          const scale = Math.min(1, 640 / v.videoWidth);
          c.width = Math.round(v.videoWidth * scale);
          c.height = Math.round(v.videoHeight * scale);
          const ctx = c.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(v, 0, 0, c.width, c.height);
            const img = ctx.getImageData(0, 0, c.width, c.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
            if (code?.data) {
              const now = Date.now();
              if (code.data !== lastRef.current.text || now - lastRef.current.at > 2500) {
                lastRef.current = { text: code.data, at: now };
                handle(code.data, 'qr');
              }
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      const name = (e as { name?: string })?.name;
      setCamera('error');
      setCameraError(
        name === 'NotAllowedError'
          ? 'Pristup kameri nije dozvoljen. Dozvolite kameru u postavkama preglednika ili koristite ručni unos.'
          : 'Kamera se nije mogla pokrenuti. Koristite demo naljepnice ispod ili ručni unos.',
      );
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  const expectedDevice = expected ? L.device(expected) : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={mode === 'nova' ? 'Novi uređaj: skeniraj praznu naljepnicu' : expectedDevice ? `Skeniraj QR: ${expectedDevice.id}` : 'Skeniraj QR uređaja'}
      description={
        mode === 'nova'
          ? 'Zalijepite praznu naljepnicu iz rezervnog kompleta na uređaj i skenirajte je. Zatim upišete nekoliko podataka.'
          : `Objekat: ${location?.name ?? ''}. Unos je moguć tek kada se potvrdi da je uređaj na ovom nalogu.`
      }
    >
      <div className="space-y-5">
        {problem ? (
          <div role="alert" data-testid="scan-problem">
            <Notice tone={problem.tone} title={problem.tone === 'danger' ? 'Uređaj nije prihvaćen' : 'Uređaj nije na nalogu'}>
              <p>{problem.text}</p>
              {problem.addable ? (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const id = problem.addable!;
                    addItem(order.id, id);
                    setProblem(null);
                    stopCamera();
                    onIdentified(id, 'qr');
                  }}
                >
                  Dodaj na nalog i nastavi
                </Button>
              ) : null}
            </Notice>
          </div>
        ) : null}

        <section aria-labelledby={`${uid}-cam`} className="rounded-xl border border-line p-3">
          <h3 id={`${uid}-cam`} className="flex items-center gap-2 font-semibold">
            <Camera className="size-[18px]" aria-hidden /> Kamera telefona
          </h3>
          <div className={camera === 'on' || camera === 'starting' ? 'relative mt-3 overflow-hidden rounded-lg bg-black' : 'hidden'}>
            <video ref={videoRef} playsInline muted className="block aspect-[4/3] w-full object-cover" aria-label="Prikaz kamere" />
            <div className="pointer-events-none absolute inset-[18%] rounded-xl border-2 border-white/80" aria-hidden />
            <p className="absolute inset-x-0 bottom-2 text-center text-sm font-medium text-white">Usmjerite kameru na QR naljepnicu</p>
          </div>
          <canvas ref={canvasRef} className="hidden" aria-hidden />
          {camera === 'error' ? <p className="mt-2 text-sm font-medium text-danger">{cameraError}</p> : null}
          <div className="mt-3">
            {camera === 'on' || camera === 'starting' ? (
              <Button variant="secondary" onClick={stopCamera}>
                <CameraOff aria-hidden /> Isključi kameru
              </Button>
            ) : (
              <Button onClick={startCamera}>
                <ScanLine aria-hidden /> Skeniraj kamerom
              </Button>
            )}
          </div>
          <p className="mt-2 text-[13px] text-ink-3">Radi na telefonu preko HTTPS-a. Možete skenirati i QR s ekrana računara (stranica uređaja ili naljepnica).</p>
        </section>

        <section aria-labelledby={`${uid}-stick`}>
          <h3 id={`${uid}-stick`} className="font-semibold">
            Demo: naljepnice na objektu
          </h3>
          <p className="text-sm text-ink-2">U demou nema fizičkih naljepnica — dodirnite naljepnicu da simulirate skeniranje.</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {stickers.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handle(customerUrl(s.id), 'qr')}
                  className="flex w-full flex-col items-center gap-1 rounded-xl border border-line-2 bg-white p-2 text-center hover:border-primary focus-visible:border-primary"
                  data-testid={`sticker-${s.id}`}
                  aria-label={`Simuliraj skeniranje naljepnice ${s.id}${s.decoy ? ' (drugi objekat)' : s.blank ? ' (prazna)' : ''}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.png} alt="" className="size-20" />
                  <span className="text-sm font-bold text-black">{s.id}</span>
                  <span className="line-clamp-2 text-[12px] leading-tight text-ink-2">{s.title}</span>
                  {s.decoy ? <span className="mt-0.5 rounded bg-warn-soft px-1.5 text-[11px] font-semibold text-warn">drugi objekat</span> : null}
                  {s.blank ? <span className="mt-0.5 rounded bg-primary-soft px-1.5 text-[11px] font-semibold text-primary-hover">prazna</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby={`${uid}-man`} className="rounded-xl border border-line p-3">
          <h3 id={`${uid}-man`} className="flex items-center gap-2 font-semibold">
            <Keyboard className="size-[18px]" aria-hidden /> Naljepnica oštećena?
          </h3>
          <form
            className="mt-2 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (manual.trim()) handle(manual, 'rucno');
            }}
          >
            <label htmlFor={`${uid}-input`} className="sr-only">
              Oznaka uređaja
            </label>
            <input id={`${uid}-input`} value={manual} onChange={(e) => setManual(e.target.value)} placeholder={mode === 'nova' ? 'npr. N-0001' : 'npr. TP-001'} className={inputClass()} autoCapitalize="characters" maxLength={12} />
            <Button type="submit" variant="secondary" className="shrink-0">
              Potvrdi oznaku
            </Button>
          </form>
          <p className="mt-1 text-[13px] text-ink-3">Ručni unos se u izvještaju bilježi kao „ručna identifikacija”.</p>
        </section>
      </div>
    </Modal>
  );
}
