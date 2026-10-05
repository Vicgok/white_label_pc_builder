import { resolveParts } from '../data/components';
import type { SelectedComponents } from '../types';
export const calculateBuildTotal = (selected: SelectedComponents) => Object.values(resolveParts(selected)).reduce((sum, part) => sum + part.price, 0);
export const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
