import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, onTestFinished } from 'vitest'

// A tiny component owned by this test, so AT-1 checks the harness itself and does not
// depend on any app component.
function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  )
}

describe(
  'AT-1 — Harness: .dom.test.tsx files run in jsdom with Testing Library and jest-dom',
  { tags: ['acceptance', 'CH-05', 'AT-1'] },
  () => {
    it('runs in jsdom, not node', () => {
      expect(typeof window).toBe('object')
      expect(navigator.userAgent).toMatch(/jsdom/)
    })

    it('renders a React component and reacts to user events', async () => {
      render(<Counter />)

      await userEvent.setup().click(screen.getByRole('button', { name: 'Clicked 0 times' }))

      // toBeInTheDocument comes from jest-dom, registered by vitest.setup.dom.ts.
      expect(screen.getByRole('button', { name: 'Clicked 1 times' })).toBeInTheDocument()
    })

    // Self-contained: renders, then checks the DOM after the test's afterEach hooks have run
    // (onTestFinished runs after them). Passes alone (-t), skipped siblings or any order.
    it('cleans up the DOM after each test (afterEach(cleanup) in vitest.setup.dom.ts)', () => {
      onTestFinished(() => {
        expect(document.body).toBeEmptyDOMElement()
      })

      render(<Counter />)
      expect(screen.getByRole('button', { name: 'Clicked 0 times' })).toBeInTheDocument()
    })
  },
)
