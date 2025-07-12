# 🎬 Pelispunk

Pelispunk es una aplicación web que permite buscar torrents recientes de películas y series, obtener información visual como pósters desde TMDb, y en el futuro permitirá hacer streaming directamente desde el navegador.

> Este proyecto es una evolución del **[MovieWatcher](https://github.com/MiuraUY/MovieWatcher)**, una app de escritorio desarrollada en WinForms y .NET. Pelispunk nace como su contraparte web, con fines educativos y prácticos, para aprender y aplicar tecnologías modernas como React, TailwindCSS y ASP.NET Core.

---

## 📦 Tecnologías utilizadas

- **Frontend:** React + TailwindCSS
- **Backend:** ASP.NET Core Web API
- **Fuentes de datos:**
  - [apibay.org](https://apibay.org) (The Pirate Bay API no oficial)
  - [The Movie Database (TMDb)](https://www.themoviedb.org/)

---

## 🛠 Estructura del Proyecto

Este repositorio contiene:
```
Pelispunk/
├── backend/         # API REST en ASP.NET Core (antes "MovieWatcher.API")
└── frontend/        # Interfaz web en React + Tailwind (antes "moviewatcher-frontend")
```

---

## 🔙 Backend - ASP.NET Core

### Funcionalidad

- **/api/peliculas/populares** → Películas populares desde TMDb.
- **/api/peliculas/recientes** → Películas actualmente en cartelera.
- **/api/torrents/recientes** → Top 50 torrents recientes (películas y series) desde apibay.
- **/api/torrents/buscar?nombre=xxx** → Busca torrents por nombre.

### Enriquecimiento con TMDb

- Limpieza de títulos de torrents (remueve tags como 1080p, WEBRip, etc).
- Si el torrent tiene IMDb ID, se busca el póster directamente con ese dato.
- Si no tiene IMDb, se hace una búsqueda por texto en TMDb según tipo (`movie` o `tv`).

### Lógica auxiliar

- `LimpiarTitulo` → transforma nombres de torrents a títulos legibles.
- `CategoriaATipo` → mapea categoría de TPB a `"movie"` o `"tv"`.
- `BuscarPosterTMDbAsync` → se encarga de obtener la imagen adecuada.

### Seguridad y buenas prácticas

- Uso de `HttpClient` y manejo de errores.
- CORS habilitado para desarrollo local.
- API Key de TMDb oculta mediante `appsettings.json` (excluido del repo vía `.gitignore`).

---

## 🎨 Frontend - React + TailwindCSS

### Componentes principales

- **App.js**: punto de entrada, maneja el estado global.
- **SearchBar.jsx**: input para búsqueda.
- **TorrentsList.jsx**: renderiza los resultados de forma visual con póster, título y botones.

### Flujo de usuario

1. Al abrir la app, se cargan automáticamente los torrents más recientes.
2. El usuario puede buscar por nombre y filtrar resultados.
3. Cada resultado muestra:
   - 📌 Título
   - 🎞️ Póster
   - 🔗 Link magnet (descarga)
   - 🎬 Botón de streaming (próximamente)

### UX y diseño

- Estética dark + diseño responsive.
- Imágenes optimizadas (`loading="lazy"`).
- Feedback de carga o errores de búsqueda.

---

## 🔁 Flujo General de Datos

1. El **backend** consulta apibay y devuelve torrents recientes o por búsqueda.
2. Se limpian los títulos y se enriquecen con imágenes de TMDb.
3. El **frontend** muestra todo de forma visual al usuario final.

---

## 📌 Consideraciones Técnicas y Futuro

- 🔐 Las claves como `TMDb:ApiKey` deben manejarse por entorno (`appsettings.json` ya está en `.gitignore`).
- ⚠️ Mejorar la limpieza de títulos con Regex o NLP para más precisión.
- 🚀 Próxima funcionalidad: integración de **WebTorrent** para stremear en el navegador.
- 🧪 Ideal para practicar consumo de APIs, manejo de estados y fullstack moderno.
- 🧰 Se puede migrar a monorepo con herramientas como Turborepo o mantener la estructura actual.

---

## 📎 Notas finales

Este proyecto fue pensado como práctica intensiva fullstack. 
El aprendizaje y estructura fue dirigida y ensamblada con fines de comprensión personal.  
El código está vivo, sujeto a mejoras y abierto a contribuciones.

---

## 👨‍💻 Autor

Hecho con 💻 y 🍿 por [Leonardo Alvarez](https://www.linkedin.com/in/leonardo-alvarez-a33031173/)

Si te gustó este proyecto o tenés sugerencias, ¡contactame!

---

> 💀 **Pelispunk** no promueve la piratería. Su propósito es puramente educativo y experimental.
