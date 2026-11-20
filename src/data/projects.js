/**
 * The classroom project catalogue.
 * `repo_folder` points at the starter code extracted from the source zips,
 * relative to the repository root.
 */
export const PROJECTS = [
  {
    slug: 'browser-extensions-manager-ui',
    name: 'Browser Extensions Manager UI',
    description:
      'A dashboard for toggling browser extensions on and off, with filtering between active and inactive lists.',
    repo_folder: 'projects/browser-extensions-manager-ui-main',
    difficulty: 'Intermediate',
    tags: ['Responsive', 'State']
  },
  {
    slug: 'conference-ticket-generator',
    name: 'Conference Ticket Generator',
    description:
      'A form that captures attendee details, validates them, and generates a personalised conference ticket.',
    repo_folder: 'projects/conference-ticket-generator-main',
    difficulty: 'Intermediate',
    tags: ['Forms', 'Validation']
  },
  {
    slug: 'frontpage-feed-reader',
    name: 'Frontpage Feed Reader',
    description:
      'A news-style feed reader that renders a list of articles with layout and typography fidelity.',
    repo_folder: 'projects/frontpage-feed-reader-main',
    difficulty: 'Beginner',
    tags: ['Layout', 'Typography']
  },
  {
    slug: 'gamer-sign-up-form',
    name: 'Gamer Sign-up Form',
    description:
      'A themed multi-field sign-up form with live inline validation and clear error states.',
    repo_folder: 'projects/gamer-sign-up-form-main',
    difficulty: 'Beginner',
    tags: ['Forms', 'Validation']
  },
  {
    slug: 'mortgage-repayment-calculator',
    name: 'Mortgage Repayment Calculator',
    description:
      'A calculator that turns loan inputs into monthly and total repayment figures.',
    repo_folder: 'projects/mortgage-repayment-calculator-main',
    difficulty: 'Intermediate',
    tags: ['Logic', 'Calculation']
  },
  {
    slug: 'product-list-with-cart',
    name: 'Product List with Cart',
    description:
      'A dessert shop with add-to-cart, quantity controls, order confirmation and a live cart total.',
    repo_folder: 'projects/product-list-with-cart-main',
    difficulty: 'Advanced',
    tags: ['Cart', 'State']
  },
  {
    slug: 'typing-speed-test',
    name: 'Typing Speed Test',
    description:
      'A timed typing test that measures WPM and accuracy against a random passage.',
    repo_folder: 'projects/typing-speed-test-main',
    difficulty: 'Advanced',
    tags: ['Timing', 'State']
  }
]
