
// Simple admin extension for CODFORM
export default function ActionExtension() {
  // This is a simplified version for deployment
  return {
    render(root) {
      const shop = root.shopify.shop.domain;
      const productId = root.shopify.product?.id;
      const adminAppUrl = "https://codform-flow-forms.lovable.app/dashboard";

      // Create container
      const container = document.createElement('div');
      container.style.padding = '1rem';

      // Create button
      const button = document.createElement('button');
      button.textContent = 'إعداد نموذج الدفع عند الاستلام';
      button.style.backgroundColor = '#008060';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.padding = '0.5rem 1rem';
      button.style.cursor = 'pointer';
      button.style.fontFamily = 'Arial, sans-serif';
      button.style.fontWeight = 'bold';
      button.style.display = 'flex';
      button.style.alignItems = 'center';

      // Create description
      const description = document.createElement('p');
      description.textContent = 'قم بإعداد وتخصيص نموذج الدفع عند الاستلام لهذا المنتج';
      description.style.fontSize = '0.8rem';
      description.style.marginTop = '0.5rem';
      description.style.color = '#6b7280';

      // Add event listener to button
      button.addEventListener('click', () => {
        window.open(`${adminAppUrl}?shop=${shop}&productId=${productId}`, '_blank');
      });

      // Append elements to container
      container.appendChild(button);
      container.appendChild(description);

      // Append container to root
      root.appendChild(container);
    },
  };
}
