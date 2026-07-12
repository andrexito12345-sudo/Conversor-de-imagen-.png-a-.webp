# WebP Express — Conversor de imágenes a WebP

Herramienta web para convertir múltiples formatos de imagen (PNG, JPG, JPEG, WEBP, AVIF, GIF, BMP, SVG) a **WebP** y optimizar su tamaño automáticamente. Todo el procesamiento ocurre **100 % en tu navegador**: tus imágenes nunca se suben a ningún servidor.

## ✨ Características

- **Multiformato de entrada → WebP de salida.** Acepta PNG, JPEG/JPG, WEBP, GIF, AVIF, BMP y SVG.
- **Procesamiento local y privado.** Todo se ejecuta en el navegador con `<canvas>`; ninguna imagen abandona tu equipo.
- **Arrastrar y soltar** o selección múltiple de archivos, sin límite de cantidad.
- **Optimización automática** al cargar, con progreso por imagen.
- **Preajustes de compresión:**
  - **Equilibrado** (recomendado): calidad 80 %, ancho máx. 1920 px.
  - **Alta compresión (Mobile):** calidad 55 %, ancho máx. 1200 px.
  - **Máxima fidelidad:** calidad 92 %, tamaño original.
  - **Personalizado:** ajusta calidad y tamaño a tu gusto.
- **Control de calidad** con guía en tiempo real y **límite de ancho máximo** con redimensionado proporcional.
- **Renombrado por lotes** con prefijo y sufijo personalizables.
- **Comparador visual** antes/después de cada imagen.
- **Métricas de ahorro** por imagen y del lote completo (peso original vs. optimizado y % ahorrado).
- **Descarga individual o de todo el lote.**

## 🛠️ Tecnologías

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 6](https://vitejs.dev/) como bundler y servidor de desarrollo
- [Tailwind CSS 4](https://tailwindcss.com/) para el diseño
- [Motion](https://motion.dev/) para las animaciones
- [lucide-react](https://lucide.dev/) para los iconos

## 🚀 Puesta en marcha

Requisitos: [Node.js](https://nodejs.org/) 18 o superior.

```bash
# 1. Clonar el repositorio
git clone https://github.com/andrexito12345-sudo/Conversor-de-imagen-.png-a-.webp.git
cd Conversor-de-imagen-.png-a-.webp

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

Luego abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Scripts disponibles

| Script            | Descripción                                             |
| ----------------- | ------------------------------------------------------- |
| `npm run dev`     | Inicia el servidor de desarrollo (puerto 3000).         |
| `npm run build`   | Genera la versión de producción en `dist/`.             |
| `npm run preview` | Sirve localmente la build de producción.                |
| `npm run lint`    | Comprueba los tipos con TypeScript (`tsc --noEmit`).    |
| `npm run clean`   | Elimina `dist/` y `server.js`.                          |

## 📖 Cómo se usa

1. Arrastra tus imágenes al recuadro o haz clic para seleccionarlas.
2. Se optimizan automáticamente a WebP en cuanto se cargan.
3. Ajusta el preajuste, la calidad o el ancho máximo si lo necesitas y pulsa **Aplicar y Re-optimizar**.
4. Usa **Comparar** para revisar la calidad antes/después.
5. Descarga cada imagen o pulsa **Descargar Todas**.

## ⚙️ Variables de entorno (opcional)

El proyecto incluye un `.env.example` con variables pensadas para su despliegue en Google AI Studio:

```env
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="MY_APP_URL"
```

> La conversión a WebP funciona íntegramente en el navegador y **no requiere** ninguna clave de API. Estas variables solo son necesarias si integras funciones adicionales de Gemini o el despliegue de AI Studio.

## 📁 Estructura del proyecto

```
├── index.html
├── src/
│   ├── App.tsx                    # Interfaz y lógica principal
│   ├── main.tsx                   # Punto de entrada de React
│   ├── types.ts                   # Tipos (ImageFile, OptimizationSettings…)
│   ├── index.css                  # Estilos base (Tailwind)
│   ├── components/
│   │   └── ImageComparer.tsx      # Modal comparador antes/después
│   └── utils/
│       └── imageProcessor.ts      # Conversión y optimización a WebP
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 📄 Licencia

Distribuido bajo la licencia **MIT**. Consulta el archivo [`LICENSE`](./LICENSE) para más detalles.

---

Desarrollado con ❤️ para una web más ágil y rápida.
