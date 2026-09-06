import type { Dart, Multiplier, Player } from '../types';

export function dartValue(d: Dart): number {
  if (d.v === 0) return 0;
  if (d.v === 25) return d.m === 1 ? 25 : 50;
  return d.v * d.m;
}

export function isValidDart(v: number, m: Multiplier): boolean {
  if (v === 0) return m === 1;
  if (v === 25) return m === 1 || m === 2;
  return Number.isInteger(v) && v >= 1 && v <= 20;
}

export function dartLabel(d: Dart): string {
  if (d.v === 0) return 'Miss';
  if (d.v === 25) return d.m === 1 ? '25' : 'Bull';
  if (d.m === 2) return `D${d.v}`;
  if (d.m === 3) return `T${d.v}`;
  return String(d.v);
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Name of whoever throws for `side` on its `turnIndex`-th turn (0-based). */
export function throwerName(side: Player, turnIndex: number): string {
  if (!side.members || side.members.length === 0) return side.name;
  return side.members[turnIndex % side.members.length];
}

export function isTeam(side: Player): boolean {
  return !!side.members && side.members.length > 1;
}
