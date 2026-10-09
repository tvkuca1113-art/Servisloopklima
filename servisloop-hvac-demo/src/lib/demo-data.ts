/**
 * Izmišljeni podaci za pokazni primjer.
 *
 * Sve osobe, firme, adrese, modeli i serijski brojevi su izmišljeni. E-mail adrese su
 * na rezervisanom domenu `example.test`. Datumi se računaju relativno na dan otvaranja
 * primjera (Europe/Sarajevo), tako da uvijek postoji zakašnjeli servis, servis uskoro,
 * današnji nalog i završeni servis.
 */
import { checklistFor } from './checklists';
import { addDays, addMonths, type CivilDate } from './dates';
import type {
  Activity,
  ChecklistEntry,
  Customer,
  DemoState,
  Device,
  DeviceKind,
  Location,
  OrderItem,
  ServiceRequest,
  Technician,
  WorkOrder,
} from './types';

export const DEMO_STATE_VERSION = 5;

/** Uređaj na kojem se vodi vodič kroz demo. */
export const GUIDE_DEVICE_ID = 'TP-001';
export const SECOND_DEVICE_ID = 'KL-002';

export const customers: Customer[] = [
  { id: 'c1', name: 'Porodica Demić', type: 'Privatni kupac', email: 'demic@example.test', phone: '000 000 101 (demo)' },
  { id: 'c2', name: 'Demo Poslovni Centar d.o.o.', type: 'Poslovni kupac', email: 'recepcija@example.test', phone: '000 000 102 (demo)' },
  { id: 'c3', name: 'Porodica Primjerović', type: 'Privatni kupac', email: 'primjerovic@example.test', phone: '000 000 103 (demo)' },
  { id: 'c4', name: 'Demo Pansion Planina', type: 'Poslovni kupac', email: 'pansion@example.test', phone: '000 000 104 (demo)' },
  { id: 'c5', name: 'Demo Kancelarija Most', type: 'Poslovni kupac', email: 'kancelarija@example.test', phone: '000 000 105 (demo)' },
  { id: 'c6', name: 'Porodica Testić', type: 'Privatni kupac', email: 'testic@example.test', phone: '000 000 106 (demo)' },
];

export const locations: Location[] = [
  { id: 'l1', customerId: 'c1', name: 'Demo kuća Tuzla', address: 'Primjer ulica 12', city: 'Tuzla' },
  { id: 'l2', customerId: 'c2', name: 'Demo poslovni prostor', address: 'Ulica Primjera 4', city: 'Tuzla' },
  { id: 'l3', customerId: 'c2', name: 'Demo skladište', address: 'Industrijska zona bb (demo)', city: 'Lukavac' },
  { id: 'l4', customerId: 'c3', name: 'Demo stan Sarajevo', address: 'Ogledna ulica 7', city: 'Sarajevo' },
  { id: 'l5', customerId: 'c4', name: 'Demo pansion — glavna zgrada', address: 'Planinski put 1 (demo)', city: 'Travnik' },
  { id: 'l6', customerId: 'c4', name: 'Demo pansion — depandansa', address: 'Planinski put 3 (demo)', city: 'Travnik' },
  { id: 'l7', customerId: 'c5', name: 'Demo kancelarija Mostar', address: 'Ulica Uzorka 21', city: 'Mostar' },
  { id: 'l8', customerId: 'c6', name: 'Demo kuća Zenica', address: 'Probna ulica 9', city: 'Zenica' },
];

export const technicians: Technician[] = [
  { id: 't1', name: 'Amar Begić', initials: 'AB', area: 'Tuzla i okolina' },
  { id: 't2', name: 'Lejla Kovačević', initials: 'LK', area: 'Srednja Bosna i Hercegovina' },
];

interface DeviceSeed {
  id: string;
  name: string;
  kind: DeviceKind;
  typeLabel: string;
  locationId: string;
  intervalMonths: number;
  /** Koliko dana od danas pada sljedeći servis (negativno = zakasnio). */
  nextIn?: number;
  /** Završeni servis prije N dana — tada se sljedeći servis računa iz intervala. */
  completedAgo?: number;
  /** Uređaj ugrađen prije N mjeseci, bez servisa do sada. */
  installedMonthsAgo?: number;
  note?: string;
}

