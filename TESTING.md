# Testing Guide

This guide covers testing strategies for the WhatsApp Scan & Show application.

## Unit Testing Setup

Install testing dependencies:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

Create `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

## Component Testing

### Test QR Code Component

```javascript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QRCodeComponent from '@/components/QRCode'

describe('QRCodeComponent', () => {
  it('renders generate button', () => {
    render(<QRCodeComponent onQRGenerated={() => {}} onScanComplete={() => {}} />)
    expect(screen.getByText(/Generate QR Code/i)).toBeInTheDocument()
  })

  it('generates QR code on button click', async () => {
    const user = userEvent.setup()
    const mockOnGenerated = jest.fn()
    
    render(
      <QRCodeComponent 
        onQRGenerated={mockOnGenerated} 
        onScanComplete={() => {}} 
      />
    )
    
    await user.click(screen.getByText(/Generate QR Code/i))
    
    await waitFor(() => {
      expect(mockOnGenerated).toHaveBeenCalled()
    })
  })
})
```

### Test Message Bubble Component

```javascript
import { render, screen } from '@testing-library/react'
import MessageBubble from '@/components/MessageBubble'

describe('MessageBubble', () => {
  it('renders message content', () => {
    const message = {
      id: '1',
      sender: 'John',
      content: 'Hello!',
      timestamp: '10:00 AM',
      isOwn: true,
      avatar: '👤',
    }
    
    render(<MessageBubble message={message} />)
    expect(screen.getByText('Hello!')).toBeInTheDocument()
  })

  it('applies different styles for own messages', () => {
    const message = {
      id: '1',
      sender: 'John',
      content: 'Hello!',
      timestamp: '10:00 AM',
      isOwn: true,
      avatar: '👤',
    }
    
    const { container } = render(<MessageBubble message={message} />)
    const bubble = container.querySelector('[class*="green"]')
    expect(bubble).toBeInTheDocument()
  })
})
```

## API Testing

### Test Wuz API Utilities

```javascript
import { generateQRCode, checkSessionStatus } from '@/lib/wuzApi'

describe('Wuz API Utilities', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('generates QR code', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessionId: '123', qrCode: 'data:image/png;...' }),
    })

    const result = await generateQRCode()
    expect(result.sessionId).toBe('123')
  })

  it('checks session status', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isConnected: true, status: 'connected' }),
    })

    const result = await checkSessionStatus('123')
    expect(result.isConnected).toBe(true)
  })
})
```

## E2E Testing with Cypress

Install Cypress:
```bash
npm install --save-dev cypress
```

Create `cypress/e2e/scan-and-message.cy.js`:

```javascript
describe('WhatsApp Scan and Message Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000')
  })

  it('generates QR code and navigates to inbox', () => {
    // Check initial state
    cy.contains('Connect Your WhatsApp').should('be.visible')
    
    // Click generate button
    cy.contains('Generate QR Code').click()
    
    // Wait for QR code
    cy.get('canvas', { timeout: 10000 }).should('be.visible')
    
    // Simulate scan completion
    cy.intercept('GET', '**/session-status/**', {
      statusCode: 200,
      body: { sessionId: '123', isConnected: true, status: 'connected' },
    })
    
    // Wait for redirect to inbox
    cy.contains('Loading inbox...', { timeout: 10000 }).should('be.visible')
  })

  it('sends and receives messages', () => {
    // Navigate to inbox
    cy.contains('John Doe').click()
    
    // Type message
    cy.get('input[placeholder="Type a message..."]').type('Hello!')
    
    // Send message
    cy.get('button[type="submit"]').click()
    
    // Verify message appears
    cy.contains('Hello!').should('be.visible')
  })

  it('searches chats', () => {
    // Type in search
    cy.get('input[placeholder="Search chats..."]').type('John')
    
    // Verify filtered results
    cy.contains('John Doe').should('be.visible')
    cy.contains('Design Team').should('not.be.visible')
  })
})
```

## Performance Testing

### Lighthouse Testing

```bash
# Install lighthouse CLI
npm install --save-dev @lhci/cli@

# Create lighthouserc.json
cat > lighthouserc.json << 'EOF'
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
EOF

# Run lighthouse
lhci autorun
```

## Accessibility Testing

Use axe-core for accessibility testing:

```bash
npm install --save-dev @axe-core/react
```

```javascript
import { axe, toHaveNoViolations } from 'jest-axe'
import { render } from '@testing-library/react'
import InboxView from '@/components/InboxView'

expect.extend(toHaveNoViolations)

describe('Accessibility', () => {
  it('inbox view has no violations', async () => {
    const { container } = render(
      <InboxView sessionId="123" onBackToScan={() => {}} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

## Manual Testing Checklist

- [ ] QR code generates successfully
- [ ] QR code displays correctly on different screen sizes
- [ ] Scan simulation works
- [ ] Inbox loads after "scan"
- [ ] Chat list displays all chats
- [ ] Chat search filters correctly
- [ ] Messages display in correct order
- [ ] Own messages styled differently
- [ ] Can send new messages
- [ ] Message input clears after sending
- [ ] Back button returns to scan view
- [ ] Responsive design works on mobile
- [ ] Animations are smooth
- [ ] No console errors
- [ ] API endpoints respond correctly

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- MessageBubble.test.tsx

# Run with coverage
npm test -- --coverage

# Run E2E tests
npx cypress open
```

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```
