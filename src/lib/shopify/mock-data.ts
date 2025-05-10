
/**
 * Mock data provider for development and testing
 */
import { ShopifyProduct } from './types';

/**
 * Get mock products for development and testing
 */
export function getMockProducts(): ShopifyProduct[] {
  return [
    { 
      id: 'test-product-1', 
      title: 'Test Product 1', 
      handle: 'test-product-1', 
      images: ['https://placehold.co/600x400?text=Test+Product+1'],
      price: '19.99',
      variants: [
        { 
          id: 'variant-1-1',
          title: 'Default Variant',
          price: '19.99', 
          available: true 
        }
      ]
    },
    { 
      id: 'test-product-2', 
      title: 'Test Product 2', 
      handle: 'test-product-2', 
      images: ['https://placehold.co/600x400?text=Test+Product+2'],
      price: '29.99',
      variants: [
        { 
          id: 'variant-2-1',
          title: 'Default Variant',
          price: '29.99', 
          available: true 
        }
      ]
    },
    { 
      id: 'test-product-3', 
      title: 'Test Product 3', 
      handle: 'test-product-3', 
      images: ['https://placehold.co/600x400?text=Test+Product+3'],
      price: '39.99',
      variants: [
        { 
          id: 'variant-3-1',
          title: 'Out of Stock Variant',
          price: '39.99', 
          available: false 
        }
      ]
    }
  ];
}
