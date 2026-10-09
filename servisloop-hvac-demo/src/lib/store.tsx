'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { checklistFor, installChecklist } from './checklists';
import { addMonths, todayInZone, type CivilDate } from './dates';
import { createInitialState, DEMO_STATE_VERSION } from './demo-data';
import type { Customer, DemoState, Device, DeviceKind, GuideState, Location, OrderItem, Proposal, ProposalSlot, RequestKind, ServiceRequest, WorkOrder } from './types';

/**
 * Lokalno stanje probe. Živi samo u ovom browser tabu (sessionStorage), pa vlasnik,
 * serviser i kupac otvoreni u istom tabu vide iste promjene. Novi tab, drugi browser
 * ili telefon počinju od početnog primjera. Ništa se ne šalje na server.
 */
const STORAGE_KEY = 'servisloop-klima-demo';

type Action =
  | { type: 'replace'; state: DemoState }
  | { type: 'reset'; today: CivilDate }
  | { type: 'addDevice'; device: Device }
  | { type: 'updateDevice'; id: string; patch: Partial<Device> }
  | { type: 'addRequest'; request: ServiceRequest }
  | { type: 'confirmRequest'; requestId: string; order: WorkOrder }
  | { type: 'rejectRequest'; requestId: string }
  | { type: 'addOrder'; order: WorkOrder }
  | { type: 'updateOrder'; id: string; patch: Partial<WorkOrder> }
  | { type: 'updateItem'; id: string; deviceId: string; patch: Partial<OrderItem> }
  | { type: 'addItem'; id: string; item: OrderItem }
  | { type: 'completeOrder'; id: string }
  | { type: 'planInstall'; customer: Customer | null; location: Location | null; device: Device; order: WorkOrder }
  | { type: 'onSiteDevice'; orderId: string; device: Device; item: OrderItem }
  | { type: 'sendProposal'; proposal: Proposal }
  | { type: 'respondProposal'; id: string; patch: Partial<Proposal>; order: WorkOrder | null }
  | { type: 'guide'; patch: Partial<GuideState> };

