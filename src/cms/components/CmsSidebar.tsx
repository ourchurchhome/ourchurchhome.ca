import React, { useState, useEffect } from 'react';

export interface SidebarCollection {
  name: string;
  label: string;
  singleton: boolean;
  icon: string;
}

export interface SidebarUser {
  name: string;
  username: string;
  avatarUrl: string;
}

interface Props {
  collections: SidebarCollection[];
  user: SidebarUser;
  currentPath: string;
}

function isActive(currentPath: string, href: string): boolean {
  if (href === '/cms') return currentPath === '/cms';
  return currentPath.startsWith(href);
}

function HamburgerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/** Placed inside the page content area; fires the open event picked up by CmsSidebar. */
export function CmsNavToggle() {
  return (
    <button
      className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      onClick={() => window.dispatchEvent(new CustomEvent('cms:open-nav'))}
      aria-label="Open navigation"
    >
      <HamburgerIcon />
    </button>
  );
}

export default function CmsSidebar({ collections, user, currentPath }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener('cms:open-nav', open);
    return () => window.removeEventListener('cms:open-nav', open);
  }, []);
  const singletons = collections.filter((c) => c.singleton);
  const groups = collections.filter((c) => !c.singleton);

  const navContent = (
    <>
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {singletons.length > 0 && (
          <section>
            <p className="px-5 mb-1 text-xs font-medium uppercase tracking-widest text-gray-500">Settings</p>
            <ul>
              {singletons.map((col) => {
                const href = `/cms/${col.name}/${col.name}`;
                const active = isActive(currentPath, `/cms/${col.name}`);
                return (
                  <li key={col.name}>
                    <a href={href} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-5 py-2 text-sm transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                      <span className="text-base leading-none">{col.icon}</span>
                      {col.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {groups.length > 0 && (
          <section>
            <p className="px-5 mb-1 text-xs font-medium uppercase tracking-widest text-gray-500">Collections</p>
            <ul>
              {groups.map((col) => {
                const href = `/cms/${col.name}`;
                const active = isActive(currentPath, href);
                return (
                  <li key={col.name}>
                    <a href={href} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-5 py-2 text-sm transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                      <span className="text-base leading-none">{col.icon}</span>
                      {col.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <section>
          <p className="px-5 mb-1 text-xs font-medium uppercase tracking-widest text-gray-500">Media</p>
          <ul>
            <li>
              <a
                href="/cms/images"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-5 py-2 text-sm transition-colors ${isActive(currentPath, '/cms/images') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              >
                <span className="text-base leading-none">🖼️</span>
                Images
              </a>
            </li>
          </ul>
        </section>
      </nav>

      {/* User footer */}
      <div className="px-5 py-4 border-t border-gray-800 flex items-center gap-3">
        <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">@{user.username}</p>
        </div>
        <a href="/cms/logout" className="text-xs text-gray-400 hover:text-white transition-colors" title="Log out">↩</a>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar — fixed on both mobile and desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 flex flex-col w-64
        bg-gray-900 text-gray-100 border-r border-gray-800
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="px-5 h-[60px] border-b border-gray-800 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">CMS</span>
          <button
            className="lg:hidden p-1 -mr-1 text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>

        {navContent}
      </aside>
    </>
  );
}

