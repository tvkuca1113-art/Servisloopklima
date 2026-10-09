'use client';

import { Camera, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Button } from './ui';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export interface LocalPhoto {
  name: string;
  dataUrl: string;
}

/** Lokalni pregled fotografije. Fotografija se ne šalje nigdje. */
export function PhotoPicker({ label, photo, onChange }: { label: string; photo: LocalPhoto | null; onChange: (p: LocalPhoto | null) => void }) {
  const uid = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function pick(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError('Dozvoljeni formati su JPG, PNG ili WEBP.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError(`Fotografija ima ${(file.size / 1024 / 1024).toFixed(1).replace('.', ',')} MB. Najveća dozvoljena veličina je 5 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      onChange({ name: file.name, dataUrl: String(reader.result) });
    };
    reader.onerror = () => setError('Fotografiju nije moguće učitati. Pokušajte drugu.');
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={uid} className="text-sm font-semibold text-ink">
        {label} <span className="font-normal text-ink-3">(opcionalno)</span>
      </label>
      <input
        ref={input}
        id={uid}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
        aria-describedby={`${uid}-hint`}
      />
      {photo ? (
        <div className="flex items-start gap-3 rounded-xl border border-line-2 bg-bg p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.dataUrl} alt={`Lokalni pregled: ${photo.name}`} className="size-24 shrink-0 rounded-lg object-cover" data-testid="photo-preview" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium break-all">{photo.name}</p>
            <p className="text-[13px] text-ink-3">Lokalni pregled — fotografija se ne šalje.</p>
            <Button variant="danger" size="sm" className="mt-2" onClick={() => onChange(null)}>
              <Trash2 aria-hidden /> Ukloni fotografiju
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => input.current?.click()} className="self-start">
          <Camera aria-hidden /> Dodaj fotografiju
        </Button>
      )}
      <p id={`${uid}-hint`} className="text-[13px] text-ink-3">
        JPG, PNG ili WEBP, najviše 5 MB. Prikazuje se samo u ovom pregledniku.
      </p>
      {error ? (
        <p className="text-[13px] font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
