import { registrarEvento, type Entorno } from '../../servidor/visitas'

// Cada visita, proyecto ejecutado o clic, de forma anónima
export const onRequestPost: PagesFunction<Entorno> = ({ request, env }) => registrarEvento(request, env)
