import { c as createComponent, V as VALID_INPUT_FORMATS } from './consts_DA-EzQHe.mjs';
import 'piccolore';
import { T as createRenderInstruction, U as renderElement, a3 as addAttribute, aW as renderHead, Q as renderTemplate, aX as renderSlot, ax as generateCspDigest, aV as unescapeHTML, aY as removeBase, aU as isRemotePath, A as AstroError, aZ as RenderUndefinedEntryError, a_ as UnknownContentCollectionError, aF as prependForwardSlash, a$ as createHeadAndContent } from './sequence_Bbl28ISp.mjs';
import 'clsx';
import { escape } from 'html-escaper';
import { Traverse } from 'neotraverse/modern';
import * as z from 'zod/v4';
import { s as spreadAttributes, r as renderComponent } from './entrypoint_7BRLeYy8.mjs';
import * as devalue from 'devalue';

async function renderScript(result, id) {
  const inlined = result.inlinedScripts.get(id);
  let content = "";
  if (inlined != null) {
    if (inlined) {
      content = `<script type="module">${inlined}</script>`;
    }
  } else {
    const resolved = await result.resolve(id);
    content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"></script>`;
  }
  return createRenderInstruction({ type: "script", id, content });
}

function renderScriptElement({ props, children }) {
  return renderElement("script", {
    props,
    children
  });
}
function renderUniqueStylesheet(result, sheet) {
  if (sheet.type === "external") {
    if (Array.from(result.styles).some((s) => s.props.href === sheet.src)) return "";
    return renderElement("link", { props: { rel: "stylesheet", href: sheet.src }, children: "" });
  }
  if (sheet.type === "inline") {
    if (Array.from(result.styles).some((s) => s.children.includes(sheet.content))) return "";
    return renderElement("style", { props: {}, children: sheet.content });
  }
}

const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title, description = "Mount Stewart, Morell, St. Peters Bay Pastoral Charge" } = Astro2.props;
  const currentPath = Astro2.url.pathname;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description"${addAttribute(description, "content")}><link rel="icon" type="image/svg+xml" href="/favicon.ico"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&family=Public+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"><title>${title} | Our Church Home</title>${renderHead()}</head> <body class="min-h-screen bg-background text-on-background font-body flex flex-col"> <!-- Top App Bar --> <header class="sticky top-0 z-50 glass-nav shadow-sm"> <div class="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto"> <a href="/" class="flex items-center gap-3 group"> <img src="/logo.gif" alt="Our Church Home Logo" class="h-10 w-auto"> <span class="font-headline font-bold text-lg text-primary tracking-tight group-hover:text-primary-container transition-colors">
Mount Stewart, Morell, St. Peters Bay Pastoral Charge
</span> </a> <nav class="hidden md:flex items-center gap-8" aria-label="Main navigation"> ${[
    { href: "/", label: "Home" },
    { href: "/churches/morell", label: "Morell" },
    { href: "/churches/mount-stewart", label: "Mount Stewart" },
    { href: "/churches/st-peters-bay", label: "St. Peters Bay" },
    { href: "/articles", label: "News & Updates" }
  ].map(({ href, label }) => {
    const isActive = href === "/" ? currentPath === "/" : currentPath.startsWith(href);
    return renderTemplate`<a${addAttribute(href, "href")}${addAttribute(isActive ? "text-secondary border-b-2 border-secondary font-semibold py-1" : "text-primary/80 hover:text-secondary transition-colors py-1 font-medium", "class")}${addAttribute(isActive ? "page" : void 0, "aria-current")}> ${label} </a>`;
  })} </nav> <button class="md:hidden text-primary p-1" aria-label="Open menu" id="mobile-menu-btn"> <span class="material-symbols-outlined" aria-hidden="true">menu</span> </button> </div> <!-- Mobile menu --> <div id="mobile-menu" class="hidden md:hidden border-t border-outline-variant bg-surface-container-low px-6 py-4"> <nav aria-label="Mobile navigation"> <ul class="flex flex-col gap-3"> ${[
    { href: "/", label: "Home" },
    { href: "/churches/morell", label: "Morell" },
    { href: "/churches/mount-stewart", label: "Mount Stewart" },
    { href: "/churches/st-peters-bay", label: "St. Peters Bay" },
    { href: "/articles", label: "News & Updates" }
  ].map(({ href, label }) => renderTemplate`<li> <a${addAttribute(href, "href")} class="text-primary font-medium hover:text-secondary transition-colors">${label}</a> </li>`)} </ul> </nav> </div> </header> <main class="flex-1 w-full"> ${renderSlot($$result, $$slots["default"])} </main> <!-- Footer --> <footer class="bg-primary-container text-primary-fixed mt-16"> <div class="max-w-7xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-3"> <div> <div class="flex items-center gap-2 mb-3"> <span class="material-symbols-outlined text-tertiary-fixed-dim text-xl select-none" aria-hidden="true">church</span> <span class="font-headline font-bold text-base text-primary-fixed">Mount Stewart Pastoral Charge</span> </div> <p class="text-sm text-primary-fixed/70 leading-relaxed">