function log(state: DemoState, text: string, href: string | null): DemoState['activity'] {
  const entry = { id: `act-${Date.now()}-${state.activity.length}`, at: Date.now(), text, href };
  return [entry, ...state.activity].slice(0, 30);
}

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'replace':
      return action.state;
    case 'reset':
      return createInitialState(action.today);
    case 'addDevice':
      return {
        ...state,
        devices: [...state.devices, action.device],
        counters: { ...state.counters, device: state.counters.device + 1 },
        activity: log(state, `Dodan demo uređaj ${action.device.id}.`, `/demo/uredaji/${action.device.id}`),
      };
    case 'updateDevice':
      return {
        ...state,
        devices: state.devices.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)),
        activity: log(state, `Izmijenjen demo uređaj ${action.id}.`, `/demo/uredaji/${action.id}`),
      };
    case 'addRequest': {
      const r = action.request;
      const label = r.kind === 'servis' ? 'zahtjev za servis' : 'prijava kvara';
      return {
        ...state,
        requests: [r, ...state.requests],
        counters: { ...state.counters, request: state.counters.request + 1 },
        guide: r.fromSimulation && !state.guide.requestId ? { ...state.guide, requestId: r.id } : state.guide,
        activity: log(state, `Simuliran ${label} ${r.id} za ${r.deviceId} (prikaz kupca).`, '/demo/zahtjevi'),
      };
    }
    case 'confirmRequest': {
      const o = action.order;
      return {
        ...state,
        requests: state.requests.map((r) => (r.id === action.requestId ? { ...r, status: 'potvrdjen', workOrderId: o.id } : r)),
        workOrders: [...state.workOrders, o],
        counters: { ...state.counters, workOrder: state.counters.workOrder + 1 },
        activity: log(state, `Zahtjev ${action.requestId} potvrđen u demou; kreiran nalog ${o.id}.`, `/demo/nalozi/${o.id}`),
      };
    }
    case 'rejectRequest':
      return {
        ...state,
        requests: state.requests.map((r) => (r.id === action.requestId ? { ...r, status: 'odbijen' } : r)),
        activity: log(state, `Zahtjev ${action.requestId} odbijen u demou.`, '/demo/zahtjevi'),
      };
    case 'addOrder':
      return {
        ...state,
        workOrders: [...state.workOrders, action.order],
        counters: { ...state.counters, workOrder: state.counters.workOrder + 1 },
        activity: log(state, `Planiran demo nalog ${action.order.id} za ${action.order.deviceId}.`, `/demo/nalozi/${action.order.id}`),
      };
    case 'updateOrder': {
      const before = state.workOrders.find((w) => w.id === action.id);
      let activity = state.activity;
      if (before && action.patch.technicianId !== undefined && action.patch.technicianId !== before.technicianId) {
        const t = state.technicians.find((x) => x.id === action.patch.technicianId);
        activity = log(state, `Nalog ${action.id} dodijeljen: ${t?.name ?? 'serviser'} (demo).`, `/demo/nalozi/${action.id}`);
      } else if (before && action.patch.status && action.patch.status !== before.status) {
        const label = action.patch.status === 'u_radu' ? 'pokrenut' : action.patch.status === 'otkazan' ? 'otkazan' : 'ažuriran';
        activity = log(state, `Demo nalog ${action.id} ${label}.`, `/demo/nalozi/${action.id}`);
      }
      return { ...state, activity, workOrders: state.workOrders.map((w) => (w.id === action.id ? { ...w, ...action.patch } : w)) };
    }
    case 'updateItem': {
      const order = state.workOrders.find((w) => w.id === action.id);
      const item = order?.items.find((i) => i.deviceId === action.deviceId);
      let activity = state.activity;
      if (item && action.patch.identifiedBy && !item.identifiedBy) {
        const how = action.patch.identifiedBy === 'qr' ? 'skeniranjem QR koda' : 'ručnim unosom oznake';
        activity = log(state, `Serviser je identifikovao ${action.deviceId} ${how} (nalog ${action.id}).`, `/demo/nalozi/${action.id}`);
      }
      return {
        ...state,
        activity,
        workOrders: state.workOrders.map((w) =>
          w.id === action.id ? { ...w, items: w.items.map((i) => (i.deviceId === action.deviceId ? { ...i, ...action.patch } : i)) } : w,
        ),
      };
    }
    case 'addItem':
      return {
        ...state,
        workOrders: state.workOrders.map((w) => (w.id === action.id ? { ...w, items: [...w.items, action.item] } : w)),
        activity: log(state, `Uređaj ${action.item.deviceId} dodan na nalog ${action.id} na licu mjesta.`, `/demo/nalozi/${action.id}`),
      };
    case 'completeOrder': {
      const order = state.workOrders.find((w) => w.id === action.id);
      if (!order) return state;
      const today = state.anchor;
      const doneIds = new Set(order.items.filter((i) => i.done).map((i) => i.deviceId));
      const primary = state.devices.find((d) => d.id === order.deviceId);
      const next = primary ? addMonths(today, primary.intervalMonths) : null;
      const minutes = order.startedAt ? Math.max(5, Math.round((Date.now() - order.startedAt) / 60_000)) : order.durationMin;
      return {
        ...state,
        workOrders: state.workOrders.map((w) =>
          w.id === action.id ? { ...w, status: 'zavrsen', completedOn: today, nextServiceOn: next, timeSpentMin: w.timeSpentMin ?? minutes } : w,
        ),
        devices: state.devices.map((d) => {
          if (!doneIds.has(d.id)) return d;
          const item = order.items.find((i) => i.deviceId === d.id);
          if (d.status === 'ugradnja') {
            // Ugradnja završena: uređaj postaje aktivan, a prvi servis automatski ulazi u plan.
            return {
              ...d,
              status: 'aktivan',
              installedOn: today,
              lastServiceOn: null,
              nextServiceOn: addMonths(today, d.intervalMonths),
              history: [{ date: today, title: 'Ugradnja', technicianId: order.technicianId ?? 't1', summary: item?.note || 'Uređaj ugrađen i predat kupcu (demo).', workOrderId: order.id }, ...d.history],
            };
          }
          return {
            ...d,
            lastServiceOn: today,
            nextServiceOn: addMonths(today, d.intervalMonths),
            history: [
              { date: today, title: order.category, technicianId: order.technicianId ?? 't1', summary: item?.note || order.recommendation || 'Demo nalog završen.', workOrderId: order.id },
              ...d.history,
            ],
          };
        }),
        activity: log(state, `Završen demo nalog ${order.id} (${order.items.map((i) => i.deviceId).join(', ')}).`, `/demo/izvjestaji/${order.id}`),
      };
    }
    case 'planInstall':
      return {
        ...state,
        customers: action.customer ? [...state.customers, action.customer] : state.customers,
        locations: action.location ? [...state.locations, action.location] : state.locations,
        devices: [...state.devices, action.device],
        workOrders: [...state.workOrders, action.order],
        counters: {
          ...state.counters,
          device: state.counters.device + 1,
          workOrder: state.counters.workOrder + 1,
          customer: state.counters.customer + (action.customer ? 1 : 0),
        },
        activity: log(state, `Planirana ugradnja ${action.device.id} (${action.order.id}); naljepnica spremna za štampu.`, `/demo/nalozi/${action.order.id}`),
      };
    case 'onSiteDevice':
      return {
        ...state,
        devices: [...state.devices, action.device],
        labels: state.labels.map((l) => (l.code === action.device.label ? { ...l, deviceId: action.device.id } : l)),
        workOrders: state.workOrders.map((w) => (w.id === action.orderId ? { ...w, items: [...w.items, action.item] } : w)),
        counters: { ...state.counters, device: state.counters.device + 1 },
        activity: log(state, `Serviser je na objektu dodao ${action.device.id} i povezao naljepnicu ${action.device.label} (nalog ${action.orderId}).`, `/demo/uredaji/${action.device.id}`),
      };
    case 'sendProposal': {
      const p = action.proposal;
      return {
        ...state,
        proposals: [p, ...state.proposals],
        counters: { ...state.counters, proposal: state.counters.proposal + 1 },
        activity: log(state, `Simuliran prijedlog termina ${p.id} za ${p.deviceIds.join(', ')} (${p.channel === 'email' ? 'e-mail' : 'SMS'}) — nije poslano.`, '/demo/plan'),
      };
    }
    case 'respondProposal': {
      const before = state.proposals.find((p) => p.id === action.id);
      const status = action.patch.status;
      const text =
        status === 'prihvacen'
          ? `Kupac je odabrao termin iz prijedloga ${action.id}; kreiran nalog ${action.order?.id}.`
          : status === 'odgoden'
            ? `Kupac je tražio kasniji podsjetnik (${action.id}).`
            : `Kupac je odbio termin iz prijedloga ${action.id}.`;
      return {
        ...state,
        proposals: state.proposals.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
        workOrders: action.order ? [...state.workOrders, action.order] : state.workOrders,
        counters: action.order ? { ...state.counters, workOrder: state.counters.workOrder + 1 } : state.counters,
        activity: before ? log(state, text, action.order ? `/demo/nalozi/${action.order.id}` : '/demo/plan') : state.activity,
      };
    }
    case 'guide':
      return { ...state, guide: { ...state.guide, ...action.patch } };
    default:
      return state;
  }
}

