import { defineConfig } from 'vite';

export default defineConfig({
  // Todo el contenido de la carpeta 'public' se copiará a la raíz de 'dist' sin procesar.
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || warning.message?.includes('Module level directives')) {
          return;
        }
        defaultHandler(warning);
      },
      input: {
        main: 'index.html',
      },
      // Marcamos como externas las dependencias que se cargan vía CDN/Importmap
      // para que Rollup no intente resolverlas localmente en node_modules.
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        '@google/genai',
        'lucide-react',
        'recharts',
        'jspdf'
      ],
      output: {
        // Aseguramos que los imports externos se mantengan como tales en el bundle
        format: 'es'
      }
    },
  },
});
