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
    homepage: {
      singleton: true,
      allowCreate: false,
      allowDelete: false,
      icon: '🏠',
      previewUrl: '/',
      fields: {
        widgets: { component: 'Widgets', label: 'Page Sections' },
      },
    },
    banner: {
      singleton: true,
      allowCreate: false,
      allowDelete: false,
      previewUrl: '/',
      icon: '📢',
    },
    articles: {
      allowCreate: true,
      allowDelete: true,
      previewUrl: '/articles/{slug}',
      icon: '📝',
      fields: {
        draft: { hidden: true },
      },
    },
    churches: {
      allowCreate: false,
      allowDelete: false,
      allowRename: false,
      previewUrl: '/churches/{slug}',
      icon: '⛪',
      fields: {
        description: { component: 'TextArea' },
        image: { component: 'ImageUrl', label: 'Hero Image URL' },
      },
    },
    schedules: {
      allowCreate: false,
      allowDelete: false,
      allowRename: false,
      icon: '📅',
      fields: {
        entries: {
          component: 'Table',
          columns: {
            date: { component: 'DatePicker', label: 'Date' },
            name: { component: 'TextInput', label: 'Name' },
          },
        },
      },
    },
    'kitchen-sink': {
      /** Only visible in development mode — never shown in production. */
      development: true,
      singleton: true,
      allowCreate: false,
      allowDelete: false,
      icon: '🧪',
      fields: {
        // Override sections → Repeater (it would auto-select Table as all fields are scalar)
        sections: { component: 'Repeater', label: 'Sections (Repeater demo)' },
        // Widgets must always be explicitly declared — never auto-inferred
        widgets: { component: 'Widgets', label: 'Widgets (Widgets demo)' },
      },
    },
  },
});

