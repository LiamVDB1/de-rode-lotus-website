import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Alles wordt per verzoek opgebouwd uit D1, zodat wijzigingen uit /beheer meteen zichtbaar zijn.
export default defineConfig({
  output: 'server',
  trailingSlash: 'ignore',
  adapter: cloudflare({ imageService: 'passthrough' }),
  session: false,
  security: { checkOrigin: true },
});