function load(): DemoState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    return parsed.version === DEMO_STATE_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function save(state: DemoState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Fotografije mogu premašiti prostor taba; sačuvaj primjer bez njih.
    try {
      const slim: DemoState = {
        ...state,
        requests: state.requests.map((r) => ({ ...r, photo: null })),
        workOrders: state.workOrders.map((w) => ({ ...w, items: w.items.map((i) => ({ ...i, photos: [] })) })),
      };
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      /* bez čuvanja — primjer i dalje radi do refreša */
    }
  }
}

export interface NewRequestInput {
  kind: RequestKind;
  deviceId: string;
  name: string;
  contact: string;
  preferredDate: CivilDate | null;
  preferredSlot: string;
  note: string;
  errorCode: string;
  photo: ServiceRequest['photo'];
  symptom: string;
  urgent: boolean;
}

export interface NewDeviceInput {
  kind: DeviceKind;
  typeLabel: string;
  name: string;
  model: string;
  serial: string;
  intervalMonths: number;
  /** true = uređaj se upravo ugrađuje; false = postojeći uređaj koji nije bio u evidenciji. */
  newInstall: boolean;
}

export interface InstallInput {
  locationId: string | null;
  newCustomer: { name: string; type: Customer['type']; email: string; locationName: string; address: string; city: string } | null;
  device: Omit<NewDeviceInput, 'newInstall' | 'serial'>;
  technicianId: string;
  date: CivilDate;
  start: string;
  durationMin: number;
}

