import type { DeviceKind } from './types';

export const TYPE_OPTIONS: Record<DeviceKind, string[]> = {
  klima: ['Split klima uređaj', 'Multi-split klima uređaj', 'Kasetna klima', 'Kanalna klima'],
  pumpa: ['Toplotna pumpa zrak–voda', 'Toplotna pumpa zemlja–voda'],
};

export const INTERVALS = [6, 12, 24];
