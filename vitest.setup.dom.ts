// CH-05: setup for the `components` project only (see vitest.config.mts).
// Adds the jest-dom matchers (toBeInTheDocument, toBeDisabled, toHaveValue...)
// to Vitest's expect, and removes what a test rendered before the next one starts.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
