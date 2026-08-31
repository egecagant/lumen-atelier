// Helper functions for Turkish SEO-friendly slug generation and matching
import { Product, Category } from '../types';

export function slugify(text: string): string {
  if (!text) return '';
  
  const turkishMap: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u',
  };

  let str = text.trim().toLowerCase();
  
  // Replace Turkish special characters
  str = str.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => turkishMap[char] || char);

  // Replace invalid characters with hyphens
  str = str
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return str;
}

export function getProductSlug(product: Product): string {
  if (product.slug) return product.slug;
  const generated = slugify(product.name);
  return generated ? `${generated}-${product.id.slice(0, 6)}` : product.id;
}

export function getCategorySlug(category: Category): string {
  if (category.slug) return category.slug;
  const generated = slugify(category.name);
  return generated || category.id;
}

export function findProductBySlug(products: Product[], slug: string): Product | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();
  
  // 1. Exact ID match
  const byId = products.find(p => p.id === cleanSlug);
  if (byId) return byId;

  // 2. Exact slug field match
  const bySlugField = products.find(p => p.slug?.toLowerCase() === cleanSlug);
  if (bySlugField) return bySlugField;

  // 3. Computed slug match
  const byComputed = products.find(p => getProductSlug(p) === cleanSlug);
  if (byComputed) return byComputed;

  // 4. Fallback slug match (ignoring id suffix or partial name match)
  return products.find(p => {
    const pSlug = slugify(p.name);
    return cleanSlug.startsWith(pSlug) || pSlug === cleanSlug;
  });
}

export function findCategoryBySlug(categories: Category[], slug: string): Category | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();

  // 1. Exact ID match
  const byId = categories.find(c => c.id === cleanSlug);
  if (byId) return byId;

  // 2. Exact slug field match
  const bySlugField = categories.find(c => c.slug?.toLowerCase() === cleanSlug);
  if (bySlugField) return bySlugField;

  // 3. Computed slug match
  const byComputed = categories.find(c => getCategorySlug(c) === cleanSlug);
  if (byComputed) return byComputed;

  // 4. Fallback name match
  return categories.find(c => slugify(c.name) === cleanSlug);
}
