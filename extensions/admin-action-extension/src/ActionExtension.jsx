
export default function() {
  return {
    render(root) {
      const shop = root.shopify?.shop?.domain;
      const productId = root.shopify?.product?.id;
      
      console.log('CODFORM Admin Extension loaded:', { shop, productId });
      
      // Create container div with consistent styling
      const container = document.createElement('div');
      container.style.padding = '1rem';
      container.style.fontFamily = 'Cairo, sans-serif';
      container.style.direction = 'rtl';
      container.style.textAlign = 'right';
      
      // Create button with improved styling to match app design
      const button = document.createElement('button');
      button.textContent = 'إعداد نموذج الدفع عند الاستلام';
      button.style.backgroundColor = '#9b87f5';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '8px';
      button.style.padding = '0.75rem 1.5rem';
      button.style.cursor = 'pointer';
      button.style.fontFamily = 'Cairo, sans-serif';
      button.style.fontWeight = 'bold';
      button.style.fontSize = '16px';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      button.style.transition = 'all 0.2s ease-in-out';
      
      // Add hover effect
      button.onmouseover = function() {
        button.style.backgroundColor = '#8a76e5';
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      };
      
      button.onmouseout = function() {
        button.style.backgroundColor = '#9b87f5';
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      };
      
      // Add click handler
      button.addEventListener('click', () => {
        // Handle button click to configure the form for this product
        const adminAppUrl = "https://codmagnet.com/dashboard";
        const cleanShop = shop ? encodeURIComponent(shop) : '';
        const cleanProductId = productId ? encodeURIComponent(productId) : '';
        window.open(`${adminAppUrl}?shop=${cleanShop}&productId=${cleanProductId}`, '_blank');
      });
      
      // Create description with improved styling
      const description = document.createElement('p');
      description.textContent = 'قم بإعداد وتخصيص نموذج الدفع عند الاستلام لهذا المنتج';
      description.style.fontSize = '14px';
      description.style.marginTop = '0.75rem';
      description.style.color = '#6b7280';
      description.style.fontFamily = 'Cairo, sans-serif';
      
      // Append elements
      container.appendChild(button);
      container.appendChild(description);
      
      // Render to root
      root.appendChild(container);
      
      // Return cleanup function
      return () => {
        root.removeChild(container);
      };
    }
  };
}
