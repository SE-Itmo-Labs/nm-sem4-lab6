export default defineConfig({
  root: path.resolve(__dirname, 'src/main/resources/public'),
  build: {
    outDir: path.resolve(__dirname, 'src/main/resources/public'),
    emptyOutDir: false,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main/resources/public/index.html')
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:7070'
    },
    open: false
  }
});