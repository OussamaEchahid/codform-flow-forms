// This is a backup of the working form code
// Keep this file for reference in case of issues

// Form fetching function
function fetchCodForm(shopDomain, productId, blockId) {
  const timestamp = Date.now();
  const apiUrl = productId 
    ? `https://mtyfuwdsshlzqwjujavp.functions.supabase.co/forms-product?shop=${shopDomain}&productId=${productId}&_t=${timestamp}`
    : `https://mtyfuwdsshlzqwjujavp.functions.supabase.co/forms-default?shop=${shopDomain}&_t=${timestamp}`;
  
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache'
    }
  };
  
  return fetch(apiUrl, fetchOptions)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data.form && !data.error) {
        return data; // For backward compatibility
      }
      return data;
    })
    .catch(error => {
      console.error('Error fetching form:', error);
      return { error: `Failed to fetch form: ${error.message}` };
    });
}

// The rest of the working code would be here
// This serves as a reference point if issues occur with new implementations
