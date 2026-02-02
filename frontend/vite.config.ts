import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	build: {
		outDir: '../server/public',
		emptyOutDir: true
	},
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true
			}
		}
	}
});
