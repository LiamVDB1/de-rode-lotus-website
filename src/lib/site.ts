import previewPhotos from '../data/preview-photos.json';

export function photoSource(upload: string, preview: string): string {
  return /^\/uploads\/[a-zA-Z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/.test(upload)
    ? upload
    : preview;
}

export function activityPreview(index: number): string {
  return previewPhotos.activities[index] ?? '';
}

export function activityHref(target: string, email: string): string {
  if (target === 'faq') return '#vragen';
  if (target === 'practical') return '#praktisch';
  return `mailto:${encodeURIComponent(email)}`;
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function routeHref(street: string, postalCode: string, city: string): string {
  const address = `${street}, ${postalCode} ${city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
