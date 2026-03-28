/**
 * cms.config.ts
 *
 * User-facing CMS configuration file. Edit this to control which collections
 * appear in the CMS and how their fields are presented.
 *
 * Field TYPES are always inferred from the Zod schema in src/content/schemas.ts.
 * Only use `fields` here to override the PRESENTATION (label, control, visibility).
 */

import { defineConfig } from './src/cms/config';

export default defineConfig({
  collections: {
    banner: {
      singleton: true,
      allowCreate: false,
      allowDelete: false,
      icon: '📢',
    },
    articles: {
      allowCreate: true,
      allowDelete: true,
      icon: '📝',
      fields: {
        draft: { hidden: true },
      },
    },
    churches: {
      allowCreate: false,
      allowDelete: false,
      icon: '⛪',
      fields: {
        description: { control: 'TextArea' },
        image: { control: 'ImageUrl', label: 'Hero Image URL' },
      },
    },
    schedules: {
      allowCreate: false,
      allowDelete: false,
      icon: '📅',
    },
  },
});

