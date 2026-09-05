# Bóveda de Prompts

Repositorio personal de prompts de IA: un solo lugar para guardar, categorizar,
buscar y copiar los prompts que hoy están dispersos en notas, documentos y
apps de mensajería. Pensado para vivir en **GitHub Pages**, sin backend ni
build step: HTML + CSS + JavaScript puro.

## 1. Estructura del repositorio

```
prompt-vault/
├── index.html          # Estructura de la página (sidebar, grilla, modal)
├── css/
│   └── styles.css      # Sistema de diseño (tokens de color, tipografía, layout)
├── js/
│   └── app.js          # Estado, render, CRUD, búsqueda, import/export
├── data/
│   └── prompts.json    # Semilla inicial: categorías y prompts de ejemplo
└── README.md
```

No hay carpeta `dist` ni paso de build: lo que ves es lo que se publica.

## 2. Estrategia de almacenamiento de datos

GitHub Pages solo sirve archivos estáticos, así que no puede recibir
escrituras del navegador (no hay servidor que reciba el `POST` de un
formulario ni haga `commit` por ti). Estas eran las opciones evaluadas:

| Opción | Pros | Contras |
|---|---|---|
| **localStorage + export/import JSON** ✅ elegida | Cero configuración, funciona offline, sin cuentas ni claves, control total de tus datos | Los datos viven en el navegador; hay que exportar manualmente para respaldar o mover a otro dispositivo |
| JSON en el repo + commits automáticos | Los datos quedan versionados en Git | Requiere que el propio navegador pueda hacer commits, lo que implica exponer un token de GitHub en un sitio público — riesgo de seguridad para un repo personal |
| Firebase / Supabase | Sincronización en tiempo real entre dispositivos | Requiere crear cuenta, configurar reglas de seguridad y mantener credenciales; sobra para un uso 100% personal y de un solo usuario |
| GitHub Actions | Podría automatizar validaciones o commits periódicos | No resuelve el problema de origen (el navegador sigue sin poder escribir directo al repo) sin un token expuesto |

**Por qué localStorage + export/import es lo más adecuado aquí:** es un caso
de uso de un solo usuario, sin necesidad de tiempo real ni de acceso
multiusuario. localStorage guarda tus cambios automáticamente en cada
navegador donde uses la página, y los botones **Exportar JSON** / **Importar
JSON** de la barra lateral te dejan:

- Descargar un respaldo (`prompt-vault-backup-YYYY-MM-DD.json`) cuando quieras.
- Sobrescribir `data/prompts.json` con ese respaldo y hacer `commit` +
  `push`, dejando tus prompts versionados en Git como copia de seguridad
  permanente.
- Llevar ese mismo archivo a otro computador e importarlo ahí, para
  sincronizar manualmente entre dispositivos.

**Ruta de mejora futura (opcional):** si en algún momento quieres
sincronización automática entre dispositivos sin pasos manuales, la opción
más simple sería añadir Supabase (con su capa gratuita) y cambiar `app.js`
para leer/escribir en una tabla en vez de `localStorage`. La estructura de
datos (`{ categories, prompts }`) ya está pensada para que ese cambio no
requiera tocar el HTML/CSS ni la lógica de render.

## 3. Cómo se usan los datos en el código

1. Al cargar la página, `app.js` busca datos en `localStorage`.
2. Si no hay nada (primera visita), carga `data/prompts.json` como semilla
   y la guarda en `localStorage`.
3. Cada alta, edición o borrado desde la interfaz actualiza `localStorage`
   de inmediato — no necesitas guardar manualmente.
4. Exportar/Importar es la única vía para mover datos entre navegadores o
   dejarlos respaldados en el repositorio.

> Recomendación: exporta cada cierto tiempo (por ejemplo, una vez por semana
> o después de agregar varios prompts) y sobrescribe `data/prompts.json` con
> el resultado, luego haz commit. Así, aunque borres el caché del navegador,
> siempre tienes una copia reciente en Git.

## 4. Despliegue en GitHub Pages

1. **Crea el repositorio** (puede ser público o privado; GitHub Pages
   funciona con ambos si tienes plan que lo permita — los repos públicos
   siempre pueden usar Pages gratis):
   ```bash
   cd prompt-vault
   git init
   git add .
   git commit -m "Primera versión de la bóveda de prompts"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/prompt-vault.git
   git push -u origin main
   ```

2. **Activa GitHub Pages:**
   - Entra a tu repositorio en GitHub → pestaña **Settings**.
   - En el menú lateral, ve a **Pages**.
   - En **Build and deployment → Source**, elige **Deploy from a branch**.
   - En **Branch**, selecciona `main` y la carpeta `/ (root)`.
   - Guarda. GitHub tarda uno o dos minutos en publicar.

3. **Accede a tu página:** quedará disponible en
   `https://TU-USUARIO.github.io/prompt-vault/`.

4. **Actualizaciones posteriores:** cualquier cambio que quieras publicar
   (por ejemplo, un `data/prompts.json` actualizado tras exportar tu
   respaldo) solo requiere:
   ```bash
   git add .
   git commit -m "Actualiza semilla de prompts"
   git push
   ```
   GitHub Pages se actualiza automáticamente con cada push a `main`.

## 5. Funcionalidades incluidas

- Visualización de todos los prompts en tarjetas, organizadas por categoría.
- Categorías predefinidas + creación de nuevas categorías al vuelo, tanto
  desde la barra lateral como desde el propio formulario de alta.
- Alta y edición de prompts vía modal: título, texto completo, categoría,
  etiquetas opcionales y fecha automática.
- Buscador en vivo por título, texto, categoría o etiquetas.
- Botón de copiar al portapapeles en cada tarjeta.
- Exportación/importación de respaldo en JSON.
- Diseño responsive con barra lateral tipo panel deslizable en móvil.

## 6. Personalización rápida

- **Colores y tipografías:** todo está centralizado en las variables CSS al
  inicio de `css/styles.css` (`:root { ... }`).
- **Categorías iniciales:** edita el arreglo `categories` en
  `data/prompts.json`.
- **Nombre de la app:** cambia el texto dentro de `<h1 class="brand">` en
  `index.html` y el `<title>` del `<head>`.