const PUMP_AW = 'Toplotna pumpa zrak–voda';
const PUMP_GW = 'Toplotna pumpa zemlja–voda';
const SPLIT = 'Split klima uređaj';
const MULTI = 'Multi-split klima uređaj';
const CASSETTE = 'Kasetna klima';
const DUCT = 'Kanalna klima';

const deviceSeeds: DeviceSeed[] = [
  { id: 'TP-001', name: 'Toplotna pumpa — grijanje kuće', kind: 'pumpa', typeLabel: PUMP_AW, locationId: 'l1', intervalMonths: 12, nextIn: 12, note: 'Glavni uređaj za demo vodič.' },
  { id: 'TP-002', name: 'Toplotna pumpa — glavna kotlovnica', kind: 'pumpa', typeLabel: PUMP_AW, locationId: 'l5', intervalMonths: 12, nextIn: -20 },
  { id: 'TP-003', name: 'Toplotna pumpa — grijanje i topla voda', kind: 'pumpa', typeLabel: PUMP_AW, locationId: 'l8', intervalMonths: 12, completedAgo: 25 },
  { id: 'TP-004', name: 'Toplotna pumpa — depandansa', kind: 'pumpa', typeLabel: PUMP_AW, locationId: 'l6', intervalMonths: 12, nextIn: 0 },
  { id: 'TP-005', name: 'Toplotna pumpa — skladište', kind: 'pumpa', typeLabel: PUMP_GW, locationId: 'l3', intervalMonths: 12, nextIn: 95 },
  { id: 'TP-006', name: 'Toplotna pumpa — stan', kind: 'pumpa', typeLabel: PUMP_AW, locationId: 'l4', intervalMonths: 12, nextIn: -6 },
  { id: 'TP-007', name: 'Toplotna pumpa — kancelarije', kind: 'pumpa', typeLabel: PUMP_AW, locationId: 'l7', intervalMonths: 12, nextIn: 5 },
  { id: 'TP-008', name: 'Toplotna pumpa — poslovni prostor', kind: 'pumpa', typeLabel: PUMP_AW, locationId: 'l2', intervalMonths: 12, nextIn: 150 },

  { id: 'KL-001', name: 'Klima — kancelarija direktora', kind: 'klima', typeLabel: SPLIT, locationId: 'l2', intervalMonths: 12, nextIn: 60 },
  { id: 'KL-002', name: 'Klima — prodajni prostor', kind: 'klima', typeLabel: CASSETTE, locationId: 'l2', intervalMonths: 6, nextIn: 0, note: 'Drugi primjer u demou. Interval od 6 mjeseci je DEMO postavka.' },
  { id: 'KL-003', name: 'Klima — recepcija', kind: 'klima', typeLabel: SPLIT, locationId: 'l2', intervalMonths: 12, nextIn: -35 },
  { id: 'KL-004', name: 'Klima — dnevni boravak', kind: 'klima', typeLabel: SPLIT, locationId: 'l4', intervalMonths: 12, completedAgo: 12 },
  { id: 'KL-005', name: 'Klima — sobe na spratu', kind: 'klima', typeLabel: MULTI, locationId: 'l5', intervalMonths: 12, nextIn: 20 },
  { id: 'KL-006', name: 'Klima — restoran', kind: 'klima', typeLabel: SPLIT, locationId: 'l5', intervalMonths: 12, nextIn: 3 },
  { id: 'KL-007', name: 'Klima — apartman 1', kind: 'klima', typeLabel: SPLIT, locationId: 'l6', intervalMonths: 12, nextIn: 0 },
  { id: 'KL-008', name: 'Klima — apartman 2', kind: 'klima', typeLabel: SPLIT, locationId: 'l6', intervalMonths: 12, nextIn: -2 },
  { id: 'KL-009', name: 'Kasetna klima — sala za sastanke, drugi sprat, istočno krilo zgrade', kind: 'klima', typeLabel: CASSETTE, locationId: 'l7', intervalMonths: 12, nextIn: 180 },
  { id: 'KL-010', name: 'Klima — otvoreni ured', kind: 'klima', typeLabel: SPLIT, locationId: 'l7', intervalMonths: 12, nextIn: 0 },
  { id: 'KL-011', name: 'Klima — spavaća soba', kind: 'klima', typeLabel: SPLIT, locationId: 'l8', intervalMonths: 12, completedAgo: 40 },
  { id: 'KL-012', name: 'Klima — potkrovlje', kind: 'klima', typeLabel: SPLIT, locationId: 'l1', intervalMonths: 12, nextIn: 40 },
  { id: 'KL-013', name: 'Klima — kancelarija skladišta', kind: 'klima', typeLabel: SPLIT, locationId: 'l3', intervalMonths: 12, nextIn: 45 },
  { id: 'KL-014', name: 'Klima — skladišni prostor', kind: 'klima', typeLabel: DUCT, locationId: 'l3', intervalMonths: 12, nextIn: 6 },
  { id: 'KL-015', name: 'Klima — dnevni boravak', kind: 'klima', typeLabel: SPLIT, locationId: 'l1', intervalMonths: 12, nextIn: 25 },
  { id: 'KL-016', name: 'Klima — dječija soba', kind: 'klima', typeLabel: SPLIT, locationId: 'l8', intervalMonths: 12, installedMonthsAgo: 2 },
];

