import React from 'react';

export interface SidebarCollection {
  name: string;
  label: string;
  singleton: boolean;
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

export default function CmsSidebar({ collections, user, currentPath }: Props) {
  const singletons = collections.filter((c) => c.singleton);
  const groups = collections.filter((c) => !c.singleton);

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-gray-100 border-r border-gray-800">
      {/* Branding */}
      <div className="px-5 py-4 border-b border-gray-800">
        <span className="text-lg font-semibold tracking-tight">CMS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {/* Singleton items */}
        {singletons.length > 0 && (
          <section>
            <p className="px-5 mb-1 text-xs font-medium uppercase tracking-widest text-gray-500">
              Settings
            </p>
            <ul>
              {singletons.map((col) => {
                const href = `/cms/${col.name}/${col.name}`;
                const active = isActive(currentPath, `/cms/${col.name}`);
                return (
                  <li key={col.name}>
                    <a
                      href={href}
                      className={`flex items-center gap-2 px-5 py-2 text-sm rounded-none transition-colors ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {col.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Collection groups */}
        {groups.length > 0 && (
          <section>
            <p className="px-5 mb-1 text-xs font-medium uppercase tracking-widest text-gray-500">
              Collections
            </p>
            <ul>
              {groups.map((col) => {
                const href = `/cms/${col.name}`;
                const active = isActive(currentPath, href);
                return (
                  <li key={col.name}>
                    <a
                      href={href}
                      className={`flex items-center gap-2 px-5 py-2 text-sm transition-colors ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {col.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </nav>

      {/* User footer */}
      <div className="px-5 py-4 border-t border-gray-800 flex items-center gap-3">
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">@{user.username}</p>
        </div>
        <a
          href="/cms/logout"
          className="text-xs text-gray-400 hover:text-white transition-colors"
          title="Log out"
        >
          ↩
        </a>
      </div>
    </aside>
  );
}

