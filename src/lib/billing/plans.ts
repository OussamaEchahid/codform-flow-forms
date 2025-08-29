export type PlanId = 'free' | 'basic' | 'premium';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  monthlyPrice: number; // in USD
  priceCents: number; // for Shopify/Billing API
  popular?: boolean;
  features: string[];
}

// Source of truth for plans & pricing
export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    priceCents: 0,
    popular: false,
    features: [
      '70 Orders/mo',
      '30 Abandoned checkouts',
      'Basic widgets',
      'Email support',
      'Basic reports',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 11.85,
    priceCents: 1185,
    popular: false,
    features: [
      '1000 Orders/mo',
      'All widgets',
      'Advanced integrations',
      'Priority support',
      'Detailed reports',
      'Advanced customization',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 22.85,
    priceCents: 2285,
    popular: true,
    features: [
      'Unlimited Orders',
      'All features',
      '24/7 support',
      'Advanced analytics',
      'Full API access',
      'Full customization',
      'Backups',
    ],
  },
];

export const getPlanById = (id: PlanId) => PLANS.find(p => p.id === id)!;

