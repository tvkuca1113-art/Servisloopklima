import type { CivilDate } from './dates';

export type DeviceKind = 'klima' | 'pumpa';

export interface Customer {
  id: string;
  name: string;
  type: 'Privatni kupac' | 'Poslovni kupac';
  email: string;
  /** Prikazuje se samo kao tekst, nikad kao klikabilan broj. */
  phone: string;
}

export interface Location {
  id: string;
  customerId: string;
  name: string;
  address: string;
  city: string;
}

export interface Technician {
  id: string;
  name: string;
  initials: string;
  area: string;
}

export interface HistoryEntry {
  date: CivilDate;
  title: string;
  technicianId: string;
  summary: string;
  workOrderId?: string;
}

export interface Device {
  id: string;
  name: string;
  kind: DeviceKind;
  typeLabel: string;
  model: string;
  serial: string;
  locationId: string;
  installedOn: CivilDate;
  /** DEMO postavka; stvarnu vrijednost potvrđuje firma. */
  intervalMonths: number;
  lastServiceOn: CivilDate | null;
  nextServiceOn: CivilDate;
  note: string;
  history: HistoryEntry[];
  /** `ugradnja` = uređaj je najavljen (naljepnica odštampana), ali još nije ugrađen. */
  status: 'aktivan' | 'ugradnja';
  /** Kod prazne naljepnice iz rezervnog kompleta, ako je uređaj povezan na licu mjesta. */
  label: string | null;
}

/** Prazna QR naljepnica iz kompleta koji vlasnik unaprijed odštampa. */
export interface BlankLabel {
  code: string;
  deviceId: string | null;
}

export interface ProposalSlot {
  date: CivilDate;
  start: string;
  technicianId: string;
}

export type ProposalStatus = 'poslan' | 'prihvacen' | 'odbijen' | 'odgoden';

/** Prijedlog termina servisa koji vlasnik šalje kupcu (simulacija poruke). */
export interface Proposal {
  id: string;
  locationId: string;
  deviceIds: string[];
  dueOn: CivilDate;
  channel: 'email' | 'sms';
  slots: ProposalSlot[];
  durationMin: number;
  status: ProposalStatus;
  chosen: number | null;
  reason: string;
  sentAt: number;
  respondedAt: number | null;
  workOrderId: string | null;
}

export type RequestKind = 'servis' | 'kvar';
export type RequestStatus = 'na_cekanju' | 'potvrdjen' | 'odbijen';

export interface ServiceRequest {
  id: string;
  kind: RequestKind;
  deviceId: string;
  name: string;
  contact: string;
  preferredDate: CivilDate | null;
  preferredSlot: string;
  note: string;
  errorCode: string;
  photo: { name: string; dataUrl: string } | null;
  /** Brzi izbor simptoma kod prijave kvara (npr. „Ne grije”). */
  symptom: string;
  /** Kupac je označio da uređaj ne radi (hitno). */
  urgent: boolean;
  status: RequestStatus;
  createdAt: number;
  /** Zahtjev napravljen u ovoj probi preko prikaza kupca. */
  fromSimulation: boolean;
  workOrderId: string | null;
}

export type WorkOrderStatus = 'planiran' | 'u_radu' | 'zavrsen' | 'otkazan';
export type CheckAnswer = 'uredno' | 'paznja' | 'np';

export interface ChecklistEntry {
  id: string;
  label: string;
  hint: string;
  answer: CheckAnswer | null;
  note: string;
}

export interface Photo {
  name: string;
  dataUrl: string;
}

/** Jedan uređaj u posjeti. Serviser ga mora identifikovati prije unosa. */
export interface OrderItem {
  deviceId: string;
  checklist: ChecklistEntry[];
  note: string;
  photos: Photo[];
  identifiedAt: number | null;
  identifiedBy: 'qr' | 'rucno' | null;
  done: boolean;
}

export interface WorkOrder {
  id: string;
  /** Glavni uređaj (iz zahtjeva) — prvi u `items`. */
  deviceId: string;
  locationId: string;
  items: OrderItem[];
  requestId: string | null;
  reason: string;
  category: 'Redovni servis' | 'Prijava kvara' | 'Provjera nakon ugradnje' | 'Ugradnja';
  date: CivilDate;
  start: string;
  durationMin: number;
  technicianId: string | null;
  status: WorkOrderStatus;
  notes: string;
  startedAt: number | null;
  timeSpentMin: number | null;
  materials: string;
  recommendation: string;
  completedOn: CivilDate | null;
  nextServiceOn: CivilDate | null;
  /** Primjer potvrde kupca, samo ilustrativno. */
  customerAck: string;
}

export interface Activity {
  id: string;
  at: number;
  text: string;
  href: string | null;
}

export interface GuideState {
  visitedDevice: boolean;
  visitedCustomer: boolean;
  requestId: string | null;
  viewedReport: boolean;
  dismissed: boolean;
}

export interface DemoState {
  version: number;
  anchor: CivilDate;
  customers: Customer[];
  locations: Location[];
  technicians: Technician[];
  devices: Device[];
  requests: ServiceRequest[];
  workOrders: WorkOrder[];
  proposals: Proposal[];
  labels: BlankLabel[];
  activity: Activity[];
  guide: GuideState;
  counters: { request: number; workOrder: number; device: number; proposal: number; customer: number };
}
