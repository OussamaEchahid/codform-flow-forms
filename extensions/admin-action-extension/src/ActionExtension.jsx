
import { reactExtension } from '@shopify/ui-extensions-react/admin';

// Admin extension for CODFORM Cash on Delivery form configuration
function ActionExtension({ shop, productId }) {
  // Configuration for the extension
  const adminAppUrl = "https://codform-flow-forms.lovable.app/dashboard";
  
  // Handle button click to configure the form for this product
  const handleButtonClick = () => {
    // Open the configuration page in a new tab
    window.open(`${adminAppUrl}?shop=${shop}&productId=${productId}`, '_blank');
  };
  
  return (
    <div style={{ padding: '1rem' }}>
      <button
        style={{
          backgroundColor: '#008060',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center'
        }}
        onClick={handleButtonClick}
      >
        إعداد نموذج الدفع عند الاستلام
      </button>
      <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#6b7280' }}>
        قم بإعداد وتخصيص نموذج الدفع عند الاستلام لهذا المنتج
      </p>
    </div>
  );
}

// Register the extension 
export default reactExtension(
  'admin.product-details.action.render',
  (root) => {
    const shop = root.shopify.shop.domain;
    const productId = root.shopify.product?.id;
    
    return <ActionExtension shop={shop} productId={productId} />;
  },
);
