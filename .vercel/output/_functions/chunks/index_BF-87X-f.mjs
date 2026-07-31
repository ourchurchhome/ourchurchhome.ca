import { c as createComponent } from './consts_DA-EzQHe.mjs';
import 'piccolore';
import { B as maybeRenderHead, a3 as addAttribute, Q as renderTemplate, F as Fragment, aV as unescapeHTML } from './sequence_Bbl28ISp.mjs';
import { r as renderComponent } from './entrypoint_7BRLeYy8.mjs';
import { g as getCollection, r as renderEntry, $ as $$BaseLayout } from './_astro_content_DW1TUiXW.mjs';
import 'clsx';
import { o as overrideForEntry, m as mergeDraftData, d as bannerSchema, r as renderDraftMarkdown, h as homepageSchema } from './preview_Jt-2pCDm.mjs';

const $$HeroWidget = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$HeroWidget;
  const { title, subtitle, image, buttons } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section class="relative flex items-center overflow-hidden" style="min-height: 560px;"> ${image && renderTemplate`<img${addAttribute(image, "src")} alt="" aria-hidden="true" class="absolute inset-0 w-full h-full object-cover object-center">`} <div class="absolute inset-0 hero-gradient opacity-85"></div> <div class="relative z-10 max-w-7xl mx-auto px-6 w-full py-24"> <div class="max-w-2xl"> <h1 class="font-headline text-5xl md:text-6xl text-on-primary font-bold mb-6 leading-tight tracking-tight"> ${title} </h1> ${subtitle && renderTemplate`<p class="text-on-primary/85 text-lg md:text-xl mb-10 font-light leading-relaxed"> ${subtitle} </p>`} ${buttons && buttons.length > 0 && renderTemplate`<div class="flex flex-wrap gap-4"> ${buttons.map((btn) => btn.primary ? renderTemplate`<a${addAttribute(btn.url, "href")} class="bg-secondary text-on-primary px-8 py-3 rounded-xl font-semibold text-base shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95"> ${btn.copy} </a>` : renderTemplate`<a${addAttribute(btn.url, "href")} class="bg-white/10 border border-white/25 text-on-primary px-8 py-3 rounded-xl font-semibold text-base hover:bg-white/20 transition-all duration-200"> ${btn.copy} </a>`)} </div>`} </div> </div> </section>`;
}, "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/components/widgets/HeroWidget.astro", void 0);

const $$NewsWidget = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$NewsWidget;
  const { title, subtitle } = Astro2.props;
  const articles = await getCollection("articles", ({ data }) => !data.draft);
  const recentArticles = articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()).slice(0, 3);
  return renderTemplate`${recentArticles.length > 0 && renderTemplate`${maybeRenderHead()}<section class="py-20" aria-labelledby="news-heading"><div class="max-w-7xl mx-auto px-6"><div class="flex items-baseline justify-between mb-10"><div>${subtitle && renderTemplate`<span class="text-secondary font-label font-bold tracking-[0.3em] uppercase block mb-2 text-sm">${subtitle}</span>`}<h2 id="news-heading" class="font-headline text-3xl font-bold text-primary">${title}</h2></div><a href="/articles" class="text-sm font-semibold text-secondary hover:underline">View all →</a></div><ul class="grid gap-6 sm:grid-cols-3">${recentArticles.map((article) => renderTemplate`<li><a${addAttribute(`/articles/${article.id}`, "href")} class="group block h-full bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:border-secondary hover:shadow-sm transition-all duration-200"><span class="inline-block text-xs font-label font-semibold uppercase tracking-wider text-on-secondary bg-secondary px-2 py-0.5 rounded mb-3 capitalize">${article.data.category}</span><h3 class="font-headline font-bold text-primary group-hover:text-secondary mb-2 transition-colors leading-snug">${article.data.title}</h3><p class="text-xs text-outline mb-3">${article.data.date.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</p>${article.data.description && renderTemplate`<p class="text-sm text-on-surface-variant leading-relaxed">${article.data.description}</p>`}</a></li>`)}</ul></div></section>`}`;
}, "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/components/widgets/NewsWidget.astro", void 0);

const $$VisionWidget = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$VisionWidget;
  const { title, body, quote, communityCount, yearsOfGrace, ctaTitle, ctaDescription } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section class="py-20 bg-surface-container-low"> <div class="max-w-7xl mx-auto px-6"> <div class="grid md:grid-cols-2 gap-14 items-center"> <div> <h2 class="font-headline text-primary text-4xl font-bold mb-6">${title}</h2> ${body && renderTemplate`<p class="text-on-surface-variant text-lg leading-relaxed mb-5">${body}</p>`} ${quote && renderTemplate`<p class="text-on-surface-variant text-lg leading-relaxed italic border-l-4 border-secondary pl-5 mb-8">
&ldquo;${quote}&rdquo;
</p>`} <div class="flex gap-12"> ${communityCount != null && renderTemplate`<div> <p class="font-headline text-3xl font-bold text-secondary">${communityCount}</p> <p class="text-sm font-label uppercase tracking-widest text-outline mt-0.5">Communities</p> </div>`} ${yearsOfGrace && renderTemplate`<div> <p class="font-headline text-3xl font-bold text-secondary">${yearsOfGrace}</p> <p class="text-sm font-label uppercase tracking-widest text-outline mt-0.5">Years of Grace</p> </div>`} </div> </div> ${(ctaTitle || ctaDescription) && renderTemplate`<div class="bg-surface-container rounded-xl p-8 border border-outline-variant"> <div class="flex items-center gap-3 mb-6"> <span class="material-symbols-outlined text-tertiary text-3xl select-none" aria-hidden="true">volunteer_activism</span> ${ctaTitle && renderTemplate`<h3 class="font-headline text-xl font-bold text-primary">${ctaTitle}</h3>`} </div> ${ctaDescription && renderTemplate`<p class="text-on-surface-variant leading-relaxed">${ctaDescription}</p>`} </div>`} </div> </div> </section>`;
}, "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/components/widgets/VisionWidget.astro", void 0);