export interface ScheduleInput {
  technicianId: string;
  date: CivilDate;
  start: string;
  durationMin: number;
  /** Dodatni uređaji na istom objektu koji se servisiraju u istoj posjeti. */
  extraDeviceIds?: string[];
}

interface DemoApi {
  state: DemoState;
  ready: boolean;
  reset: () => void;
  addDevice: (d: Omit<Device, 'id' | 'history' | 'lastServiceOn'> & { idPrefix: 'TP' | 'KL' }) => string;
  updateDevice: (id: string, patch: Partial<Device>) => void;
  createRequest: (input: NewRequestInput) => string;
  confirmRequest: (requestId: string, schedule: ScheduleInput) => string | null;
  rejectRequest: (requestId: string) => void;
  planOrder: (deviceId: string, schedule: ScheduleInput, reason: string) => string;
  assignOrder: (orderId: string, schedule: ScheduleInput) => void;
  updateOrder: (orderId: string, patch: Partial<WorkOrder>) => void;
  completeOrder: (orderId: string) => void;
  updateItem: (orderId: string, deviceId: string, patch: Partial<OrderItem>) => void;
  addItem: (orderId: string, deviceId: string) => void;
  planInstall: (input: InstallInput) => { deviceId: string; orderId: string };
  addOnSiteDevice: (orderId: string, labelCode: string, input: NewDeviceInput) => string;
  sendProposal: (input: Omit<Proposal, 'id' | 'status' | 'chosen' | 'reason' | 'sentAt' | 'respondedAt' | 'workOrderId'>) => string;
  acceptProposal: (id: string, slotIndex: number) => string | null;
  declineProposal: (id: string, status: 'odbijen' | 'odgoden', reason: string) => void;
  setGuide: (patch: Partial<GuideState>) => void;
}