function modelFor(seed: DeviceSeed): string {
  const code = seed.kind === 'pumpa' ? 'TP' : seed.typeLabel === CASSETTE ? 'KK' : seed.typeLabel === DUCT ? 'KN' : 'KS';
  return `Demo model ${code}-${seed.id.slice(-2)} (demonstracijski)`;
}

function buildDevices(today: CivilDate): Device[] {
  return deviceSeeds.map((s, i) => {
    let lastServiceOn: CivilDate | null;
    let nextServiceOn: CivilDate;
    let installedOn: CivilDate;
    if (s.installedMonthsAgo !== undefined) {
      installedOn = addMonths(today, -s.installedMonthsAgo);
      lastServiceOn = null;
      nextServiceOn = addMonths(installedOn, s.intervalMonths);
    } else if (s.completedAgo !== undefined) {
      lastServiceOn = addDays(today, -s.completedAgo);
      nextServiceOn = addMonths(lastServiceOn, s.intervalMonths);
      installedOn = addMonths(lastServiceOn, -s.intervalMonths * (2 + (i % 2)));
    } else {
      nextServiceOn = addDays(today, s.nextIn ?? 30);
      lastServiceOn = addMonths(nextServiceOn, -s.intervalMonths);
      installedOn = addMonths(lastServiceOn, -s.intervalMonths * (1 + (i % 3)));
    }
    return {
      id: s.id,
      name: s.name,
      kind: s.kind,
      typeLabel: s.typeLabel,
      model: modelFor(s),
      serial: `DEMO-SN-${s.id.replace('-', '')}`,
      locationId: s.locationId,
      installedOn,
      intervalMonths: s.intervalMonths,
      lastServiceOn,
      nextServiceOn,
      note: s.note ?? '',
      history: [],
      status: 'aktivan' as const,
      label: null,
    };
  });
}

function answered(kind: DeviceKind, notes: Record<string, string>, attention: string[] = []): ChecklistEntry[] {
  return checklistFor(kind).map((item) => ({
    ...item,
    answer: attention.includes(item.id) ? 'paznja' : 'uredno',
    note: notes[item.id] ?? '',
  }));
}

interface OrderSeed extends Partial<Omit<WorkOrder, 'items'>> {
  id: string;
  date: CivilDate;
  start: string;
  /** Uređaji u posjeti; prvi je glavni. */
  devices: string[];
  /** Za završene primjere: popunjene kontrolne liste po uređaju. */
  filled?: Record<string, { checklist: ChecklistEntry[]; note?: string }>;
}

/** N-ti radni dan (pon–pet) nakon datuma. */
export function nextWorkday(from: CivilDate, n: number): CivilDate {
  let d = from;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
    if (wd !== 0 && wd !== 6) left -= 1;
  }
  return d;
}

function itemFor(device: Device, filled?: { checklist: ChecklistEntry[]; note?: string }, at?: number): OrderItem {
  return {
    deviceId: device.id,
    checklist: filled?.checklist ?? checklistFor(device.kind),
    note: filled?.note ?? '',
    photos: [],
    identifiedAt: filled ? (at ?? null) : null,
    identifiedBy: filled ? 'qr' : null,
    done: Boolean(filled),
  };
}

