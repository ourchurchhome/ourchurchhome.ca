import { CmsProvider } from 'ooc-cms';
import 'ooc-ui/index.css';
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
    <CmsProvider enabled={pageProps.isEditing}>
      <Component {...pageProps} />
    </CmsProvider>
  )
}

export default MyApp
