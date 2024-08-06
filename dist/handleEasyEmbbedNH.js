(function () {
  const s = document.createElement('script');
  s.defer = true;

  const script = document.currentScript;
  let storeId = null;
  if (script?.src) {
    const url = new URL(document.currentScript.src);
    storeId = url.searchParams.get('storeId');
  }

  if (location.hostname.match("localhost")) {
    s.src = `http://localhost:5200/easyEmbbedNH.js?storeId=${storeId}`;
    return document.body.appendChild(s);
  }

  s.src = `https://cdn.jsdelivr.net/gh/nuvemhub/easyvideocommerce@2.0.2/dist/easyEmbbedNH.min.js?storeId=${storeId}`;
  document.body.appendChild(s);
})();
