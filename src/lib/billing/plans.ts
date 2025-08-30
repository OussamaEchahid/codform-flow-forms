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
      'Custom form design for each product',
      'Landing page builder',
      '30 Abandoned checkouts',
      'Currency Management',
      'Google Sheets',
      'Multi Social media Pixels',
      'Quantity offers + Customized design',
      'Upsell + Customized design',
      'Shipping Rates',
      '24x7 Support',
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
      'Custom form design for each product',
      'Landing page builder',
      '30 Abandoned checkouts',
      'Currency Management',
      'Google Sheets',
      'Multi Social media Pixels',
      'Quantity offers + Customized design',
      'Upsell + Customized design',
      'Shipping Rates',
      '24x7 Support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 22.85,
    priceCents: 2285,
    popular: true,
    features: [
      'Unlimited Orders/mo',
      'Custom form design for each product',
      'Landing page builder',
      'Unlimited Abandoned orders',
      'Currency Management',
      'Google Sheets',
      'Multi Social media Pixels',
      'Quantity offers + Customized design',
      'Upsell + Customized design',
      'Shipping Rates',
      '24x7 Support',
      'All new features included',
    ],
  },
];

export const getPlanById = (id: PlanId) => PLANS.find(p => p.id === id)!;