export function createInitialState(today: CivilDate, now: number = Date.now()): DemoState {
  const devices = buildDevices(today);
  const nextOf = (id: string) => devices.find((d) => d.id === id)?.nextServiceOn ?? null;
  const mk = ({ devices: ids, filled, ...o }: OrderSeed): WorkOrder => {
    const list = ids.map((id) => devices.find((d) => d.id === id)!);
    const at = Date.parse(`${o.date}T${o.start}:00+02:00`) + 10 * 60_000;
    return {
      requestId: null,
      reason: 'Redovni servis prema intervalu (DEMO interval).',
      category: 'Redovni servis',
      durationMin: 90,
      technicianId: null,
      status: 'planiran',
      notes: '',
      startedAt: null,
      timeSpentMin: null,
      materials: '',
      recommendation: '',
      completedOn: null,
      nextServiceOn: null,
      customerAck: '',
      ...o,
      deviceId: list[0]!.id,
      locationId: list[0]!.locationId,
      items: list.map((d) => itemFor(d, filled?.[d.id], at)),
    };
  };

  const workOrders: WorkOrder[] = [
    mk({
        id: 'NAL-0101',
        devices: ['TP-003'],
        date: addDays(today, -25),
        start: '09:00',
        technicianId: 't1',
        status: 'zavrsen',
        filled: {
          'TP-003': {
            checklist: answered('pumpa', {
              alarmi: 'Na upravljaču nije bilo prikazanih poruka u trenutku posjete (primjer zapisa).',
              opazanja: 'Kupac nije prijavio smetnje u radu.',
              rezultat: 'Uređaj pregledan prema demo obrascu.',
            }),
          },
        },
        notes: 'Pregled obavljen prema dogovoru s kupcem. Pristup vanjskoj jedinici uredan.',
        timeSpentMin: 75,
        materials: 'Bez utroška materijala (primjer).',
        recommendation: 'Nastaviti sa redovnim servisom prema dogovorenom intervalu.',
        completedOn: addDays(today, -25),
        nextServiceOn: nextOf('TP-003'),
        customerAck: 'Porodica Testić (primjer potvrde)',
      }),
    mk({
        id: 'NAL-0102',
        devices: ['KL-011'],
        date: addDays(today, -40),
        start: '13:00',
        technicianId: 't2',
        status: 'zavrsen',
        filled: {
          'KL-011': {
            checklist: answered(
              'klima',
              {
                filter: 'Filter zaprljan; očišćen (primjer zapisa).',
                opazanja: 'Kupac je naveo blag miris pri pokretanju.',
                rezultat: 'Nakon čišćenja kupac nije primijetio miris.',
              },
              ['filter'],
            ),
          },
        },
        notes: 'Kupcu objašnjeno kako sam provjerava filter između servisa.',
        timeSpentMin: 60,
        materials: 'Sredstvo za čišćenje (primjer stavke).',
        recommendation: 'Provjeriti filter ponovo pri sljedećem servisu.',
        completedOn: addDays(today, -40),
        nextServiceOn: nextOf('KL-011'),
        customerAck: 'Porodica Testić (primjer potvrde)',
      }),
    mk({
        id: 'NAL-0103',
        devices: ['KL-004'],
        date: addDays(today, -12),
        start: '10:30',
        technicianId: 't2',
        status: 'zavrsen',
        filled: {
          'KL-004': {
            checklist: answered('klima', {
              opazanja: 'Bez posebnih opažanja.',
              rezultat: 'Uređaj pregledan prema demo obrascu.',
            }),
          },
        },
        notes: 'Redovan pregled. Kupac zadovoljan radom uređaja.',
        timeSpentMin: 55,
        materials: 'Bez utroška materijala (primjer).',
        recommendation: 'Bez dodatnih preporuka do sljedećeg servisa.',
        completedOn: addDays(today, -12),
        nextServiceOn: nextOf('KL-004'),
        customerAck: 'Porodica Primjerović (primjer potvrde)',
      }),
    mk({ id: 'NAL-0110', devices: ['TP-004'], date: today, start: '09:00', technicianId: 't2' }),
    mk({ id: 'NAL-0111', devices: ['KL-002', 'KL-001'], date: today, start: '11:00', technicianId: 't1', durationMin: 90, reason: 'Redovni servis KL-002 (interval 6 mjeseci, DEMO) i pregled KL-001 u istoj posjeti.' }),
    mk({ id: 'NAL-0112', devices: ['KL-008', 'KL-007'], date: today, start: '14:00', technicianId: 't1', durationMin: 90, reason: 'Redovni servis dva uređaja u depandansi (jedan je zakasnio).' }),
    mk({ id: 'NAL-0113', devices: ['KL-010'], date: today, start: '13:00', technicianId: 't2', durationMin: 60 }),
    mk({ id: 'NAL-0114', devices: ['TP-007'], date: nextWorkday(today, 1), start: '10:00', technicianId: 't1' }),
    mk({ id: 'NAL-0115', devices: ['KL-006'], date: nextWorkday(today, 2), start: '09:00', technicianId: 't2', requestId: 'ZHT-030', durationMin: 60 }),
    mk({ id: 'NAL-0116', devices: ['KL-014', 'KL-013'], date: nextWorkday(today, 3), start: '12:00', technicianId: null, durationMin: 90 }),
    mk({ id: 'NAL-0117', devices: ['KL-005'], date: nextWorkday(today, 4), start: '10:00', technicianId: 't2', status: 'otkazan', reason: 'Redovni servis — kupac je zamolio novi termin (primjer).' }),
  ];

  const historyFor: Record<string, Device['history']> = {
    'TP-001': [
      { date: devices[0]!.lastServiceOn!, title: 'Redovni servis', technicianId: 't1', summary: 'Pregled prema demo obrascu. Bez posebnih opažanja (primjer).' },
      { date: devices[0]!.installedOn, title: 'Ugradnja', technicianId: 't1', summary: 'Ugradnja i upoznavanje kupca s radom uređaja (primjer).' },
    ],
    'KL-002': [
      { date: devices[9]!.lastServiceOn!, title: 'Redovni servis', technicianId: 't1', summary: 'Pregled i čišćenje prema demo obrascu (primjer).' },
      { date: addMonths(devices[9]!.lastServiceOn!, -6), title: 'Redovni servis', technicianId: 't2', summary: 'Pregled prema demo obrascu (primjer).' },
    ],
  };

  for (const d of devices) {
    const extra = historyFor[d.id];
    if (extra) d.history = extra;
    const done = workOrders.find((w) => w.items.some((i) => i.deviceId === d.id) && w.status === 'zavrsen');
    if (done && done.completedOn) {
      d.history = [
        { date: done.completedOn, title: 'Redovni servis', technicianId: done.technicianId ?? 't1', summary: done.recommendation, workOrderId: done.id },
        { date: addMonths(done.completedOn, -d.intervalMonths), title: 'Redovni servis', technicianId: done.technicianId === 't1' ? 't2' : 't1', summary: 'Pregled prema demo obrascu (primjer).' },
      ];
    }
    if (d.history.length === 0 && d.lastServiceOn) {
      d.history = [{ date: d.lastServiceOn, title: 'Redovni servis', technicianId: d.locationId === 'l1' || d.locationId === 'l2' || d.locationId === 'l3' ? 't1' : 't2', summary: 'Pregled prema demo obrascu (primjer).' }];
    }
    if (d.lastServiceOn === null) {
      d.history = [{ date: d.installedOn, title: 'Ugradnja', technicianId: 't2', summary: 'Ugradnja uređaja (primjer).' }];
    }
  }

  const hour = 3_600_000;
  const requests: ServiceRequest[] = [
    {
      id: 'ZHT-032',
      kind: 'kvar',
      deviceId: 'TP-006',
      name: 'Porodica Primjerović',
      contact: 'primjerovic@example.test',
      preferredDate: null,
      preferredSlot: '',
      note: 'Uređaj ne grije kao ranije, na upravljaču se pojavila poruka (primjer opisa).',
      errorCode: '',
      photo: null,
      symptom: 'Ne grije',
      urgent: true,
      status: 'na_cekanju',
      createdAt: now - 2 * hour,
      fromSimulation: false,
      workOrderId: null,
    },
    {
      id: 'ZHT-031',
      kind: 'servis',
      deviceId: 'KL-003',
      name: 'Demo Poslovni Centar — recepcija',
      contact: 'recepcija@example.test',
      preferredDate: addDays(today, 3),
      preferredSlot: 'Prijepodne (08–12)',
      note: 'Molimo termin prije početka radnog vremena (primjer).',
      errorCode: '',
      photo: null,
      symptom: '',
      urgent: false,
      status: 'na_cekanju',
      createdAt: now - 20 * hour,
      fromSimulation: false,
      workOrderId: null,
    },
    {
      id: 'ZHT-030',
      kind: 'servis',
      deviceId: 'KL-006',
      name: 'Demo Pansion Planina',
      contact: 'pansion@example.test',
      preferredDate: addDays(today, 3),
      preferredSlot: 'Prijepodne (08–12)',
      note: '',
      errorCode: '',
      photo: null,
      symptom: '',
      urgent: false,
      status: 'potvrdjen',
      createdAt: now - 46 * hour,
      fromSimulation: false,
      workOrderId: 'NAL-0115',
    },
    {
      id: 'ZHT-029',
      kind: 'servis',
      deviceId: 'KL-005',
      name: 'Demo Pansion Planina',
      contact: 'pansion@example.test',
      preferredDate: addDays(today, 1),
      preferredSlot: 'Poslijepodne (12–16)',
      note: 'Termin više nije potreban (primjer).',
      errorCode: '',
      photo: null,
      symptom: '',
      urgent: false,
      status: 'odbijen',
      createdAt: now - 70 * hour,
      fromSimulation: false,
      workOrderId: null,
    },
  ];

  const activity: Activity[] = [
    { id: 'a3', at: now - 2 * hour, text: 'Primjer prijave kvara ZHT-032 za TP-006 čeka pregled.', href: '/demo/zahtjevi' },
    { id: 'a2', at: now - 20 * hour, text: 'Primjer zahtjeva za servis ZHT-031 za KL-003.', href: '/demo/zahtjevi' },
    { id: 'a1', at: now - 12 * 24 * hour, text: 'Završen primjer naloga NAL-0103 (KL-004).', href: '/demo/izvjestaji/NAL-0103' },
  ];

  return {
    version: DEMO_STATE_VERSION,
    anchor: today,
    customers: structuredClone(customers),
    locations: structuredClone(locations),
    technicians: structuredClone(technicians),
    devices,
    requests,
    workOrders,
    activity,
    proposals: [
      {
        id: 'PRJ-001',
        locationId: 'l5',
        deviceIds: ['TP-002'],
        dueOn: nextOf('TP-002') ?? today,
        channel: 'email',
        slots: [
          { date: nextWorkday(today, 2), start: '13:00', technicianId: 't2' },
          { date: nextWorkday(today, 3), start: '09:00', technicianId: 't2' },
          { date: nextWorkday(today, 5), start: '09:00', technicianId: 't1' },
        ],
        durationMin: 90,
        status: 'poslan',
        chosen: null,
        reason: '',
        sentAt: now - 26 * hour,
        respondedAt: null,
        workOrderId: null,
      },
      {
        id: 'PRJ-002',
        locationId: 'l7',
        deviceIds: ['TP-007'],
        dueOn: nextOf('TP-007') ?? today,
        channel: 'sms',
        slots: [
          { date: nextWorkday(today, 1), start: '10:00', technicianId: 't1' },
          { date: nextWorkday(today, 4), start: '13:00', technicianId: 't1' },
        ],
        durationMin: 90,
        status: 'prihvacen',
        chosen: 0,
        reason: '',
        sentAt: now - 4 * 24 * hour,
        respondedAt: now - 3 * 24 * hour,
        workOrderId: 'NAL-0114',
      },
    ],
    labels: Array.from({ length: 12 }, (_, i) => ({ code: `N-${String(i + 1).padStart(4, '0')}`, deviceId: null })),
    guide: { visitedDevice: false, visitedCustomer: false, requestId: null, viewedReport: false, dismissed: false },
    counters: { request: 0, workOrder: 117, device: 0, proposal: 2, customer: 6 },
  };
}
