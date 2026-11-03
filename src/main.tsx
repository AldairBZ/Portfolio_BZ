import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/martian-mono/standard.css'
import '@fontsource-variable/ibm-plex-sans'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './styles/base.css'
import App from './App'
import { ProveedorIdioma } from './lib/idioma'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorIdioma>
      <App />
    </ProveedorIdioma>
  </StrictMode>,
)
