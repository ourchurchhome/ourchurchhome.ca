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
    },
    articles: {
      allowCreate: true,
      allowDelete: true,
      fields: {
        draft: { hidden: true },
      },
    },
    churches: {
      allowCreate: true,
      allowDelete: true,
      fields: {
        description: { control: 'TextArea' },
        image: { control: 'ImageUrl', label: 'Hero Image URL' },
      },
    },
    schedules: {
      allowCreate: true,
      allowDelete: true,
    },
  },
});

