import { c as createComponent } from './consts_DA-EzQHe.mjs';
import 'piccolore';
import { Q as renderTemplate, B as maybeRenderHead, F as Fragment, aV as unescapeHTML } from './sequence_Bbl28ISp.mjs';
import { r as renderComponent } from './entrypoint_7BRLeYy8.mjs';
import { g as getCollection, r as renderEntry, $ as $$BaseLayout } from './_astro_content_DW1TUiXW.mjs';
import { o as overrideForEntry, m as mergeDraftData, b as churchesSchema, r as renderDraftMarkdown } from './preview_Jt-2pCDm.mjs';

const prerender = false;
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  const preview = Astro2.locals.preview ?? null;
  const churches = await getCollection("churches");
  const church = churches.find((c) => c.id === id);
  if (!church) return new Response(null, { status: 404 });
  const override = overrideForEntry(preview, church);
  const data = override ? mergeDraftData(churchesSchema, church.data, override) : church.data;
  const draftHtml = override?.body !== void 0 ? await renderDraftMarkdown(override.body) : null;
  const { Content } = draftHtml === null ? await renderEntry(church) : { Content: null };
  const allSchedules = await getCollection("schedules");
  const churchSchedules = allSchedules.filter((s) => s.data.church === church.id);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  function upcomingEntries(entries) {
    return entries.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }
  const scheduleTypes = ["greeter", "reader", "cleaner"];
  const scheduleMap = {
    greeter: [],
    reader: [],
    cleaner: []
  };
  for (const s of churchSchedules) {
    scheduleMap[s.data.type] = upcomingEntries(s.data.entries);
  }
  const scheduleIcons = {
    greeter: "waving_hand",
    reader: "menu_book",
    cleaner: "cleaning_services"
  };
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": data.title, "description": data.description }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<div class="hero-gradient py-16"> <div class="max-w-7xl mx-auto px-6"> <nav class="text-sm text-on-primary/60 mb-4" aria-label="Breadcrumb"> <a href="/" class="hover:text-on-primary transition-colors">Home</a> <span class="mx-2">›</span> <span class="text-on-primary/80">${data.title}</span> </nav> <div class="flex items-center gap-3 mb-3"> <span class="material-symbols-outlined text-tertiary-fixed-dim text-3xl select-none" aria-hidden="true">church</span> <h1 class="font-headline text-4xl md:text-5xl font-bold text-on-primary leading-tight">${data.title}</h1> </div> <div class="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-on-primary/75"> <span class="flex items-center gap-1.5"> <span class="material-symbols-outlined text-base text-tertiary-fixed-dim select-none" aria-hidden="true">schedule</span> ${data.serviceTime} </span> <span class="flex items-center gap-1.5"> <span class="material-symbols-outlined text-base text-tertiary-fixed-dim select-none" aria-hidden="true">location_on</span> ${data.address} </span> </div> </div> </div> <div class="max-w-7xl mx-auto px-6 py-12"> <!-- About --> <section class="mb-14 max-w-2xl"> <h2 class="font-headline text-2xl font-bold text-primary mb-4">About This Church</h2> <div class="prose"> ${draftHtml !== null ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(draftHtml)}` })}` : Content && renderTemplate`${renderComponent($$result2, "Content", Content, {})}`} </div> </section> <!-- Schedules --> <section aria-labelledby="schedules-heading"> <div class="mb-8"> <span class="text-secondary font-label font-bold tracking-[0.3em] uppercase block mb-2 text-sm">Volunteer Rosters</span> <h2 id="schedules-heading" class="font-headline text-3xl font-bold text-primary">Upcoming Schedules</h2> </div> <div class="grid gap-6 sm:grid-cols-3"> ${scheduleTypes.map((type) => renderTemplate`<div class="bg-surface-container-low border border-outline-variant rounded-xl p-6"> <div class="flex items-center gap-2 mb-4"> <span class="material-symbols-outlined text-tertiary text-xl select-none" aria-hidden="true">${scheduleIcons[type]}</span> <h3 class="font-headline text-lg font-bold text-primary capitalize">${type}s</h3> </div> ${scheduleMap[type].length > 0 ? renderTemplate`<ul class="space-y-3"> ${scheduleMap[type].map((entry) => renderTemplate`<li class="flex justify-between items-baseline gap-2 text-sm border-b border-outline-variant/50 pb-2 last:border-0 last:pb-0"> <span class="text-outline shrink-0 tabular-nums"> ${(/* @__PURE__ */ new Date(entry.date + "T00:00:00")).toLocaleDateString("en-CA", { month: "short", day: "numeric" })} </span> <span class="text-on-surface font-medium text-right">${entry.name}</span> </li>`)} </ul>` : renderTemplate`<p class="text-sm text-outline italic">No upcoming entries.</p>`} </div>`)} </div> </section> </div> ` })}`;
}, "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/pages/churches/[id].astro", void 0);

const $$file = "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/pages/churches/[id].astro";
const $$url = "/churches/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
