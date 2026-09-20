import { RiskTier } from '../types';

export interface TierColorDefinition {
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  fillClass: string;
  bg: string;
  text: string;
  border: string;
}

const GREEN: TierColorDefinition = {
  hex: '#3A7D5C',
  bgClass: 'bg-tier-green',
  textClass: 'text-tier-green',
  borderClass: 'border-tier-green',
  fillClass: 'fill-tier-green',
  bg: 'bg-tier-green',
  text: 'text-tier-green',
  border: 'border-tier-green'
};

const YELLOW: TierColorDefinition = {
  hex: '#C9A227',
  bgClass: 'bg-tier-yellow',
  textClass: 'text-tier-yellow',
  borderClass: 'border-tier-yellow',
  fillClass: 'fill-tier-yellow',
  bg: 'bg-tier-yellow',
  text: 'text-tier-yellow',
  border: 'border-tier-yellow'
};

const ORANGE: TierColorDefinition = {
  hex: '#D9772E',
  bgClass: 'bg-tier-orange',
  textClass: 'text-tier-orange',
  borderClass: 'border-tier-orange',
  fillClass: 'fill-tier-orange',
  bg: 'bg-tier-orange',
  text: 'text-tier-orange',
  border: 'border-tier-orange'
};

const RED: TierColorDefinition = {
  hex: '#C0392B',
  bgClass: 'bg-tier-red',
  textClass: 'text-tier-red',
  borderClass: 'border-tier-red',
  fillClass: 'fill-tier-red',
  bg: 'bg-tier-red',
  text: 'text-tier-red',
  border: 'border-tier-red'
};

export const TIER_COLORS: Record<string, TierColorDefinition> = {
  Green: GREEN,
  green: GREEN,
  Yellow: YELLOW,
  yellow: YELLOW,
  Orange: ORANGE,
  orange: ORANGE,
  Red: RED,
  red: RED
};

export function getTierColor(tier: RiskTier | string) {
  const normalizedKey = typeof tier === 'string' ? tier : 'Green';
  return TIER_COLORS[normalizedKey] || GREEN;
}
