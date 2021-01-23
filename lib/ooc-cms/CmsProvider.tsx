import { ReactNode, useMemo } from "react";
import { TinaCMS, TinaProvider } from "tinacms";
import { TinacmsGithubProvider } from "react-tinacms-github";

export interface CmsProviderProps {
  enabled: boolean
  sidebar?: boolean
  toolbar?: boolean
  children: ReactNode
}

export function CmsProvider({ enabled, sidebar, toolbar, children }: CmsProviderProps) {
  const cms = useMemo(() => new TinaCMS({
    enabled: enabled ?? false,
    sidebar: sidebar ?? enabled ?? false,
    toolbar: toolbar ?? enabled ?? false
  }), []);

  return (
    <TinaProvider cms={cms}>
      <TinacmsGithubProvider onLogin={onLogin} onLogout={onLogout}>
        {children}
      </TinacmsGithubProvider>
    </TinaProvider>
  )
}

const onLogin = () => null;
const onLogout = () => null;