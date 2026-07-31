import { c as createComponent } from './consts_DA-EzQHe.mjs';
import 'piccolore';
import { Q as renderTemplate, B as maybeRenderHead, a3 as addAttribute } from './sequence_Bbl28ISp.mjs';
import { r as renderComponent } from './entrypoint_7BRLeYy8.mjs';
import { g as getCollection, $ as $$BaseLayout } from './_astro_content_DW1TUiXW.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  const articles = await getCollection("articles", ({ data }) => !data.draft);
  const sorted = articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const categories = ["all", ...new Set(sorted.map((a) => a.data.category))];
  const selectedCategory = Astro2.url.searchParams.get("category") ?? "all";
  const filtered = selectedCategory === "all" ? sorted : sorted.filter((a) => a.data.category === selectedCategory);
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "News & Updates", "description": "Announcements and updates from the Pastoral Charge." }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<div class="hero-gradient py-14"> <div class="max-w-7xl mx-auto px-6"> <nav class="text-sm text-on-primary/60 mb-4" aria-label="Breadcrumb"> <a href="/" class="hover:text-on-primary transition-colors">Home</a> <span class="mx-2">›</span> <span class="text-on-primary/80">News &amp; Updates</span> </nav> <h1 class="font-headline text-4xl md:text-5xl font-bold text-on-primary">News &amp; Updates</h1> <p class="text-on-primary/75 mt-3 text-lg">Announcements, reflections, and happenings from across the Charge.</p> </div> </div> <div class="max-w-7xl mx-auto px-6 py-12"> <!-- Category filter --> <div class="flex flex-wrap gap-2 mb-10" role="group" aria-label="Filter by category"> ${categories.map((cat) => {
    const isActive = selectedCategory === cat;
    return renderTemplate`<a${addAttribute(cat === "all" ? "/articles" : `/articles?category=${cat}`, "href")}${addAttribute(`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${isActive ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-secondary hover:text-secondary"}`, "class")}${addAttribute(isActive ? "page" : void 0, "aria-current")}> <span class="capitalize">${cat}</span> </a>`;
  })} </div> ${filtered.length > 0 ? renderTemplate`<ul class="space-y-5"> ${filtered.map((article) => renderTemplate`<li> <a${addAttribute(`/articles/${article.id}`, "href")} class="group flex gap-5 bg-surface-container-low border border-outline-variant rounded-xl p-6 hover:border-secondary hover:shadow-sm transition-all duration-200"> <div class="flex-1 min-w-0"> <div class="flex flex-wrap items-center gap-2 mb-2"> <span class="inline-block text-xs font-label font-semibold uppercase tracking-wider text-on-secondary bg-secondary px-2 py-0.5 rounded capitalize"> ${article.data.category} </span> <span class="text-xs text-outline"> ${article.data.date.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })} </span> </div> <h2 class="font-headline text-xl font-bold text-primary group-hover:text-secondary mb-1 transition-colors"> ${article.data.title} </h2> ${article.data.description && renderTemplate`<p class="text-on-surface-variant text-sm leading-relaxed">${article.data.description}</p>`} </div> <span class="material-symbols-outlined text-outline group-hover:text-secondary transition-colors self-center shrink-0 select-none" aria-hidden="true">arrow_forward</span> </a> </li>`)} </ul>` : renderTemplate`<div class="text-center py-20 text-outline"> <span class="material-symbols-outlined text-5xl block mb-3" aria-hidden="true">article</span> <p class="text-lg">No articles found for this category.</p> </div>`} </div> ` })}`;
}, "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/pages/articles/index.astro", void 0);

const $$file = "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/pages/articles/index.astro";
const $$url = "/articles";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
