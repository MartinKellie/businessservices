import { createElement } from 'react';
import { categoryIcon } from '@/lib/category-icons';

export function CategoryGlyph({
  name,
  size = 18,
  className,
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  return createElement(categoryIcon(name), {
    size,
    strokeWidth: 2,
    className,
    'aria-hidden': true,
  });
}
