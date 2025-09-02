// CM Security Embed Loader - loads protection script without inline JS in Liquid
(function(){
  try {
    var SHOP_DOMAIN = (window.Shopify && (window.Shopify.shop || window.Shopify.shop_domain)) || '';
    if (!SHOP_DOMAIN) {
      try {
        var meta = document.querySelector('meta[property="og:site_name"]');
      } catch(_) {}
    }

    var endpoint = 'https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-protection-script';

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_domain: SHOP_DOMAIN, method: 'get_script' })
    })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(new Error('HTTP '+r.status)); })
    .then(function(res){
      if (!res || !res.success || !res.script) return;
      var tmp = document.createElement('div');
      tmp.innerHTML = res.script;
      var scriptTag = tmp.querySelector('script');
      if (!scriptTag) return;
      var s = document.createElement('script');
      s.type = 'text/javascript';
      s.text = scriptTag.textContent || scriptTag.innerText || '';
      (document.head || document.documentElement).appendChild(s);
    })
    .catch(function(e){ console.warn('[CodMagnet] Failed to load protection script:', e); });
  } catch (e) {
    console.warn('[CodMagnet] Security embed error:', e);
  }
})();

