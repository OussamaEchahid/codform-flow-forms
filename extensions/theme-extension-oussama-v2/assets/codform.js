document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('codform-payment-form');
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
      };
      
      // هنا يمكنك إرسال البيانات إلى الخادم الخاص بك
      console.log('Form data:', formData);
      
      // يمكنك استبدال هذا بطلب API حقيقي
      fetch('https://codform-flow-forms.lovable.app/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      .then(response => response.json())
      .then(data => {
        alert('تم إرسال الطلب بنجاح!');
        form.reset();
      })
      .catch(error => {
        console.error('Error:', error);
        alert('حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.');
      });
    });
  }
});
