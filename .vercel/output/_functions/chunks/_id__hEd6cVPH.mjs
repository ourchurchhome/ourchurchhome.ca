import { c as createComponent } from './consts_DA-EzQHe.mjs';
import 'piccolore';
import { Q as renderTemplate, B as maybeRenderHead, F as Fragment, aV as unescapeHTML } from './sequence_Bbl28ISp.mjs';
import { r as renderComponent } from './entrypoint_7BRLeYy8.mjs';
import { g as getCollection, r as renderEntry, $ as $$BaseLayout } from './_astro_content_DW1TUiXW.mjs';
import { o as overrideForEntry, c as createdOverrideFor, m as mergeDraftData, a as articlesSchema, r as renderDraftMarkdown } from './preview_Jt-2pCDm.mjs';

const prerender = false;
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  const preview = Astro2.locals.preview ?? null;
  const articles = await getCollection("articles");
  const article = articles.find((a) => a.id === id);
  const override = overrideForEntry(preview, article);
  const createdOverride = article ? null : createdOverrideFor(preview, "src/content/articles", id);
  if (!article && !createdOverride) return new Response(null, { status: 404 });
  if (article && article.data.draft && !preview) return new Response(null, { status: 404 });
  let data = article ? override ? mergeDraftData(articlesSchema, article.data, override) : article.data : null;
  if (createdOverride) {
    const parsed = articlesSchema.safeParse({ ...createdOverride.fields });
    if (!parsed.success) return new Response(null, { status: 404 });
    data = parsed.data;
  }
  if (!data) return new Response(null, { status: 404 });
  const draftBody = override?.body ?? createdOverride?.body;
  const draftHtml = draftBody !== void 0 ? await renderDraftMarkdown(draftBody) : null;
  const { Content } = article && draftHtml === null ? await renderEntry(article) : { Content: null };
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": data.title, "description": data.description }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<div class="hero-gradient py-14"> <div class="max-w-7xl mx-auto px-6"> <nav class="text-sm text-on-primary/60 mb-4" aria-label="Breadcrumb"> <a href="/" class="hover:text-on-primary transition-colors">Home</a> <span class="mx-2">›</span> <a href="/articles" class="hover:text-on-primary transition-colors">News &amp; Updates</a> <span class="mx-2">›</span> <span class="text-on-primary/80">${data.title}</span> </nav> <div class="flex flex-wrap items-center gap-3 mb-4"> <span class="inline-block text-xs font-label font-semibold uppercase tracking-wider text-on-secondary bg-secondary px-2.5 py-1 rounded capitalize"> ${data.category} </span> <span class="text-on-primary/60 text-sm"> ${data.date.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })} </span> </div> <h1 class="font-headline text-4xl md:text-5xl font-bold text-on-primary leading-tight max-w-3xl"> ${data.title} </h1> ${data.description && renderTemplate`<p class="text-on-primary/80 text-lg mt-4 max-w-2xl leading-relaxed font-light"> ${data.description} </p>`} </div> </div>  <div class="max-w-7xl mx-auto px-6 py-12"> <div class="max-w-2xl"> <article class="prose"> ${draftHtml !== null ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(draftHtml)}` })}` : Content && renderTemplate`${renderComponent($$result2, "Content", Content, {})}`} </article> <div class="mt-12 pt-6 border-t border-outline-variant"> <a href="/articles" class="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline transition-colors"> <span class="material-symbols-outlined text-base select-none" aria-hidden="true">arrow_back</span>
Back to News &amp; Updates
</a> </div> </div> </div> ` })}`;
}, "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/pages/articles/[id].astro", void 0);

const $$file = "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/pages/articles/[id].astro";
const $$url = "/articles/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
