/**
 * Traducción al catalán, indexada por el texto en español.
 * Así los componentes siguen usando t('español', 'english') y tx({ es, en }) sin cambios;
 * catalan.test.ts comprueba que no falte ningún texto.
 */
export const CATALAN: Record<string, string> = {
  // Proyectos
  'Aplicación web que convierte los hábitos saludables en un juego con logros, comunidad y un asistente con IA.':
    'Aplicació web que converteix els hàbits saludables en un joc amb assoliments, comunitat i un assistent amb IA.',
  'API REST en Express con JWT, validación, Helmet y límite de peticiones.':
    'API REST en Express amb JWT, validació, Helmet i límit de peticions.',
  'Login social con Google, GitHub y Facebook mediante OAuth 2.0 escrito a mano, con estado firmado.':
    'Inici de sessió amb Google, GitHub i Facebook mitjançant OAuth 2.0 escrit a mà, amb estat signat.',
  'Tests de integración con node:test y Supertest, CI en GitHub Actions.':
    "Tests d'integració amb node:test i Supertest, CI a GitHub Actions.",
  'Frontend en Cloudflare, API en Render y datos en MongoDB Atlas.':
    'Frontend a Cloudflare, API a Render i dades a MongoDB Atlas.',
  'La API usa el plan gratuito de Render: la primera petición puede tardar unos segundos.':
    "L'API fa servir el pla gratuït de Render: la primera petició pot trigar uns segons.",
  'Juego de bloques de escritorio en Java con Swing, ranking en MySQL, tests JUnit e integración continua.':
    "Joc de blocs d'escriptori en Java amb Swing, rànquing a MySQL, tests JUnit i integració contínua.",
  'Lógica del tablero separada de la interfaz y cubierta con tests JUnit.':
    'Lògica del tauler separada de la interfície i coberta amb tests JUnit.',
  'Ranking persistente con JDBC y patrón DAO.': 'Rànquing persistent amb JDBC i patró DAO.',
  'Build con Maven y CI en GitHub Actions.': 'Build amb Maven i CI a GitHub Actions.',
  'Aquí se ejecuta el mismo .jar de Java dentro del navegador.': "Aquí s'executa el mateix .jar de Java dins del navegador.",
  'En el navegador no hay base de datos, así que el ranking queda desactivado.':
    'Al navegador no hi ha base de dades, així que el rànquing queda desactivat.',
  'Gestión de inventario para una panadería: productos y movimientos de stock con Python y SQLite.':
    "Gestió d'inventari per a una fleca: productes i moviments d'estoc amb Python i SQLite.",
  'CRUD completo de productos y movimientos de entrada y salida.':
    "CRUD complet de productes i moviments d'entrada i sortida.",
  'Capa de datos separada del menú y modelos con clases.': 'Capa de dades separada del menú i models amb classes.',
  'Aquí se ejecuta el mismo código Python, con SQLite, en una terminal dentro del navegador.':
    "Aquí s'executa el mateix codi Python, amb SQLite, en un terminal dins del navegador.",
  'El programa original está en español: escribe el número de la opción y pulsa Enter.':
    "El programa original és en castellà: escriu el número de l'opció i prem Enter.",
  'Detección de movimiento': 'Detecció de moviment',
  'Aplicación de escritorio en C# que detecta movimiento con la webcam usando OpenCV.':
    "Aplicació d'escriptori en C# que detecta moviment amb la webcam fent servir OpenCV.",
  'Diferencia entre fotogramas, escala de grises, umbral y recuento de píxeles.':
    'Diferència entre fotogrames, escala de grisos, llindar i recompte de píxels.',
  'Gestión de memoria nativa de OpenCV fotograma a fotograma.': "Gestió de memòria nativa d'OpenCV fotograma a fotograma.",
  'Aquí funciona una versión web del mismo algoritmo con la cámara de tu dispositivo.':
    'Aquí funciona una versió web del mateix algorisme amb la càmera del teu dispositiu.',
  'Versión web del algoritmo original en C#. La imagen no sale de tu dispositivo.':
    "Versió web de l'algorisme original en C#. La imatge no surt del teu dispositiu.",
  'BlackJack en COBOL': 'BlackJack en COBOL',
  'El motor del juego en COBOL y la interfaz en Python, comunicados mediante archivos.':
    'El motor del joc en COBOL i la interfície en Python, comunicats mitjançant fitxers.',
  'Motor de reglas, mazo y apuestas escrito en COBOL.': 'Motor de regles, baralla i apostes escrit en COBOL.',
  'Interfaz gráfica en Python con Tkinter.': 'Interfície gràfica en Python amb Tkinter.',
  'Comunicación entre procesos mediante archivos de intercambio.':
    "Comunicació entre processos mitjançant fitxers d'intercanvi.",
  'Aquí se ejecuta el mismo blackjack.cob.cbl con un intérprete de COBOL que he escrito en TypeScript.':
    "Aquí s'executa el mateix blackjack.cob.cbl amb un intèrpret de COBOL que he escrit en TypeScript.",
  'Debajo de la mesa ves el registro BRIDGE.DAT que se intercambian la interfaz y el motor, y los párrafos COBOL que se ejecutan en cada jugada.':
    "Sota la taula veus el registre BRIDGE.DAT que s'intercanvien la interfície i el motor, i els paràgrafs COBOL que s'executen a cada jugada.",
  'Web de cuatro páginas, responsive y con animaciones, hecha con HTML5 y CSS3.':
    'Web de quatre pàgines, responsive i amb animacions, feta amb HTML5 i CSS3.',
  'Maquetación responsive sin frameworks.': 'Maquetació responsive sense frameworks.',
  'Animaciones y vídeo de fondo con CSS.': 'Animacions i vídeo de fons amb CSS.',

  // Tecnologías
  'este portfolio': 'aquest portfolio',
  Backend: 'Backend',
  bootcamp: 'bootcamp',
  Frontend: 'Frontend',
  Datos: 'Dades',
  'Calidad y entrega': 'Qualitat i lliurament',
  'todos mis proyectos': 'tots els meus projectes',
  'certificaciones AZ-900, AI-900, DP-900 y SC-900': 'certificacions AZ-900, AI-900, DP-900 i SC-900',
  'Usado en': 'Fet servir a',
  'usado en': 'fet servir a',
  'Con qué trabajo': 'Amb què treballo',
  'Pasa el cursor por una tecnología para ver dónde la he usado':
    "Passa el cursor per una tecnologia per veure on l'he fet servir",
  'Toca una tecnología para ver dónde la he usado': "Toca una tecnologia per veure on l'he fet servir",
  'Filtrar por área': 'Filtrar per àrea',
  Todo: 'Tot',

  // Cabecera y paleta
  'Saltar a los proyectos': 'Salta als projectes',
  Principal: 'Principal',
  'Abrir paleta de comandos': 'Obrir la paleta d’ordres',
  Comandos: 'Ordres',
  Disponible: 'Disponible',
  Idioma: 'Idioma',
  Proyectos: 'Projectes',
  Trayectoria: 'Trajectòria',
  Contacto: 'Contacte',
  Ejecutar: 'Executar',
  'Ir a': 'Anar a',
  Inicio: 'Inici',
  'Copiar mi email': 'Copiar el meu correu',
  'Abrir LinkedIn': 'Obrir LinkedIn',
  'Abrir GitHub': 'Obrir GitHub',
  'Paleta de comandos': 'Paleta d’ordres',
  'Escribe un comando o un proyecto…': 'Escriu una ordre o un projecte…',
  'Buscar comando': 'Cercar ordre',
  'Sin resultados': 'Cap resultat',
  'para moverte': 'per moure’t',
  'para elegir': 'per triar',

  // Contacto
  '¿Construimos': 'Construïm',
  'algo juntos?': 'alguna cosa junts?',
  'Estoy buscando mi primer puesto como desarrollador. Remoto o híbrido desde Tarragona, con incorporación inmediata.':
    'Busco la meva primera feina com a desenvolupador. En remot o híbrid des de Tarragona, amb incorporació immediata.',
  'Copiado ✓': 'Copiat ✓',
  'Copiar email': 'Copiar correu',
  'Descargar CV': 'Descarregar CV',
  'Descargar mi CV': 'Descarregar el meu CV',
  'Diseñado y programado por mí.': 'Dissenyat i programat per mi.',
  'Visitas contadas de forma anónima, sin cookies.': 'Visites comptades de manera anònima, sense galetes.',
  'React · TypeScript · GSAP · Java en el navegador con CheerpJ · Python con Pyodide · COBOL con un intérprete propio · Cloudflare':
    'React · TypeScript · GSAP · Java al navegador amb CheerpJ · Python amb Pyodide · COBOL amb un intèrpret propi · Cloudflare',

  // GitHub
  'Actividad del último año': "Activitat de l'últim any",
  'Mapa de contribuciones de GitHub': 'Mapa de contribucions de GitHub',
  'En directo': 'En directe',
  'Lo último que': "L'últim que",
  'he subido.': 'he pujat.',
  'GitHub no responde ahora mismo. Puedes ver todo en': 'GitHub no respon ara mateix. Pots veure-ho tot a',
  'Commits recientes': 'Commits recents',
  'Lenguajes en mis repositorios': 'Llenguatges als meus repositoris',

  // Sobre mí
  'Sobre mí': 'Sobre mi',
  'Busco mi primer puesto como desarrollador junior, en remoto o en híbrido desde Tarragona. Me adapto rápido a un equipo, pregunto cuando algo no está claro y dejo el código mejor de lo que lo encontré.':
    "Busco la meva primera feina com a desenvolupador júnior, en remot o en híbrid des de Tarragona. M'adapto ràpidament a un equip, pregunto quan alguna cosa no està clara i deixo el codi millor de com el vaig trobar.",
  'Escribo software que funciona y que se entiende. APIs con Java y Spring Boot o Node.js, interfaces con React, y la costumbre de probar lo que hago antes de darlo por terminado.':
    "Escric programari que funciona i que s'entén. APIs amb Java i Spring Boot o Node.js, interfícies amb React, i el costum de provar el que faig abans de donar-ho per acabat.",
  'de formación Full Stack con Java': 'de formació Full Stack amb Java',
  '2.º': '2n',
  'puesto en el Hackathon Tarragona 2025': 'lloc al Hackathon Tarragona 2025',
  'certificaciones de Microsoft Azure': 'certificacions de Microsoft Azure',
  'Retrato de Scheneider Baltazar dibujado con caracteres': 'Retrat de Scheneider Baltazar dibuixat amb caràcters',
  'Pasa el cursor: debajo está la foto': 'Passa el cursor: a sota hi ha la foto',
  'Toca el retrato para ver la foto': 'Toca el retrat per veure la foto',

  // Portada
  'Desarrollador Full Stack · Tarragona': 'Desenvolupador Full Stack · Tarragona',
  'Construyo aplicaciones web de principio a fin: APIs con Java, Spring Boot y Node.js, e interfaces con React. Mis proyectos se ejecutan aquí mismo, en tu navegador.':
    "Construeixo aplicacions web de principi a fi: APIs amb Java, Spring Boot i Node.js, i interfícies amb React. Els meus projectes s'executen aquí mateix, al teu navegador.",
  'Ver proyectos': 'Veure projectes',
  'Este planeta no es una imagen.': 'Aquest planeta no és una imatge.',
  'Son caracteres recalculados 60 veces por segundo.': 'Són caràcters recalculats 60 vegades per segon.',
  Pulsa: 'Prem',

  // Galería de proyectos
  'No te los enseño.': 'No te’ls ensenyo.',
  'Los ejecutas.': 'Els executes.',
  'Java, Python, COBOL y JavaScript funcionando dentro de esta página, sin instalar nada. Pulsa en cualquier proyecto para abrirlo aquí mismo.':
    'Java, Python, COBOL i JavaScript funcionant dins d’aquesta pàgina, sense instal·lar res. Prem qualsevol projecte per obrir-lo aquí mateix.',
  Tecnologías: 'Tecnologies',
  Código: 'Codi',
  'Abrir aquí': 'Obrir aquí',
  'Ejecutar Java': 'Executar Java',
  'Ejecutar Python': 'Executar Python',
  'Probar con cámara': 'Provar amb càmera',
  'Ver el código': 'Veure el codi',
  'Jugar en COBOL': 'Jugar en COBOL',

  // Trayectoria
  'Aprender rápido,': 'Aprendre ràpid,',
  'entregar código que funciona.': 'lliurar codi que funciona.',
  '2.º puesto · Hackathon Tarragona': '2n lloc · Hackathon Tarragona',
  'En un equipo de cuatro programamos una solución con IA para agilizar trámites del Ajuntament, con modelos en local (Ollama) para que funcionara en un ordenador normal.':
    "En un equip de quatre vam programar una solució amb IA per agilitzar tràmits de l'Ajuntament, amb models en local (Ollama) perquè funcionés en un ordinador normal.",
  'Repositorio del equipo': "Repositori de l'equip",
  'Feb – Ago 2025': 'Febr. – Ag. 2025',
  'Bootcamp de 576 horas en la Fundación Esplai: Java, POO, bases de datos SQL y MongoDB, Maven y JUnit, Spring, HTML, CSS, JavaScript y React. Proyecto final en equipo: LifeLevelUp.':
    "Bootcamp de 576 hores a la Fundació Esplai: Java, POO, bases de dades SQL i MongoDB, Maven i JUnit, Spring, HTML, CSS, JavaScript i React. Projecte final en equip: LifeLevelUp.",
  Certificaciones: 'Certificacions',
  'AZ-900, AI-900, DP-900 y SC-900. Y Java SE 11 Programming II, de La Salle.':
    'AZ-900, AI-900, DP-900 i SC-900. I Java SE 11 Programming II, de La Salle.',

  // Ventana de ejecución
  Hola: 'Hola',
  'Pestaña nueva': 'Pestanya nova',
  Cerrar: 'Tancar',
  'Preparando el entorno…': "Preparant l'entorn…",
  'Ocultar detalles': 'Amagar detalls',
  'Ver detalles del proyecto': 'Veure detalls del projecte',
  'Aplicación web': 'Aplicació web',
  'Java en el navegador': 'Java al navegador',
  'Python en el navegador': 'Python al navegador',
  'Visión por computador': 'Visió per computador',
  'Código fuente': 'Codi font',
  'COBOL en el navegador': 'COBOL al navegador',
  'Compara cada fotograma con el anterior y cuenta los píxeles que cambian. Si cambian más de la cuenta, hay movimiento.':
    "Compara cada fotograma amb l'anterior i compta els píxels que canvien. Si en canvien massa, hi ha moviment.",
  'Encender la cámara': 'Encendre la càmera',
  'No se pudo acceder a la cámara. Revisa los permisos del navegador.':
    "No s'ha pogut accedir a la càmera. Revisa els permisos del navegador.",
  'Todo se procesa en tu dispositivo. Nada se graba ni se envía.':
    "Tot es processa al teu dispositiu. No es grava ni s'envia res.",
  'Píxeles cambiados': 'Píxels canviats',
  'Movimiento detectado': 'Moviment detectat',
  'Sin movimiento': 'Sense moviment',
  Umbral: 'Llindar',
  'Error en el intérprete': "Error a l'intèrpret",
  'Analizando el programa COBOL…': 'Analitzant el programa COBOL…',
  GANASTE: 'HAS GUANYAT',
  PERDISTE: 'HAS PERDUT',
  EMPATE: 'EMPAT',
  Mesa: 'Taula',
  'párrafos analizados en': 'paràgrafs analitzats en',
  Crupier: 'Crupier',
  Tú: 'Tu',
  Saldo: 'Saldo',
  Apuesta: 'Aposta',
  Mazo: 'Baralla',
  Apostar: 'Apostar',
  Repartir: 'Repartir',
  Pedir: 'Demanar',
  P: 'D',
  Plantarse: 'Plantar-se',
  'Reiniciar saldo': 'Reiniciar saldo',
  'instrucciones COBOL en': 'instruccions COBOL en',
  'Carta boca abajo': 'Carta cap per avall',
  'Arquitectura del proyecto': 'Arquitectura del projecte',
  Interfaz: 'Interfície',
  Motor: 'Motor',
  'Leyendo el código desde GitHub…': 'Llegint el codi des de GitHub…',
  'No se pudo leer el código. Puedes verlo en el repositorio.': "No s'ha pogut llegir el codi. Pots veure'l al repositori.",
  'Arrancando una máquina virtual de Java en tu navegador…': 'Engegant una màquina virtual de Java al teu navegador…',
  'No se pudo iniciar Java en este navegador. Prueba con Chrome, Edge o Firefox actualizados.':
    "No s'ha pogut iniciar Java en aquest navegador. Prova amb Chrome, Edge o Firefox actualitzats.",
  'Controles del juego': 'Controls del joc',
  'Teclado: flechas para mover y girar, espacio para soltar, C para guardar pieza.':
    'Teclat: fletxes per moure i girar, espai per deixar anar, C per guardar peça.',
  Izquierda: 'Esquerra',
  Girar: 'Girar',
  Derecha: 'Dreta',
  Bajar: 'Baixar',
  'Caída rápida': 'Caiguda ràpida',
  'Guardar pieza': 'Guardar peça',
  'Volver a ejecutar': 'Tornar a executar',
  'Cargando Python 3 y SQLite en tu navegador…': 'Carregant Python 3 i SQLite al teu navegador…',
  'No se pudo cargar Python. Revisa tu conexión y vuelve a intentarlo.':
    "No s'ha pogut carregar Python. Revisa la connexió i torna-ho a provar.",
  'Respuesta para el programa': 'Resposta per al programa',
  '— Programa terminado —': '— Programa acabat —',
  'Cargando la aplicación…': "Carregant l'aplicació…",

  // Mensajes que escribe el programa COBOL
  'PON TU APUESTA': 'FES LA TEVA APOSTA',
  'APUESTA ACEPTADA': 'APOSTA ACCEPTADA',
  'APUESTA CERRADA': 'APOSTES TANCADES',
  'APUESTA PRIMERO': 'APOSTA PRIMER',
  'SIN SALDO': 'SENSE SALDO',
  'JUEGA TU MANO': 'JUGA LA TEVA MÀ',
  'TE PASASTE': "T'HAS PASSAT",
  'CRUPIER BUST': 'CRUPIER PASSAT',
  'BLACKJACK PUSH': 'BLACKJACK EMPAT',
  BLACKJACK: 'BLACKJACK',
}