Serving the communities of Mount Stewart, Morell, and St. Peters Bay on Prince Edward Island.
</p> </div> <div> <h3 class="font-label font-semibold uppercase tracking-widest text-xs text-tertiary-fixed-dim mb-4">Quick Links</h3> <ul class="space-y-2 text-sm"> <li><a href="/churches/morell" class="text-primary-fixed/70 hover:text-primary-fixed transition-colors">Morell United Church</a></li> <li><a href="/churches/mount-stewart" class="text-primary-fixed/70 hover:text-primary-fixed transition-colors">Mount Stewart United Church</a></li> <li><a href="/churches/st-peters-bay" class="text-primary-fixed/70 hover:text-primary-fixed transition-colors">St. Peters Bay United Church</a></li> <li><a href="/articles" class="text-primary-fixed/70 hover:text-primary-fixed transition-colors">News &amp; Updates</a></li> </ul> </div> <div> <h3 class="font-label font-semibold uppercase tracking-widest text-xs text-tertiary-fixed-dim mb-4">Stay Connected</h3> <p class="text-sm text-primary-fixed/70 mb-2">Visit us at <a href="https://ourchurchhome.ca" class="underline hover:text-primary-fixed transition-colors">ourchurchhome.ca</a></p> <p class="text-sm text-primary-fixed/70">United Church of Canada</p> </div> </div> <div class="border-t border-primary-fixed/10 py-4 text-center text-xs text-primary-fixed/40 px-6">
&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Mount Stewart, Morell, St. Peters Bay Pastoral Charge
</div> </footer> ${renderScript($$result, "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts")} </body> </html>`;
}, "/Users/chrisdmacrae/Developer/Code/ourchurchhome/ourchurchhome.ca/src/layouts/BaseLayout.astro", void 0);

function createSvgComponent({ meta, attributes, children, styles }) {
  const hasStyles = styles.length > 0;
  const Component = createComponent({
    async factory(result, props) {
      const normalizedProps = normalizeProps(attributes, props);
      if (hasStyles && result.cspDestination) {
        for (const style of styles) {
          const hash = await generateCspDigest(style, result.cspAlgorithm);
          result._metadata.extraStyleHashes.push(hash);
        }
      }
      return renderTemplate`<svg${spreadAttributes(normalizedProps)}>${unescapeHTML(children)}</svg>`;
    },
    propagation: hasStyles ? "self" : "none"
  });
  Object.defineProperty(Component, "toJSON", {
    value: () => meta,
    enumerable: false
  });
  return Object.assign(Component, meta);
}
const ATTRS_TO_DROP = ["xmlns", "xmlns:xlink", "version"];
const DEFAULT_ATTRS = {};
function dropAttributes(attributes) {
  for (const attr of ATTRS_TO_DROP) {
    delete attributes[attr];
  }
  return attributes;
}
function normalizeProps(attributes, props) {
  return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

const CONTENT_IMAGE_FLAG = "astroContentImageFlag";
const IMAGE_IMPORT_PREFIX = "__ASTRO_IMAGE_";

function imageSrcToImportId(imageSrc, filePath) {
  imageSrc = removeBase(imageSrc, IMAGE_IMPORT_PREFIX);
  if (isRemotePath(imageSrc)) {
    return;
  }
  const ext = imageSrc.split(".").at(-1)?.toLowerCase();
  if (!ext || !VALID_INPUT_FORMATS.includes(ext)) {
    return;
  }
  const params = new URLSearchParams(CONTENT_IMAGE_FLAG);
  if (filePath) {
    params.set("importer", filePath);
  }
  return `${imageSrc}?${params.toString()}`;
}

class ImmutableDataStore {
  _collections = /* @__PURE__ */ new Map();
  constructor() {
    this._collections = /* @__PURE__ */ new Map();
  }
  get(collectionName, key) {
    return this._collections.get(collectionName)?.get(String(key));
  }
  entries(collectionName) {
    const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
    return [...collection.entries()];
  }
  values(collectionName) {
    const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
    return [...collection.values()];
  }
  keys(collectionName) {
    const collection = this._collections.get(collectionName) ?? /* @__PURE__ */ new Map();
    return [...collection.keys()];
  }
  has(collectionName, key) {
    const collection = this._collections.get(collectionName);
    if (collection) {
      return collection.has(String(key));
    }
    return false;
  }
  hasCollection(collectionName) {
    return this._collections.has(collectionName);
  }
  collections() {
    return this._collections;
  }
  /**
   * Attempts to load a DataStore from the virtual module.
   * This only works in Vite.
   */
  static async fromModule() {
    try {
      const data = await import('./_astro_data-layer-content_CI7IMIO0.mjs');
      if (data.default instanceof Map) {
        return ImmutableDataStore.fromMap(data.default);
      }
      const map = devalue.unflatten(data.default);
      return ImmutableDataStore.fromMap(map);
    } catch {
    }
    return new ImmutableDataStore();
  }
  static async fromMap(data) {
    const store = new ImmutableDataStore();
    store._collections = data;
    return store;
  }
}
function dataStoreSingleton() {
  let instance = void 0;
  return {
    get: async () => {
      if (!instance) {
        instance = ImmutableDataStore.fromModule();
      }
      return instance;
    },
    set: (store) => {
      instance = store;
    }
  };
}
const globalDataStore = dataStoreSingleton();

z.object({
  tags: z.array(z.string()).optional(),
  lastModified: z.date().optional()
});
function createGetCollection({
  liveCollections
}) {
  return async function getCollection(collection, filter) {
    if (collection in liveCollections) {
      throw new AstroError({
        ...UnknownContentCollectionError,
        message: `Collection "${collection}" is a live collection. Use getLiveCollection() instead of getCollection().`
      });
    }
    const hasFilter = typeof filter === "function";
    const store = await globalDataStore.get();
    if (store.hasCollection(collection)) {
      const { default: imageAssetMap } = await import('./content-assets_DleWbedO.mjs');
      const result = [];
      for (const rawEntry of store.values(collection)) {
        const data = updateImageReferencesInData(rawEntry.data, rawEntry.filePath, imageAssetMap);
        let entry = {
          ...rawEntry,
          data,
          collection
        };
        if (hasFilter && !filter(entry)) {
          continue;
        }
        result.push(entry);
      }
      return result;
    } else {
      console.warn(
        `The collection ${JSON.stringify(
          collection
        )} does not exist or is empty. Please check your content config file for errors.`
      );
      return [];
    }
  };
}
const CONTENT_LAYER_IMAGE_REGEX = /__ASTRO_IMAGE_="([^"]+)"/g;
async function updateImageReferencesInBody(html, fileName) {
  const { default: imageAssetMap } = await import('./content-assets_DleWbedO.mjs');
  const imageObjects = /* @__PURE__ */ new Map();
  const { getImage } = await import('./_astro_assets_Bk1yegBn.mjs').then(n => n._);
  for (const [_full, imagePath] of html.matchAll(CONTENT_LAYER_IMAGE_REGEX)) {
    try {
      const decodedImagePath = JSON.parse(imagePath.replaceAll("&#x22;", '"'));
      let image;
      if (URL.canParse(decodedImagePath.src)) {
        image = await getImage(decodedImagePath);
      } else {
        const id = imageSrcToImportId(decodedImagePath.src, fileName);
        const imported = imageAssetMap.get(id);
        if (!id || imageObjects.has(id) || !imported) {
          continue;
        }
        image = await getImage({ ...decodedImagePath, src: imported });
      }
      imageObjects.set(imagePath, image);
    } catch {
      throw new Error(`Failed to parse image reference: ${imagePath}`);
    }
  }
  return html.replaceAll(CONTENT_LAYER_IMAGE_REGEX, (full, imagePath) => {
    const image = imageObjects.get(imagePath);
    if (!image) {
      return full;
    }
    const { index, ...attributes } = image.attributes;
    return Object.entries({
      ...attributes,
      src: image.src,
      srcset: image.srcSet.attribute,
      // This attribute is used by the toolbar audit
      ...{}
    }).map(([key, value]) => value ? `${key}="${escape(value)}"` : "").join(" ");
  });
}
function updateImageReferencesInData(data, fileName, imageAssetMap) {
  return new Traverse(data).map(function(ctx, val) {
    if (typeof val === "string" && val.startsWith(IMAGE_IMPORT_PREFIX)) {
      const src = val.replace(IMAGE_IMPORT_PREFIX, "");
      const id = imageSrcToImportId(src, fileName);
      if (!id) {
        ctx.update(src);
        return;
      }
      const imported = imageAssetMap?.get(id);
      if (imported) {
        if (imported.__svgData) {
          const { __svgData: svgData, ...meta } = imported;
          ctx.update(createSvgComponent({ meta, ...svgData }));
        } else {
          ctx.update(imported);
        }
      } else {
        ctx.update(src);
      }
    }
  });
}
async function renderEntry(entry) {
  if (!entry) {
    throw new AstroError(RenderUndefinedEntryError);
  }
  if (entry.deferredRender) {
    try {
      const { default: contentModules } = await import('./content-modules_Dz-S_Wwv.mjs');
      const renderEntryImport = contentModules.get(entry.filePath);
      return render({
        collection: "",
        id: entry.id,
        renderEntryImport
      });
    } catch (e) {
      console.error(e);
    }
  }
  const html = entry?.rendered?.metadata?.imagePaths?.length && entry.filePath ? await updateImageReferencesInBody(entry.rendered.html, entry.filePath) : entry?.rendered?.html;
  const Content = createComponent(() => renderTemplate`${unescapeHTML(html)}`);
  return {
    Content,
    headings: entry?.rendered?.metadata?.headings ?? [],
    remarkPluginFrontmatter: entry?.rendered?.metadata?.frontmatter ?? {}
  };
}
async function render({
  collection,
  id,
  renderEntryImport
}) {
  const UnexpectedRenderError = new AstroError({
    ...UnknownContentCollectionError,
    message: `Unexpected error while rendering ${String(collection)} → ${String(id)}.`
  });
  if (typeof renderEntryImport !== "function") throw UnexpectedRenderError;
  const baseMod = await renderEntryImport();
  if (baseMod == null || typeof baseMod !== "object") throw UnexpectedRenderError;
  const { default: defaultMod } = baseMod;
  if (isPropagatedAssetsModule(defaultMod)) {
    const { collectedStyles, collectedLinks, collectedScripts, getMod } = defaultMod;
    if (typeof getMod !== "function") throw UnexpectedRenderError;
    const propagationMod = await getMod();
    if (propagationMod == null || typeof propagationMod !== "object") throw UnexpectedRenderError;
    const Content = createComponent({
      factory(result, baseProps, slots) {
        let styles = "", links = "", scripts = "";
        if (Array.isArray(collectedStyles)) {
          styles = collectedStyles.map((style) => {
            return renderUniqueStylesheet(result, {
              type: "inline",
              content: style
            });
          }).join("");
        }
        if (Array.isArray(collectedLinks)) {
          links = collectedLinks.map((link) => {
            return renderUniqueStylesheet(result, {
              type: "external",
              src: isRemotePath(link) ? link : prependForwardSlash(link)
            });
          }).join("");
        }
        if (Array.isArray(collectedScripts)) {
          scripts = collectedScripts.map((script) => renderScriptElement(script)).join("");
        }
        let props = baseProps;
        if (id.endsWith("mdx")) {
          props = {
            components: propagationMod.components ?? {},
            ...baseProps
          };
        }
        return createHeadAndContent(
          unescapeHTML(styles + links + scripts),
          renderTemplate`${renderComponent(
            result,
            "Content",
            propagationMod.Content,
            props,
            slots
          )}`
        );
      },
      propagation: "self"
    });
    return {
      Content,
      headings: propagationMod.getHeadings?.() ?? [],
      remarkPluginFrontmatter: propagationMod.frontmatter ?? {}
    };
  } else if (baseMod.Content && typeof baseMod.Content === "function") {
    return {
      Content: baseMod.Content,
      headings: baseMod.getHeadings?.() ?? [],
      remarkPluginFrontmatter: baseMod.frontmatter ?? {}
    };
  } else {
    throw UnexpectedRenderError;
  }
}
function isPropagatedAssetsModule(module) {
  return typeof module === "object" && module != null && "__astroPropagation" in module;
}

// astro-head-inject

const liveCollections = {};

const getCollection = createGetCollection({
	liveCollections,
});

export { $$BaseLayout as $, getCollection as g, renderEntry as r };
