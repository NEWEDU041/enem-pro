export default {
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', '__tests__/**/*.test.ts', 'lib/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'lib/**/*.js', 'app/**/*.ts', 'app/**/*.js'],
      exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
      lines: 60,
      functions: 60,
      branches: 60,
      statements: 60,
      all: true,
      skipFull: true
    }
  },
  resolve: {
    alias: {},
  },
}
