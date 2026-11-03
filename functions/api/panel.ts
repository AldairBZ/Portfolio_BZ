import { responderPanel, type Entorno } from '../../servidor/visitas'

// Resumen del contador; solo con el usuario y la clave del panel
export const onRequestPost: PagesFunction<Entorno> = ({ request, env }) => responderPanel(request, env)
