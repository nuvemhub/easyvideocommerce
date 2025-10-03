(function () {
  function injectRemoteScript() {
    fetch('http://localhost:3002/dev/playground/nuvemHubEVCEmbbed.js')
      .then(response => response.text())
      .then(js => {
        const script = document.createElement('script');
        script.textContent = js;
        document.documentElement.appendChild(script);
        script.remove();
      })
      .catch(err => {
        console.error('Erro ao buscar ou executar nuvemHubEVCEmbbed.js:', err);
      });
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === '=') {
      console.log('Injetando script de desenvolvimento...');
      injectRemoteScript();
    }
  });
})();