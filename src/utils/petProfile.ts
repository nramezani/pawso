export type WeightUnit = 'kg' | 'lb';

const KG_PER_LB = 0.45359237;

export function toKilograms(value: number, unit: WeightUnit) {
  return unit === 'lb' ? value * KG_PER_LB : value;
}

export function fromKilograms(value: number, unit: WeightUnit) {
  return unit === 'lb' ? value / KG_PER_LB : value;
}

export function formatWeight(weightKg: number | null, unit: WeightUnit) {
  if (weightKg === null || weightKg === undefined) return '';
  const converted = fromKilograms(weightKg, unit);
  return `${converted.toFixed(converted < 10 ? 1 : 0)} ${unit}`;
}

export function formatPetAge(dateOfBirth: string | null, fallback = '') {
  if (!dateOfBirth) return fallback;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!match) return fallback;
  const born = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(born.getTime())) return fallback;
  const today = new Date();
  let years = today.getFullYear() - born.getFullYear();
  let months = today.getMonth() - born.getMonth();
  if (today.getDate() < born.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return fallback;
  const age = years > 0
    ? `${years} year${years === 1 ? '' : 's'} old`
    : `${Math.max(0, months)} month${months === 1 ? '' : 's'} old`;
  const bornLabel = born.toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return `${age} · Born ${bornLabel}`;
}
