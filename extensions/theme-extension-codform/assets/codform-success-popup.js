/* CodMagnet success popup - elegant modal in a small standalone file.
   Exposes window.CodformSuccessPopup.show(title, message, style)
   Style options: { accentColor, titleColor, messageColor, icon, autoCloseMs }
*/
(function(){
  if (window.CodformSuccessPopup) return;
  function show(title, message, style){
    try {
      var s = style || {};
      var accent = s.accentColor || '#9b87f5';
      var titleColor = s.titleColor || '#111827';
      var messageColor = s.messageColor || '#374151';
      var icon = s.icon || '✅';
      var autoCloseMs = typeof s.autoCloseMs === 'number' ? s.autoCloseMs : 2200;

      var overlay = document.createElement('div');
      overlay.className = 'codform-success-overlay';
      overlay.style.cssText = [
        'position:fixed','inset:0','background:rgba(0,0,0,0.45)','display:flex',
        'align-items:center','justify-content:center','z-index:100000','backdrop-filter:blur(2px)'
      ].join(';');

      var box = document.createElement('div');
      box.setAttribute('dir', 'ltr');
      box.style.cssText = [
        'background:#fff','border-radius:20px','max-width:420px','width:420px','height:280px',
        'padding:32px','box-shadow:0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
        'text-align:center','font-family:inherit','position:relative','overflow:hidden',
        'display:flex','flex-direction:column','justify-content:center','align-items:center',
        'backdrop-filter:blur(20px)','border:1px solid rgba(255,255,255,0.2)'
      ].join(';');

      // Success icon circle
      var iconCircle = document.createElement('div');
      iconCircle.style.cssText = [
        'width:80px','height:80px','border-radius:50%','background:linear-gradient(135deg, #10b981, #059669)',
        'display:flex','align-items:center','justify-content:center','margin:0 auto 24px',
        'box-shadow:0 8px 25px rgba(16, 185, 129, 0.3)','animation:pulse 2s infinite'
      ].join(';');
      var emoji = document.createElement('span');
      emoji.textContent = '✓';
      emoji.style.cssText = 'font-size:36px;color:white;font-weight:bold;';
      iconCircle.appendChild(emoji);

      var h = document.createElement('h3');
      h.textContent = title || 'Order Created Successfully!';
      h.style.cssText = 'margin:0 0 16px;font-size:24px;color:'+titleColor+';font-weight:600;line-height:1.3;';

      var p = document.createElement('p');
      p.textContent = message || 'Thank you for your order! We\'ll contact you soon to confirm the details. Please keep your phone nearby.';
      p.style.cssText = 'margin:0;font-size:16px;line-height:1.6;color:'+messageColor+';opacity:0.8;';

      var closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.setAttribute('aria-label','Close');
      closeBtn.style.cssText = [
        'position:absolute','top:16px','right:16px','background:rgba(0,0,0,0.1)','border:none',
        'cursor:pointer','font-size:16px','color:#6b7280','padding:8px','border-radius:50%',
        'width:32px','height:32px','display:flex','align-items:center','justify-content:center',
        'transition:all 0.2s ease'
      ].join(';');
      closeBtn.onmouseover = function(){ closeBtn.style.background = 'rgba(0,0,0,0.2)'; closeBtn.style.transform = 'scale(1.1)'; };
      closeBtn.onmouseout = function(){ closeBtn.style.background = 'rgba(0,0,0,0.1)'; closeBtn.style.transform = 'scale(1)'; };
      closeBtn.onclick = function(){ try { document.body.removeChild(overlay); } catch(_){} };

      // Add CSS animation for pulse effect
      var style = document.createElement('style');
      style.textContent = '@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }';
      document.head.appendChild(style);

      box.appendChild(iconCircle);
      box.appendChild(h);
      box.appendChild(p);
      box.appendChild(closeBtn);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      if (autoCloseMs > 0) setTimeout(function(){ try { document.body.removeChild(overlay); } catch(_){} }, autoCloseMs);
    } catch (e) {
      alert((title || 'Order Created Successfully!') + "\n" + (message || 'Thank you for your order! We\'ll contact you soon to confirm the details. Please keep your phone nearby.'));
    }
  }
  window.CodformSuccessPopup = { show: show };
  // Backward compatibility for older calls
  if (typeof window.showSuccessPopup !== 'function') {
    window.showSuccessPopup = function(title, message, style){
      try { window.CodformSuccessPopup.show(title, message, style); } catch(e) { alert((title||'Order Created Successfully!')+"\n"+(message||'Thank you for your order! We\'ll contact you soon to confirm the details. Please keep your phone nearby.')); }
    }
  }
})();

