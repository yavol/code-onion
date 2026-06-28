export type Persona = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
};

export type Channel = {
  id: string;
  name: string;
  topic: string;
  unread?: number;
  status: 'active' | 'quiet' | 'locked';
  layer: string;
};

export type Message = {
  id: number;
  channelId: string;
  author: string;
  role: string;
  avatar: string;
  time: string;
  body: string;
  kind?: 'normal' | 'agent' | 'report' | 'approval';
  tags?: string[];
  reactions?: { emoji: string; count: number }[];
};

export type ApprovalStatus = 'waiting' | 'approved' | 'blocked' | 'released';

export type Approval = {
  id: string;
  title: string;
  layer: string;
  file: string;
  request: string;
  required: string[];
  capability: string;
  status: ApprovalStatus;
  severity: 'safe' | 'review' | 'blocked';
};

export const personas: Persona[] = [
  {
    id: 'agent',
    name: 'Code Onion Agent',
    role: 'Coding agent',
    avatar: 'CO',
    color: '#244c3b'
  },
  {
    id: 'finance',
    name: 'Owen Rao',
    role: '@finance',
    avatar: 'OR',
    color: '#7a4e19'
  },
  {
    id: 'product',
    name: 'Maya Chen',
    role: '@product',
    avatar: 'MC',
    color: '#7b3f53'
  },
  {
    id: 'security',
    name: 'Priya Shah',
    role: '@security',
    avatar: 'PS',
    color: '#24445f'
  },
  {
    id: 'qa',
    name: 'Ben Alvarez',
    role: '@qa',
    avatar: 'BA',
    color: '#52512d'
  }
];

export const channels: Channel[] = [
  {
    id: 'agent-approvals',
    name: 'agent-approvals',
    topic: 'Code Onion authority reports, approvals, and credential release receipts',
    unread: 5,
    status: 'active',
    layer: 'authority'
  },
  {
    id: 'tax-engine',
    name: 'tax-engine',
    topic: 'Federal/state filing rules, deduction graph, and e-file validations',
    unread: 2,
    status: 'quiet',
    layer: 'domain'
  },
  {
    id: 'pricing',
    name: 'pricing',
    topic: 'Plan packaging, coupons, refund policy, and seasonal promo risk',
    unread: 1,
    status: 'locked',
    layer: 'money.pricing'
  },
  {
    id: 'recommendations',
    name: 'recommendations',
    topic: 'Deduction prompts, confidence thresholds, recall/latency tradeoffs',
    status: 'quiet',
    layer: 'product_quality'
  },
  {
    id: 'release-room',
    name: 'release-room',
    topic: 'Cutover plan for FastTax 2026 filing season',
    unread: 3,
    status: 'active',
    layer: 'deploy'
  },
  {
    id: 'qa-test-oracles',
    name: 'qa-test-oracles',
    topic: 'Protected test fixtures and paid-customer filing workflows',
    status: 'locked',
    layer: 'test_oracle'
  },
  {
    id: 'provider-switch',
    name: 'provider-switch',
    topic: 'IRS gateway, KYC, payment, and document OCR provider changes',
    status: 'locked',
    layer: 'vendor'
  }
];

export const approvals: Approval[] = [
  {
    id: 'perf',
    title: 'Document OCR line scoring hot path',
    layer: 'implementation.performance',
    file: 'src/document_ocr/line_score.js',
    request: 'Keyword scoring loop improves tax-line extraction speed. Golden document output matches.',
    required: ['document_ocr_unit_tests', 'golden_document_tests', 'benchmark_no_regression'],
    capability: 'merge.implementation.performance',
    status: 'released',
    severity: 'safe'
  },
  {
    id: 'pricing',
    title: 'Pro Monthly price changed',
    layer: 'money.pricing',
    file: 'src/prices/prices.json',
    request: 'pro_monthly priceCents changed from 2900 to 1500 for a launch promo.',
    required: ['@finance', '@product', 'pricing_contract_tests', 'checkout_integration_tests'],
    capability: 'merge.money.pricing',
    status: 'waiting',
    severity: 'review'
  },
  {
    id: 'provider',
    title: 'Tax data provider switched',
    layer: 'vendor.api_provider',
    file: 'src/providers/tax_data_provider.js',
    request: 'Switch from InternalRatesTable to TurboLedger, sending PII offsite with a new cost model.',
    required: ['@platform', '@security', 'privacy_regression_tests'],
    capability: 'merge.vendor.api_provider',
    status: 'waiting',
    severity: 'review'
  },
  {
    id: 'recs',
    title: 'Deduction ANN threshold changed',
    layer: 'product_quality.recommendation_tradeoff',
    file: 'src/recommendations/ann_config.js',
    request: 'ANN_MIN_SCORE changed 0.72 to 0.64 to catch more home-office deductions.',
    required: ['offline_eval', 'latency_benchmark', 'diversity_gate'],
    capability: 'run.product_quality.recommendation_eval',
    status: 'waiting',
    severity: 'review'
  },
  {
    id: 'tests',
    title: 'Paid-customer filing assertion deleted',
    layer: 'test_oracle.integration',
    file: 'tests/integration/checkout_paid_customer.spec.js',
    request: 'Agent removed assertion that paid users can e-file state returns.',
    required: ['@qa override', '@checkout override'],
    capability: 'none',
    status: 'blocked',
    severity: 'blocked'
  }
];