const $$ChurchesWidget = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$ChurchesWidget;
  const { title, subtitle } = Astro2.props;
  const churches = await getCollection("churches");
  return renderTemplate`${maybeRenderHead()}<section class="py-20" aria-labelledby="churches-heading"> <div class="max-w-7xl mx-auto px-6"> <div class="text-center mb-12"> ${subtitle && renderTemplate`<span class="text-secondary font-label font-bold tracking-[0.3em] uppercase block mb-3 text-sm">${subtitle}</span>`} <h2 id="churches-heading" class="font-headline text-4xl md:text-5xl text-primary font-bold">${title}</h2> </div> <div class="grid gap-6 sm:grid-cols-3"> ${churches.map((church) => renderTemplate`<a${addAttribute(`/churches/${church.id}`, "href")} class="group block bg-surface-container-low border border-outline-variant rounded-xl p-6 hover:border-secondary hover:shadow-md transition-all duration-200"> <div class="flex items-center gap-2 mb-4"> <span class="material-symbols-outlined text-tertiary text-xl select-none" aria-hidden="true">church</span> </div> <h3 class="font-headline text-lg font-bold text-primary group-hover:text-secondary mb-2 transition-colors">${church.data.title}</h3> <p class="text-sm text-on-surface-variant mb-1 flex items-center gap-1.5"> <span class="material-symbols-outlined text-base text-outline select-none" aria-hidden="true">schedule</span> ${church.data.serviceTime} </p> <p class="text-sm text-on-surface-variant flex items-center gap-1.5"> <span class="material-symbols-outlined text-base text-outline select-none" aria-hidden="true">location_on</span> ${church.data.address} </p> <p class="text-secondary text-sm font-semibold mt-4 group-hover:underline">View schedules →</p> </a>`)} </div> </div> </section>`;
}, "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/components/widgets/ChurchesWidget.astro", void 0);

const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  const preview = Astro2.locals.preview ?? null;
  const bannerEntries = await getCollection("banner");
  const bannerEntry = bannerEntries[0];
  const bannerOverride = overrideForEntry(preview, bannerEntry);
  const bannerData = bannerEntry && bannerOverride ? mergeDraftData(bannerSchema, bannerEntry.data, bannerOverride) : bannerEntry?.data;
  const bannerEnabled = bannerData?.enabled ?? false;
  const bannerLink = bannerData?.link ?? null;
  const bannerDraftHtml = bannerOverride?.body !== void 0 ? await renderDraftMarkdown(bannerOverride.body) : null;
  const { Content: BannerContent } = bannerEntry && bannerDraftHtml === null ? await renderEntry(bannerEntry) : { Content: null };
  const homepageEntries = await getCollection("homepage");
  const homepage = homepageEntries[0];
  const homepageOverride = overrideForEntry(preview, homepage);
  const homepageData = homepage && homepageOverride ? mergeDraftData(homepageSchema, homepage.data, homepageOverride) : homepage?.data;
  const widgets = homepageData?.widgets ?? [];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Home", "description": "Mount Stewart, Morell, St. Peters Bay Pastoral Charge — ourchurchhome.ca" }, { "default": async ($$result2) => renderTemplate`  ${bannerEnabled && (BannerContent || bannerDraftHtml !== null) && (bannerLink ? renderTemplate`${maybeRenderHead()}<a${addAttribute(bannerLink, "href")} class="group flex items-center justify-center gap-2 bg-secondary text-on-secondary px-6 py-3 text-center text-sm font-medium leading-snug hover:bg-secondary-container transition-colors duration-200 [&_p]:inline [&_strong]:font-bold"> ${bannerDraftHtml !== null ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(bannerDraftHtml)}` })}` : BannerContent && renderTemplate`${renderComponent($$result2, "BannerContent", BannerContent, {})}`} <span class="material-symbols-outlined text-base shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">arrow_forward</span> </a>` : renderTemplate`<div class="flex items-center justify-center bg-secondary text-on-secondary px-6 py-3 text-center text-sm font-medium leading-snug [&_p]:inline [&_strong]:font-bold"> ${bannerDraftHtml !== null ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(bannerDraftHtml)}` })}` : BannerContent && renderTemplate`${renderComponent($$result2, "BannerContent", BannerContent, {})}`} </div>`)} ${widgets.map((widget) => {
    if (widget.type === "hero") return renderTemplate`${renderComponent($$result2, "HeroWidget", $$HeroWidget, { ...widget })}`;
    if (widget.type === "news") return renderTemplate`${renderComponent($$result2, "NewsWidget", $$NewsWidget, { ...widget })}`;
    if (widget.type === "vision") return renderTemplate`${renderComponent($$result2, "VisionWidget", $$VisionWidget, { ...widget })}`;
    if (widget.type === "churches") return renderTemplate`${renderComponent($$result2, "ChurchesWidget", $$ChurchesWidget, { ...widget })}`;
    return null;
  })}` })}`;
}, "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/pages/index.astro", void 0);

const $$file = "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
