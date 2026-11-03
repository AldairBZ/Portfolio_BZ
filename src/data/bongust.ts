import type { LineaSesion } from '../lib/terminalAscii'

/*
 * Sesión real del Gestor Bon Gust (public/apps/bongust/main.py): crear dos
 * productos, listarlos y registrar una salida de stock. El texto es el que
 * imprime el programa; solo se han añadido las respuestas del usuario.
 */
const menu: LineaSesion[] = [
  { texto: '--- GESTOR FORN BON GUST ---', tipo: 'titulo' },
  { texto: '1. Crear producto', tipo: 'menu' },
  { texto: '2. Listar productos', tipo: 'menu' },
  { texto: '3. Actualizar producto', tipo: 'menu' },
  { texto: '4. Eliminar producto', tipo: 'menu' },
  { texto: '5. Crear movimiento de stock', tipo: 'menu' },
  { texto: '6. Listar movimientos', tipo: 'menu' },
  { texto: '7. Eliminar movimiento', tipo: 'menu' },
  { texto: '0. Salir', tipo: 'menu' },
]
const vacia: LineaSesion = { texto: '', tipo: 'salida' }
const opcion = (entrada: string): LineaSesion => ({ texto: 'Seleccione una opción: ', tipo: 'titulo', entrada })
const pregunta = (texto: string, entrada: string): LineaSesion => ({ texto, tipo: 'menu', entrada })

export const sesionBonGust: LineaSesion[] = [
  ...menu,
  opcion('1'),
  pregunta('Nombre: ', 'Ensaïmada'),
  pregunta('Tipo: ', 'Dulce'),
  pregunta('Precio: ', '1.80'),
  pregunta('Stock inicial: ', '24'),
  { texto: 'Producto creado correctamente.', tipo: 'salida' },
  vacia,
  ...menu,
  opcion('1'),
  pregunta('Nombre: ', 'Coca de recapte'),
  pregunta('Tipo: ', 'Salado'),
  pregunta('Precio: ', '3.50'),
  pregunta('Stock inicial: ', '12'),
  { texto: 'Producto creado correctamente.', tipo: 'salida' },
  vacia,
  ...menu,
  opcion('2'),
  { texto: 'ID: 1 | Ensaïmada (Dulce) | Precio: 1.8€ | Stock: 24', tipo: 'salida' },
  { texto: 'ID: 2 | Coca de recapte (Salado) | Precio: 3.5€ | Stock: 12', tipo: 'salida' },
  vacia,
  ...menu,
  opcion('5'),
  pregunta('ID del producto: ', '1'),
  pregunta('Cantidad: ', '6'),
  pregunta('Tipo (entrada/salida): ', 'salida'),
  { texto: 'Movimiento registrado.', tipo: 'salida' },
  vacia,
  ...menu,
  opcion('6'),
  { texto: 'ID: 1 | Producto ID: 1 | salida | Cantidad: 6', tipo: 'salida' },
  vacia,
  ...menu,
  opcion('0'),
  { texto: 'Saliendo...', tipo: 'salida' },
]