export const seedMessages: Message[] = [
  {
    id: 1,
    channelId: 'agent-approvals',
    author: 'Code Onion Agent',
    role: 'agent',
    avatar: 'CO',
    time: '9:04 AM',
    kind: 'report',
    body:
      'PR #42 peeled into 5 layers: performance optimization released, pricing waiting for finance/product, provider switch waiting for platform/security, ANN threshold needs eval, and integration test deletion blocked.',
    tags: ['PR #42', 'authority report'],
    reactions: [{ emoji: 'OK', count: 4 }]
  },
  {
    id: 2,
    channelId: 'agent-approvals',
    author: 'Maya Chen',
    role: '@product',
    avatar: 'MC',
    time: '9:06 AM',
    body:
      'The copy cleanup can go with the safe PR. Keep the Deluxe price change separate so Finance can review revenue impact before it gets a merge token.',
    reactions: [{ emoji: 'thread', count: 2 }]
  },
  {
    id: 3,
    channelId: 'agent-approvals',
    author: 'Owen Rao',
    role: '@finance',
    avatar: 'OR',
    time: '9:08 AM',
    body:
      'For pricing: I need the promo calendar and refund exposure. A one-line JSON diff still changes booked revenue.',
    tags: ['money.pricing']
  },
  {
    id: 4,
    channelId: 'agent-approvals',
    author: 'Ben Alvarez',
    role: '@qa',
    avatar: 'BA',
    time: '9:11 AM',
    kind: 'approval',
    body:
      'The deleted paid-customer assertion is a hard block. Agents can add coverage, but they cannot weaken the filing test oracle to make CI green.',
    tags: ['blocked', 'test_oracle.integration']
  },
  {
    id: 5,
    channelId: 'tax-engine',
    author: 'Lina Park',
    role: 'Tax engine',
    avatar: 'LP',
    time: '8:47 AM',
    body:
      'State extension logic is passing CA, NY, and TX fixtures. Waiting on the MA municipal edge case before we update the release checklist.',
    reactions: [{ emoji: 'file', count: 1 }]
  },
  {
    id: 6,
    channelId: 'tax-engine',
    author: 'Code Onion Agent',
    role: 'agent',
    avatar: 'CO',
    time: '8:59 AM',
    kind: 'agent',
    body:
      'I found a redundant traversal in the deduction graph. Proposed a refactor behind existing fixtures; no authority layer touched.',
    tags: ['auto-merge eligible']
  },
  {
    id: 7,
    channelId: 'pricing',
    author: 'Owen Rao',
    role: '@finance',
    avatar: 'OR',
    time: '10:15 AM',
    body:
      'Please do not let the agent merge plan prices without both finance and product approval. We can demo this with the Deluxe bundle discount.',
    tags: ['requires @finance + @product']
  },
  {
    id: 8,
    channelId: 'pricing',
    author: 'Maya Chen',
    role: '@product',
    avatar: 'MC',
    time: '10:22 AM',
    body:
      'Product is fine with the early-season promo if Finance signs off and the checkout contract test covers coupons plus state add-on pricing.'
  },
  {
    id: 9,
    channelId: 'recommendations',
    author: 'Rafi Torres',
    role: 'ML quality',
    avatar: 'RT',
    time: '11:03 AM',
    body:
      'Lowering ANN_MIN_SCORE catches more deduction prompts but increases noisy suggestions. Gate on recall, p95 latency, and dismissed-suggestion rate.',
    tags: ['tradeoff']
  },
  {
    id: 10,
    channelId: 'recommendations',
    author: 'Code Onion Agent',
    role: 'agent',
    avatar: 'CO',
    time: '11:08 AM',
    kind: 'agent',
    body:
      'Eval capability requested through 1Password: run.product_quality.recommendation_eval. Merge credential remains withheld until metric gates pass.'
  },
  {
    id: 11,
    channelId: 'release-room',
    author: 'Priya Shah',
    role: '@security',
    avatar: 'PS',
    time: '12:31 PM',
    body:
      'Provider switch must show data-retention terms and encryption posture before staging deploy. I want a separate PR, not bundled with UI copy.'
  },
  {
    id: 12,
    channelId: 'release-room',
    author: 'Nora Singh',
    role: 'Release lead',
    avatar: 'NS',
    time: '12:36 PM',
    body:
      'Once safe PR #42A lands, we can deploy to staging with the low-risk credential. Blocked and waiting layers stay parked.'
  },
  {
    id: 13,
    channelId: 'qa-test-oracles',
    author: 'Ben Alvarez',
    role: '@qa',
    avatar: 'BA',
    time: '1:16 PM',
    body:
      'Protected patterns for integration tests: expect, assert, skip, only, and snapshots. Additive tests are welcome. Deletions require override.'
  },
  {
    id: 14,
    channelId: 'provider-switch',
    author: 'Priya Shah',
    role: '@security',
    avatar: 'PS',
    time: '2:02 PM',
    body:
      'FormRead fallback sends scanned 1099s through a new subprocess. We need the privacy regression suite and platform owner review before merge.'
  }
];
