import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'https://docs.rutter.com/rest/2024-08-31/spec',
  output: {
    path: 'src/generated',
    clean: true,
  },
  plugins: [
    {
      name: '@hey-api/typescript',
      enums: 'typescript',
    },
    'zod',
  ],
})
