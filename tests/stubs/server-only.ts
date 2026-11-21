// No-op replacement for the `server-only` marker in Vitest.
// Next resolves the real package per bundling layer; the tests that import
// server modules only need the marker to be harmless outside the bundler.
export {}