const DemoContext = createContext<DemoApi | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState(todayInZone()));
  const [ready, setReady] = useState(false);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    const stored = load();
    if (stored) dispatch({ type: 'replace', state: stored });
    else dispatch({ type: 'reset', today: todayInZone() });
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save(state);
  }, [state, ready]);

  const nextOrderId = () => `NAL-${String(ref.current.counters.workOrder + 1).padStart(4, '0')}`;

  const nextDeviceId = (prefix: 'TP' | 'KL') => {
    const used = new Set(ref.current.devices.map((d) => d.id));
    let n = ref.current.devices.filter((d) => d.id.startsWith(prefix)).length + 1;
    while (used.has(`${prefix}-${String(n).padStart(3, '0')}`)) n += 1;
    return `${prefix}-${String(n).padStart(3, '0')}`;
  };

  const makeItem = useCallback((deviceId: string): OrderItem => {
    const device = ref.current.devices.find((d) => d.id === deviceId);
    return { deviceId, checklist: checklistFor(device?.kind ?? 'klima'), note: '', photos: [], identifiedAt: null, identifiedBy: null, done: false };
  }, []);

  const makeOrder = useCallback((deviceId: string, schedule: ScheduleInput, extra: Partial<WorkOrder>): WorkOrder => {
    const device = ref.current.devices.find((d) => d.id === deviceId);
    const ids = [deviceId, ...(schedule.extraDeviceIds ?? []).filter((x) => x !== deviceId)];
    return {
      id: nextOrderId(),
      deviceId,
      locationId: device?.locationId ?? '',
      items: ids.map(makeItem),
      requestId: null,
      reason: 'Redovni servis prema intervalu (DEMO interval).',
      category: 'Redovni servis',
      date: schedule.date,
      start: schedule.start,
      durationMin: schedule.durationMin,
      technicianId: schedule.technicianId,
      status: 'planiran',
      notes: '',
      startedAt: null,
      timeSpentMin: null,
      materials: '',
      recommendation: '',
      completedOn: null,
      nextServiceOn: null,
      customerAck: '',
      ...extra,
    };
  }, [makeItem]);

  const api = useMemo<DemoApi>(
    () => ({
      state,
      ready,
      reset: () => dispatch({ type: 'reset', today: todayInZone() }),
      addDevice: (input) => {
        const { idPrefix, ...rest } = input;
        const used = new Set(ref.current.devices.map((d) => d.id));
        let n = ref.current.devices.filter((d) => d.id.startsWith(idPrefix)).length + 1;
        while (used.has(`${idPrefix}-${String(n).padStart(3, '0')}`)) n += 1;
        const id = `${idPrefix}-${String(n).padStart(3, '0')}`;
        dispatch({
          type: 'addDevice',
          device: { ...rest, id, lastServiceOn: null, history: [{ date: rest.installedOn, title: 'Ugradnja', technicianId: 't1', summary: 'Uređaj dodan u demo primjer.' }] },
        });
        return id;
      },
      updateDevice: (id, patch) => dispatch({ type: 'updateDevice', id, patch }),
      createRequest: (input) => {
        const id = `DEMO-${String(ref.current.counters.request + 1).padStart(3, '0')}`;
        dispatch({ type: 'addRequest', request: { ...input, id, status: 'na_cekanju', createdAt: Date.now(), fromSimulation: true, workOrderId: null } });
        return id;
      },
      confirmRequest: (requestId, schedule) => {
        const r = ref.current.requests.find((x) => x.id === requestId);
        if (!r) return null;
        const order = makeOrder(r.deviceId, schedule, {
          requestId,
          category: r.kind === 'kvar' ? 'Prijava kvara' : 'Redovni servis',
          reason:
            r.kind === 'kvar'
              ? `Prijava kvara od kupca${r.urgent ? ' (uređaj ne radi)' : ''}: ${[r.symptom, r.note].filter(Boolean).join(' — ') || 'bez opisa'}`
              : `Zahtjev kupca za servis${r.note ? `: ${r.note}` : '.'}`,
        });
        dispatch({ type: 'confirmRequest', requestId, order });
        return order.id;
      },
      rejectRequest: (requestId) => dispatch({ type: 'rejectRequest', requestId }),
      planOrder: (deviceId, schedule, reason) => {
        const order = makeOrder(deviceId, schedule, { reason });
        dispatch({ type: 'addOrder', order });
        return order.id;
      },
      assignOrder: (orderId, schedule) =>
        dispatch({ type: 'updateOrder', id: orderId, patch: { technicianId: schedule.technicianId, date: schedule.date, start: schedule.start, durationMin: schedule.durationMin } }),
      updateOrder: (orderId, patch) => dispatch({ type: 'updateOrder', id: orderId, patch }),
      completeOrder: (orderId) => dispatch({ type: 'completeOrder', id: orderId }),
      updateItem: (orderId, deviceId, patch) => dispatch({ type: 'updateItem', id: orderId, deviceId, patch }),
      addItem: (orderId, deviceId) => dispatch({ type: 'addItem', id: orderId, item: makeItem(deviceId) }),
      planInstall: (input) => {
        const cur = ref.current;
        let customer: Customer | null = null;
        let location: Location | null = null;
        let locationId = input.locationId ?? '';
        if (input.newCustomer) {
          const n = cur.counters.customer + 1;
          customer = { id: `c${n}`, name: input.newCustomer.name, type: input.newCustomer.type, email: input.newCustomer.email || 'kupac@example.test', phone: 'nije unesen (demo)' };
          location = { id: `l-n${n}`, customerId: customer.id, name: input.newCustomer.locationName, address: input.newCustomer.address, city: input.newCustomer.city };
          locationId = location.id;
        }
        const deviceId = nextDeviceId(input.device.kind === 'pumpa' ? 'TP' : 'KL');
        const device: Device = {
          ...input.device,
          id: deviceId,
          serial: 'upisuje serviser pri ugradnji',
          locationId,
          installedOn: input.date,
          lastServiceOn: null,
          nextServiceOn: addMonths(input.date, input.device.intervalMonths),
          note: 'Najavljen za ugradnju. QR naljepnica ide uz uređaj.',
          history: [],
          status: 'ugradnja',
          label: null,
        };
        const order: WorkOrder = {
          ...makeOrder(deviceId, { technicianId: input.technicianId, date: input.date, start: input.start, durationMin: input.durationMin }, {}),
          locationId,
          category: 'Ugradnja',
          reason: 'Ugradnja novog uređaja. Serviser lijepi QR naljepnicu iz paketa i skenira je prije unosa.',
          items: [{ deviceId, checklist: installChecklist(), note: '', photos: [], identifiedAt: null, identifiedBy: null, done: false }],
        };
        dispatch({ type: 'planInstall', customer, location, device, order });
        return { deviceId, orderId: order.id };
      },
      addOnSiteDevice: (orderId, labelCode, input) => {
        const order = ref.current.workOrders.find((w) => w.id === orderId);
        const today = ref.current.anchor;
        const deviceId = nextDeviceId(input.kind === 'pumpa' ? 'TP' : 'KL');
        const device: Device = {
          id: deviceId,
          name: input.name,
          kind: input.kind,
          typeLabel: input.typeLabel,
          model: input.model || 'model nije upisan',
          serial: input.serial || 'serijski broj nije upisan',
          locationId: order?.locationId ?? '',
          installedOn: today,
          intervalMonths: input.intervalMonths,
          lastServiceOn: null,
          nextServiceOn: addMonths(today, input.intervalMonths),
          note: input.newInstall ? 'Dodan pri ugradnji na licu mjesta.' : 'Postojeći uređaj dodan u evidenciju na licu mjesta; datum ugradnje nije poznat.',
          history: [],
          status: input.newInstall ? 'ugradnja' : 'aktivan',
          label: labelCode,
        };
        const item: OrderItem = {
          deviceId,
          checklist: input.newInstall ? installChecklist() : checklistFor(input.kind),
          note: '',
          photos: [],
          identifiedAt: Date.now(),
          identifiedBy: 'qr',
          done: false,
        };
        dispatch({ type: 'onSiteDevice', orderId, device, item });
        return deviceId;
      },
      sendProposal: (input) => {
        const id = `PRJ-${String(ref.current.counters.proposal + 1).padStart(3, '0')}`;
        dispatch({ type: 'sendProposal', proposal: { ...input, id, status: 'poslan', chosen: null, reason: '', sentAt: Date.now(), respondedAt: null, workOrderId: null } });
        return id;
      },
      acceptProposal: (id, slotIndex) => {
        const p = ref.current.proposals.find((x) => x.id === id);
        const slot: ProposalSlot | undefined = p?.slots[slotIndex];
        if (!p || !slot) return null;
        const order = makeOrder(
          p.deviceIds[0]!,
          { technicianId: slot.technicianId, date: slot.date, start: slot.start, durationMin: p.durationMin, extraDeviceIds: p.deviceIds.slice(1) },
          { reason: `Redovni servis — kupac je odabrao termin iz prijedloga ${p.id}.` },
        );
        dispatch({ type: 'respondProposal', id, patch: { status: 'prihvacen', chosen: slotIndex, respondedAt: Date.now(), workOrderId: order.id }, order });
        return order.id;
      },
      declineProposal: (id, status, reason) => dispatch({ type: 'respondProposal', id, patch: { status, reason, respondedAt: Date.now() }, order: null }),
      setGuide: (patch) => dispatch({ type: 'guide', patch }),
    }),
    [state, ready, makeOrder, makeItem],
  );

  return <DemoContext.Provider value={api}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoApi {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo mora biti unutar DemoProvider');
  return ctx;
}
