import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Briefcase,
  BrickWall,
  Coffee,
  Croissant,
  GraduationCap,
  Hammer,
  House,
  PawPrint,
  Pill,
  Scissors,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sofa,
  Sparkles,
  Stethoscope,
  Store,
  Truck,
  Utensils,
  Wrench,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  hammer: Hammer,
  utensils: Utensils,
  croissant: Croissant,
  'shopping-cart': ShoppingCart,
  shoppingcart: ShoppingCart,
  pill: Pill,
  scissors: Scissors,
  wrench: Wrench,
  'book-open': BookOpen,
  bookopen: BookOpen,
  shirt: Shirt,
  stethoscope: Stethoscope,
  sparkles: Sparkles,
  smartphone: Smartphone,
  sofa: Sofa,
  'brick-wall': BrickWall,
  brickwall: BrickWall,
  house: House,
  coffee: Coffee,
  'paw-print': PawPrint,
  pawprint: PawPrint,
  truck: Truck,
  'graduation-cap': GraduationCap,
  graduationcap: GraduationCap,
  briefcase: Briefcase,
  store: Store,
};

function keyFor(icon: string): string {
  return icon.trim().toLowerCase().replace(/_/g, '-');
}

export function categoryIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Store;
  return ICONS[keyFor(icon)] ?? ICONS[keyFor(icon).replace(/-/g, '')] ?? Store;
}
