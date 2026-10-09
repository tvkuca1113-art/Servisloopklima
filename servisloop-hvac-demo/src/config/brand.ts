/**
 * Centralna konfiguracija izgleda i naziva.
 *
 * Za verziju budućeg klijenta mijenja se samo ova datoteka: naziv proizvoda,
 * naziv firme, boje i (opcionalno) kontakt autora demoa.
 */
export interface BrandConfig {
  productName: string;
  tagline: string;
  /** Naziv firme koja se prikazuje u primjeru. */
  companyName: string;
  /** Kratke inicijale za logo kvadrat. */
  logoInitials: string;
  colors: {
    primary: string;
    primaryHover: string;
    nav: string;
  };
  /**
   * Kontakt autora demoa. Ako je `null`, stranica prikazuje pošten tekst bez
   * izmišljenog e-maila ili telefona. Popunjava se samo stvarnim, dostavljenim podacima.
   */
  contact: null | {
    name: string;
    email?: string;
    phone?: string;
  };
}

export const brand: BrandConfig = {
  productName: 'ServisLoop Klima',
  tagline: 'Od QR koda do servisnog izvještaja.',
  companyName: 'Primjer Klima d.o.o.',
  logoInitials: 'SK',
  colors: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    nav: '#101828',
  },
  contact: null,
};

/** Vremenska zona u kojoj se računa „danas” za demo primjer. */
export const DEMO_TIME_ZONE = 'Europe/Sarajevo';
