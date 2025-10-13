(async function () {
  const script = document.currentScript;
  if (!script?.src) {
    console.error('[NuvemHub] Easy Video Commerce: script source not found.');
    return;
  }

  const url = new URL(script.src);
  const storeId = url.searchParams.get('storeId');
  if (!storeId) {
    console.error('[NuvemHub] Easy Video Commerce: storeId not found in script URL parameters.');
    return;
  }

  // Define API base
  let apiBase = 'https://easyvc.nuvemhub.com.br';
  try {
    const isLocalhost = window.location.hostname === 'localhost';
    let isDebug = false;
    try {
      isDebug = sessionStorage.getItem('nheasydebug') === 'true';
    } catch (e) { }
    if (isLocalhost || isDebug) {
      apiBase = 'http://localhost:3002';
    } else if (window.location.host === 'testing.nuvemhub.com.br') {
      apiBase = 'https://easyvc-test.nuvemhub.com.br';
    }
  } catch (e) { }

  // Busca versão na API
  let version;
  try {
    const res = await fetch(`${apiBase}/gtm/version`);
    const data = await res.json();
    version = data?.version;
  } catch (e) {
    console.error('[NuvemHub] Easy Video Commerce: error fetching version from API.', e);
    return;
  }

  if (!version) {
    console.error('[NuvemHub] Easy Video Commerce: version not found in API response.');
    return;
  }

  // Carrega o script principal
  const s = document.createElement('script');
  s.defer = true;
  s.src = `https://cdn.jsdelivr.net/gh/nuvemhub/easyvideocommerce@${version}/dist/nuvemHubEVCEmbbed.min.js?storeId=${storeId}&vapp=${version}`;
  document.body.appendChild(s);
})();