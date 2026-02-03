import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [tailwindcss(), svelte()],
	build: { outDir: '../server/public', emptyOutDir: true },
	server: {
		proxy: {
			'/api': { target: 'http://localhost:3000', changeOrigin: true }
		}
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib')
		}
	}
});
