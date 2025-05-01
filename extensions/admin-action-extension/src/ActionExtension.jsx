
// Simple admin extension for CODFORM
export default function ActionExtension() {
  // This is a simplified version for deployment
  return {
    render(root) {
      root.innerHTML = `
        <div style="padding: 1rem;">
          <button style="background-color: #008060; color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem; cursor: pointer;">
            إعداد نموذج الدفع عند الاستلام
          </button>
        </div>
      `;

      const button = root.querySelector('button');
      button.addEventListener('click', () => {
        alert('سيتم تفعيل هذه الميزة قريبًا');
      });
    },
  };
}
