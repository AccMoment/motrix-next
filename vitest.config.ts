/** @fileoverview Vitest configuration leveraging Vite aliases for path resolution. */
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
    await viteConfig(),
    defineConfig({
        test: {
            environment: 'happy-dom',
            include: ['src/**/*.{test,spec}.ts'],
            coverage: {
                provider: 'v8',
                reporter: ['text', 'lcov'],
                include: ['src/shared/**/*.ts', 'src/stores/**/*.ts', 'src/composables/**/*.ts'],
                exclude: ['src/**/*.d.ts', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
            },
        },
    }),
)
