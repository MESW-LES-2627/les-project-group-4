// React 19 warns when act() is used without the testing-environment flag.
// @react-three/test-renderer calls act() internally, so tests must opt in.
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

// @react-three/test-renderer loads three through its CJS entry, which emits a
// deprecation warning. Silence it until the package switches to ESM-only.
process.noDeprecation = true
