/* global gtagNsGA4 */
/* global Hammer */
var easyDataLayer = {
  config: {
    // Used to fetch html and others assets
    embbedUrl: null,
    // Used to fetch data from API
    apiUrl: null,
    // Others
    lang: 'en',
  },

  store: {
    storeId: null,
    whatsapp: null,
  },

  videoData: {
    position: null,
    videoIndex: 0,
    allSources: [],

    preloadStarted: false,
    playNextFireTimeInstance: null,
    playNextFireCalls: 0,
    handlePreLoadingTimeInstance: null,
    handleEndedMediaTimeInstance: null,
    restartCurrentMediaTimeInstance: null,

    eventListenerAdded: [],
    allVideosAttachedData: [],

    muteTimeInstance: null,
  },

  uiData: {
    isMobile: window.innerWidth < 768,
    helloMessageTimeInstance: null,
    helloMessage: null,
    hasAlertMessageEventListener: false,
    alertMessageTimeInstance: null,
    modalCommentsTimeInstance: null,
    urlObserver: null,
  },

  dnd: {
    posY: 0,
    isDragging: false,
    draggingTimeInstance: null,
  },

  analytics: {
    // custom dimensions
    uuid: null,
    campaignId: null,
    testId: null,
    // local control
    viewTriggered: false,
    errorTriggered: false,
  },

  refs: {
    styleId: 'easy-video-commerce-nh-style',
    whatsappHandler: null,
  },

  setup: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const isLocalhost = window.location.hostname === 'localhost';

      if (isLocalhost || sessionStorage.getItem('nheasydebug') === 'true') {
        Object.assign(window.easyDataLayer.config, {
          embbedUrl: "http://localhost:3002/dev/playground",
          // apiUrl: "https://easyvc.nuvemhub.com.br",
          apiUrl: "http://localhost:3002",
        });
        window.easyDataLayer.store.storeId = '68f15ffabd4ba656e935811f';
        console.log('[NuvemHub] Easy Video Commerce: Partial Setup for Debug/Localhost mode.');
      }

      const script = document.currentScript;
      if (!script?.src) {
        console.error('[NuvemHub] Easy Video Commerce: Stoped on setup, script source not found.');
        return;
      }

      const url = new URL(script.src);
      const storeId = url.searchParams.get('storeid');
      const scriptVersion = url.searchParams.get('vapp');

      if (!storeId || !scriptVersion) {
        console.error('[NuvemHub] Easy Video Commerce: Stoped on setup, storeId or scriptVersion not found in script URL parameters.');
        return;
      }

      window.easyDataLayer.store.storeId = storeId;
      if (isLocalhost) return;

      window.easyDataLayer.config.embbedUrl = `https://cdn.jsdelivr.net/gh/nuvemhub/easyvideocommerce@${scriptVersion}/dist`;

      const isTesting = window.location.host === 'testing.nuvemhub.com.br';
      window.easyDataLayer.config.apiUrl = isTesting
        ? "https://easyvc-test.nuvemhub.com.br"
        : "https://easyvc.nuvemhub.com.br";
    }, 'setup');
  },

  sendAnalyticsEvent: function (eventType, data) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      if (!eventType || sessionStorage.getItem('nheasydebug') === 'true') return;

      const pushData = {
        easyvc_uuid: window.easyDataLayer.analytics.uuid,
        easyvc_type: eventType,
        ...(window.easyDataLayer.analytics.campaignId && { easyvc_campaign: window.easyDataLayer.analytics.campaignId }),
        ...(window.easyDataLayer.analytics.testId && { easyvc_test: window.easyDataLayer.analytics.testId }),
        ...(data && typeof data === 'object' ? { easyvc_data: JSON.stringify(data) } : {})
      };

      // NuvemShop Analytics 4
      if (typeof gtagNsGA4 === 'function') {
        gtagNsGA4('event', "easyvc_interaction", pushData);
        return;
      }

      // Default Analytics 4
      if (window?.gtag) {
        window.gtag('event', "easyvc_interaction", pushData);
      } else if (window?.dataLayer) {
        window.dataLayer.push({ ...pushData, event: "easyvc_interaction" });
      }
    }, 'sendAnalyticsEvent');
  },

  i18n: function (data) {
    return window.easyDataLayer.utils.executeWithLogging(() => {
      if (window.easyDataLayer.config.lang === 'pt' && data?.pt) {
        return data?.pt;
      }
      if (window.easyDataLayer.config.lang === 'es' && data?.es) {
        return data?.es;
      }
      if (data?.en) {
        return data?.en;
      }

      return "i18n text not found";
    }, 'i18n');
  },

  setStyleHelper: function (el, prop, value) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      if (el) {
        el.style.setProperty(prop, value, 'important');
      }
    }, 'setStyleHelper');
  },

  identifyWhatsappNumberOnWebsite: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const links = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="web.whatsapp.com"]'));

      // Usa Set para garantir unicidade e evitar duplicatas
      const numeros = new Set();

      links.forEach(link => {
        const href = link.href;

        // Expressão regular cobre os principais formatos de links do WhatsApp
        // Ex: https://wa.me/5511999999999, https://api.whatsapp.com/send?phone=5511999999999
        const match =
          href.match(/(?:wa\.me\/|phone=|send\?text=.*?&phone=)(\d{10,15})/i) ||
          href.match(/(?:wa\.me\/|phone=)(\d{10,15})/i);

        if (match && match[1]) {
          numeros.add(match[1]);
        }
      });

      // Pega o primeiro número único encontrado
      const [firstNumber] = numeros;

      if (firstNumber) {
        window.easyDataLayer.store.whatsapp = firstNumber;
        window.easyDataLayer.setupWppEvent();
      }
    }, 'identifyWhatsappNumberOnWebsite');
  },

  setMinimizedContainerSize: function () {
    const container = document.querySelector("#easy-video-commerce-nh-container");
    const easyNh = document.querySelector("#easy-video-commerce-nh");
    const sourceContainer = document.querySelector("#easy-video-commerce-nh .easy-source-container");

    // Dynamic sizes - @REFACTOR
    if (window.easyDataLayer.uiData.isMobile) {
      // Mobile
      window.easyDataLayer.setStyleHelper(container, 'height', "110px");
      window.easyDataLayer.setStyleHelper(container, 'width', "110px");
      window.easyDataLayer.setStyleHelper(easyNh, 'height', "100px");
      window.easyDataLayer.setStyleHelper(easyNh, 'width', "100px");
    } else {
      // Desktop
      window.easyDataLayer.setStyleHelper(container, 'height', "130px");
      window.easyDataLayer.setStyleHelper(container, 'width', "130px");
      window.easyDataLayer.setStyleHelper(easyNh, 'height', "120px");
      window.easyDataLayer.setStyleHelper(easyNh, 'width', "120px");
    }
    window.easyDataLayer.setStyleHelper(sourceContainer, 'border-radius', "100%");
  },

  handleMaximaze: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector("#easy-video-commerce-nh-container");
      if (!container) return;

      // Evita maximizar enquanto está arrastando
      if (container.classList.contains("dragging")) return;

      // Sempre desmuta ao maximizar
      window.easyDataLayer.handleControlMuteAndUnmute(false);

      // Ajusta container e conteúdo para maximizado
      window.easyDataLayer.setStyleHelper(container, 'border-width', '0');
      container.classList.toggle("maximized");
      window.easyDataLayer.setStyleHelper(container, 'z-index', '1999999999');

      const easyNh = container.querySelector("#easy-video-commerce-nh");
      if (easyNh) {
        window.easyDataLayer.setStyleHelper(easyNh, 'height', "100%");
        window.easyDataLayer.setStyleHelper(easyNh, 'width', "100%");
      }

      // Esconde mensagem de hello e mostra controles principais
      const helloMsg = container.querySelector("span.hello-message");
      if (helloMsg) window.easyDataLayer.setStyleHelper(helloMsg, 'display', "none");

      const progressContainer = container.querySelector(".progress-container");
      if (progressContainer) window.easyDataLayer.setStyleHelper(progressContainer, 'display', "flex");

      const controls = container.querySelector(".controls");
      if (controls) window.easyDataLayer.setStyleHelper(controls, 'display', "flex");

      // Esconde central icon após 1.5s
      setTimeout(() => {
        const centerIcon = container.querySelector(".controls .control-center .control-center-icon-container");
        if (centerIcon) window.easyDataLayer.setStyleHelper(centerIcon, 'display', "none");
      }, 1500);

      // Mostra botões e header
      const showSelectors = [
        ".header-title",
        ".header-controls",
        ".extra-control"
      ];
      showSelectors.forEach(sel => {
        const el = container.querySelector(sel);
        if (el) window.easyDataLayer.setStyleHelper(el, 'display', "flex");
      });

      // Mostra botão WhatsApp se existir número
      if (window.easyDataLayer.store.whatsapp) {
        const btnWpp = container.querySelector(".btn-wpp");
        if (btnWpp) window.easyDataLayer.setStyleHelper(btnWpp, 'display', "flex");
      }

      // Reinicia vídeo atual
      window.easyDataLayer.restartCurrentMedia();

      // Aplica estilos de maximizado conforme device
      const sourceContainer = container.querySelector(".easy-source-container");
      if (window.easyDataLayer.uiData.isMobile) {
        // Mobile
        window.easyDataLayer.setStyleHelper(container, 'top', "0");
        window.easyDataLayer.setStyleHelper(container, 'bottom', "0");
        window.easyDataLayer.setStyleHelper(container, 'left', "0");
        window.easyDataLayer.setStyleHelper(container, 'height', "100%");
        window.easyDataLayer.setStyleHelper(container, 'width', "100%");
        if (sourceContainer) window.easyDataLayer.setStyleHelper(sourceContainer, 'border-radius', "0");
        window.easyDataLayer.addDisableZoomPageEvent();
      } else {
        // Desktop
        window.easyDataLayer.setStyleHelper(container, 'top', '14px');
        window.easyDataLayer.setStyleHelper(container, 'bottom', '14px');
        window.easyDataLayer.setStyleHelper(container, 'left', '50%');
        window.easyDataLayer.setStyleHelper(container, 'transform', 'translateX(-50%)');
        window.easyDataLayer.setStyleHelper(container, 'height', "calc(100vh - 28px)");
        window.easyDataLayer.setStyleHelper(container, 'width', "calc((100vh - 28px) * 0.6)");
        if (sourceContainer) window.easyDataLayer.setStyleHelper(sourceContainer, 'border-radius', "8px");
        const fadeDesktop = document.querySelector("#easy-video-commerce-nh-fade-desktop");
        if (fadeDesktop && !window.easyDataLayer.uiData.isMobile) {
          window.easyDataLayer.setStyleHelper(fadeDesktop, 'display', 'flex');
          window.easyDataLayer.setStyleHelper(fadeDesktop, 'z-index', '1909999999');
        }
      }

      // Dispara evento de view apenas uma vez
      if (!window.easyDataLayer.analytics.viewTriggered) {
        window.easyDataLayer.sendAnalyticsEvent('view');
        window.easyDataLayer.analytics.viewTriggered = true;
      }
    }, 'handleMaximaze');
  },

  handleMinimize: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector("#easy-video-commerce-nh-container");
      const easyNh = document.querySelector("#easy-video-commerce-nh");
      const fadeDesktop = document.querySelector("#easy-video-commerce-nh-fade-desktop");

      // Minimiza para desktop
      const minDesktop = () => {
        window.easyDataLayer.setStyleHelper(container, 'transform', "translateX(0)");
        window.easyDataLayer.setStyleHelper(fadeDesktop, 'display', 'none');
        window.easyDataLayer.setStyleHelper(fadeDesktop, 'z-index', '15000');
      };

      // Minimiza para mobile
      const minMobile = () => {
        window.easyDataLayer.setStyleHelper(easyNh, 'left', '14px');
        window.easyDataLayer.setStyleHelper(easyNh, 'bottom', '14px');

        window.easyDataLayer.removeDisableZoomPageEvent();
      };

      window.easyDataLayer.handleControlMuteAndUnmute(true);

      window.easyDataLayer.setStyleHelper(fadeDesktop, 'display', 'none');
      window.easyDataLayer.setStyleHelper(container, 'border-width', '3px');
      container.classList.toggle("maximized");
      window.easyDataLayer.setStyleHelper(container, 'z-index', '16000');

      // Esconde elementos principais
      [
        ".header-title",
        ".progress-container",
        ".controls",
        ".header-controls",
        ".extra-control"
      ].forEach(sel => {
        const el = document.querySelector(`#easy-video-commerce-nh ${sel}`);
        window.easyDataLayer.setStyleHelper(el, 'display', 'none');
      });

      // Set minimized size
      window.easyDataLayer.setMinimizedContainerSize();

      // Aplica estilos de minimizado conforme device
      if (window.easyDataLayer.uiData.isMobile) {
        minMobile();
      } else {
        minDesktop();
      }

      window.easyDataLayer.setVideoSide();
    }, 'handleMinimize');
  },

  setHTML: function () {
    const handleControlLeft = () => window.easyDataLayer.checkCurrentMediaAndPlayNext(false);
    const handleControlRight = () => window.easyDataLayer.checkCurrentMediaAndPlayNext(true);

    // Garante que uma instância antiga não permaneça montada antes de injetar o HTML
    window.easyDataLayer.destroyDomElements();

    if (!window?.easyDataLayer?.config?.embbedUrl) {
      console.error('[NuvemHub] Easy Video Commerce: embbedUrl not configured.');
      return;
    }

    fetch(`${window.easyDataLayer.config.embbedUrl}/nuvemHubEVCScope.html`)
      .then(response => response.text())
      .then(data => {
        // Fade overlay
        const fadeDesktop = document.createElement('div');
        fadeDesktop.id = 'easy-video-commerce-nh-fade-desktop';
        fadeDesktop.className = 'easy-video-commerce-nh-fade-desktop';
        window.easyDataLayer.setStyleHelper(fadeDesktop, 'display', 'none');
        window.easyDataLayer.setStyleHelper(fadeDesktop, 'position', 'fixed');
        window.easyDataLayer.setStyleHelper(fadeDesktop, 'top', '0');
        window.easyDataLayer.setStyleHelper(fadeDesktop, 'left', '0');
        window.easyDataLayer.setStyleHelper(fadeDesktop, 'width', '100%');
        window.easyDataLayer.setStyleHelper(fadeDesktop, 'height', '100%');
        window.easyDataLayer.setStyleHelper(fadeDesktop, 'background-color', 'rgba(0, 0, 0, 0.8)');
        window.easyDataLayer.setStyleHelper(fadeDesktop, 'z-index', '15000');
        document.body.appendChild(fadeDesktop);

        // Main container
        const container = document.createElement('div');
        container.id = 'easy-video-commerce-nh-container';
        container.className = 'easy-video-commerce-nh-container';
        window.easyDataLayer.setStyleHelper(container, 'display', 'none');
        window.easyDataLayer.setStyleHelper(container, 'align-items', 'center');
        window.easyDataLayer.setStyleHelper(container, 'justify-content', 'center');
        window.easyDataLayer.setStyleHelper(container, 'position', 'fixed');
        window.easyDataLayer.setStyleHelper(container, 'cursor', 'pointer');
        window.easyDataLayer.setStyleHelper(container, 'z-index', '16000');
        window.easyDataLayer.setStyleHelper(container, 'border', '3px solid #000');
        window.easyDataLayer.setStyleHelper(container, 'border-radius', '100%');
        window.easyDataLayer.setStyleHelper(container, 'box-sizing', 'border-box');
        window.easyDataLayer.setStyleHelper(container, 'transition', 'top 0.1s');

        // Easy Container
        const div = document.createElement('div');
        div.id = 'easy-video-commerce-nh';
        div.className = 'easy-video-commerce-nh';
        window.easyDataLayer.setStyleHelper(div, 'display', 'flex');
        div.innerHTML = data;
        container.appendChild(div);

        document.body.appendChild(container);

        // CSS global para o widget
        let style = document.getElementById(window.easyDataLayer.refs.styleId);
        if (!style) {
          style = document.createElement('style');
          style.id = window.easyDataLayer.refs.styleId;
        }
        style.setAttribute('data-easyvc-style', 'true');
        style.innerHTML = `
        #easy-video-commerce-nh button,
        #easy-video-commerce-nh button:focus,
        #easy-video-commerce-nh button:hover,
        #easy-video-commerce-nh a,
        #easy-video-commerce-nh a:focus,
        #easy-video-commerce-nh a:hover,
        #easy-video-commerce-nh div,
        #easy-video-commerce-nh span,
        #easy-video-commerce-nh input,
        #easy-video-commerce-nh textarea,
        #easy-video-commerce-nh select,
        #easy-video-commerce-nh option,
        #easy-video-commerce-nh label,
        #easy-video-commerce-nh p,
        #easy-video-commerce-nh h1,
        #easy-video-commerce-nh h2,
        #easy-video-commerce-nh h3,
        #easy-video-commerce-nh h4,
        #easy-video-commerce-nh h5,
        #easy-video-commerce-nh h6 {
          font-family: sans-serif !important;
          margin: 0 !important;
          outline: none !important;
          border: 0 !important;
          padding: 0 !important;
        }
        #easy-video-commerce-nh button,
        #easy-video-commerce-nh a {
          cursor: pointer !important;
          background: transparent !important;
        }
        #easy-video-commerce-nh,
        #easy-video-commerce-nh button,
        #easy-video-commerce-nh div,
        #easy-video-commerce-nh a {
          -webkit-tap-highlight-color: transparent !important;
        }
      `;
        if (!style?.parentElement) {
          document.head.appendChild(style);
        }

        // Adiciona listeners de controles
        const qs = (sel) => document.querySelector(sel);
        qs("#easy-video-commerce-nh .easy-source-container")?.addEventListener("click", window.easyDataLayer.handleMaximaze);
        qs("#easy-video-commerce-nh .header-controls .btn-restart")?.addEventListener("click", window.easyDataLayer.restartCurrentMedia);
        qs("#easy-video-commerce-nh .header-controls .btn-pause")?.addEventListener("click", window.easyDataLayer.handlePlayPauseMedia);
        qs("#easy-video-commerce-nh .header-controls .btn-play")?.addEventListener("click", window.easyDataLayer.handlePlayPauseMedia);
        qs("#easy-video-commerce-nh .header-controls .btn-close")?.addEventListener("click", window.easyDataLayer.handleMinimize);
        qs("#easy-video-commerce-nh-fade-desktop")?.addEventListener("click", () => window.easyDataLayer.handleMinimize(false));
        qs("#easy-video-commerce-nh .controls .control-left")?.addEventListener("click", handleControlLeft);
        qs("#easy-video-commerce-nh .controls .control-right")?.addEventListener("click", handleControlRight);
        qs("#easy-video-commerce-nh .controls .control-center")?.addEventListener("click", window.easyDataLayer.handleControlMuteAndUnmute);

        qs("#easy-video-commerce-nh .extra-control .btn-like")?.addEventListener("click", window.easyDataLayer.handleLike);
        qs("#easy-video-commerce-nh .extra-control .btn-comments")?.addEventListener("click", window.easyDataLayer.handleModalComments);
        qs("#easy-video-commerce-nh #comments-container .overlay")?.addEventListener("click", window.easyDataLayer.handleModalComments);
        qs("#easy-video-commerce-nh #comments-container .comments-btn-close")?.addEventListener("click", window.easyDataLayer.handleModalComments);
        qs("#easy-video-commerce-nh #comments-container .submit-comment")?.addEventListener("click", window.easyDataLayer.handleComment);
        qs("#easy-video-commerce-nh .extra-control .btn-share")?.addEventListener("click", window.easyDataLayer.handleShare);

        qs("#easy-video-commerce-nh-container")?.addEventListener('mouseenter', () => {
          const maximized = container.classList.contains("maximized");
          if (!maximized) {
            window.easyDataLayer.setHelloMessage(null);
          }
        });

        // Set initial size of minimized container
        window.easyDataLayer.setMinimizedContainerSize();

        // Tradução dinâmica dos comentários
        const modalCommentsTitle = qs('#easy-video-commerce-nh #comments-container h2');
        const modalCommentsInput = qs('#easy-video-commerce-nh #comments-container input');
        const modalCommentsSubmit = qs('#easy-video-commerce-nh #comments-container .submit-comment');
        if (modalCommentsTitle && modalCommentsInput && modalCommentsSubmit) {
          modalCommentsTitle.textContent = window.easyDataLayer.i18n({ pt: 'Comentários', es: 'Comentarios', en: 'Comments' });
          modalCommentsInput.placeholder = window.easyDataLayer.i18n({
            pt: 'Deixe sua opinião ou dúvida! Seu feedback nos ajuda a melhorar cada vez mais.',
            es: '¡Deja tu opinión o duda! Tu feedback nos ayuda a mejorar cada vez más.',
            en: 'Leave your opinion or question! Your feedback helps us improve more and more.'
          });
          modalCommentsSubmit.textContent = window.easyDataLayer.i18n({ pt: 'Enviar', es: 'Enviar', en: 'Send' });
        }

        window.easyDataLayer.sendAnalyticsEvent('loaded');
      })
      .catch((error) => {
        console.error("[NuvemHub] Easy Video Commerce: setHTML", error);
      });
  },

  handleLike: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const likeBtn = document.querySelector("#easy-video-commerce-nh .extra-control .btn-like");
      const likeSvgD = likeBtn?.querySelector(".like-icon-disabled");
      const likeSvgE = likeBtn?.querySelector(".like-icon-enabled");

      if (!likeBtn || !likeSvgD || !likeSvgE) return;
      if (likeSvgD.style.display === "none") return;
      window.easyDataLayer.sendAnalyticsEvent('like');

      // Animação de feedback visual usando setStyleHelper
      window.easyDataLayer.setStyleHelper(likeSvgD, 'display', 'none');
      window.easyDataLayer.setStyleHelper(likeSvgE, 'display', 'flex');
      window.easyDataLayer.setStyleHelper(likeBtn, 'pointer-events', 'none');
      window.easyDataLayer.setStyleHelper(likeBtn, 'transition', 'transform 0.3s');
      window.easyDataLayer.setStyleHelper(likeBtn, 'transform', 'scale(1.4)');

      setTimeout(() => {
        window.easyDataLayer.setStyleHelper(likeBtn, 'transform', 'scale(1)');
        window.easyDataLayer.setStyleHelper(likeBtn, 'pointer-events', 'all');
      }, 350);

      if (sessionStorage.getItem('nheasydebug') === 'true' && window.location.hostname.includes("nuvemhub.com.br")) {
        window.easyDataLayer.sendAnalyticsEvent('purchase', { value: 99.9, currency: 'BRL' });
      }
    }, 'handleLike');
  },

  handleComment: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const comment = document.querySelector("#easy-video-commerce-nh #comments-container input");
      const btnCommentSubmit = document.querySelector("#easy-video-commerce-nh #comments-container .submit-comment");
      const btnCommentClose = document.querySelector("#easy-video-commerce-nh #comments-container .comments-btn-close");

      if (!comment || !btnCommentSubmit || !btnCommentClose || !comment?.value) return;

      if (comment?.value) {
        window.easyDataLayer.sendAnalyticsEvent('comment', {
          comment: comment.value
        });
      }

      if (comment && btnCommentSubmit) {
        comment.disabled = true;

        // Success message + animação simples usando setStyleHelper
        window.easyDataLayer.setStyleHelper(btnCommentSubmit, 'pointer-events', 'none');
        window.easyDataLayer.setStyleHelper(btnCommentClose, 'pointer-events', 'none');
        btnCommentSubmit.textContent = window.easyDataLayer.i18n({ pt: 'Enviado!', es: '¡Enviado!', en: 'Sent!' });
        window.easyDataLayer.setStyleHelper(btnCommentSubmit, 'color', '#2dc653');
        window.easyDataLayer.setStyleHelper(btnCommentSubmit, 'transition', 'all 0.4s');
        window.easyDataLayer.setStyleHelper(btnCommentSubmit, 'transform', 'scale(1.12)');

        // Remove animação após um tempo
        setTimeout(() => {
          window.easyDataLayer.setStyleHelper(btnCommentSubmit, 'transform', 'scale(1)');
        }, 400);
      }

      setTimeout(() => {
        window.easyDataLayer.handleModalComments();

        if (comment && btnCommentSubmit) {
          comment.disabled = false;
          comment.value = '';

          window.easyDataLayer.setStyleHelper(btnCommentSubmit, 'pointer-events', 'all');
          window.easyDataLayer.setStyleHelper(btnCommentClose, 'pointer-events', 'all');
          btnCommentSubmit.textContent = window.easyDataLayer.i18n({ pt: 'Enviar', es: 'Enviar', en: 'Send' });
          window.easyDataLayer.setStyleHelper(btnCommentSubmit, 'color', '#303030');
          window.easyDataLayer.setStyleHelper(btnCommentSubmit, 'transform', 'scale(1)');
        }
      }, 1250);
    }, 'handleComment');
  },

  setupWppEvent: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const btnWpp = document.querySelector("#easy-video-commerce-nh .extra-control .btn-wpp");
      if (!btnWpp) return;

      if (window?.easyDataLayer?.refs?.whatsappHandler) {
        btnWpp.removeEventListener('click', window.easyDataLayer.refs.whatsappHandler);
        window.easyDataLayer.refs.whatsappHandler = null;
      }

      if (window?.easyDataLayer?.store?.whatsapp) {
        window.easyDataLayer.setStyleHelper(btnWpp, 'display', 'flex');
        const handler = function () {
          window.easyDataLayer.utils.executeWithLogging(() => {
            window.easyDataLayer.sendAnalyticsEvent('wpp');
            const helloWppText = window.easyDataLayer.i18n({
              pt: `Olá! Vi um vídeo na loja e quero saber mais.\n\n${window.location.href}`,
              es: `¡Hola! Vi un video en la tienda y quiero saber más.\n\n${window.location.href}`,
              en: `Hi! I saw a video in the store and want to know more.\n\n${window.location.href}`
            });
            window.open(
              `https://wa.me/${window.easyDataLayer.store.whatsapp}?text=${encodeURIComponent(helloWppText)}`,
              '_blank'
            );
          }, 'handleWppContact');
        };
        btnWpp.addEventListener('click', handler);
        window.easyDataLayer.refs.whatsappHandler = handler;
      } else {
        window.easyDataLayer.setStyleHelper(btnWpp, 'display', 'none');
      }
    }, 'setupWppEvent');
  },

  handleShare: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      // Web Share API
      if (navigator?.share) {
        navigator.share({
          title: document.title,
          text: window.easyDataLayer.i18n({
            pt: 'Olha esse vídeo interessante que encontrei!',
            es: '¡Mira este video interesante que encontré!',
            en: 'Check out this interesting video I found!'
          }),
          url: window.location.href
        }).then(() => {
          window.easyDataLayer.sendAnalyticsEvent('share');
        }).catch((error) => {
          console.error('[NuvemHub] Easy Video Commerce: handleShare Web Share API Error:', error);
        });
      } else if (navigator?.clipboard && window?.isSecureContext) {
        // Modern clipboard API
        navigator.clipboard.writeText(window.location.href)
          .then(() => {
            window.easyDataLayer.setAlertShow(true, window.easyDataLayer.i18n({
              pt: 'Link copiado!',
              es: '¡Enlace copiado!',
              en: 'Link copied!'
            }), true, 1200);

            window.easyDataLayer.sendAnalyticsEvent('share');
          })
          .catch((err) => {
            console.error('[NuvemHub] Easy Video Commerce: handleShare Error:', err);
          });
      } else {
        // Fallback for older browsers (deprecated, but as last resort)
        const dummy = document.createElement('textarea');
        dummy.value = window.location.href;
        document.body.appendChild(dummy);
        dummy.select();
        try {
          document.execCommand('copy');
          window.easyDataLayer.setAlertShow(true, window.easyDataLayer.i18n({
            pt: 'Link copiado!',
            es: '¡Enlace copiado!',
            en: 'Link copied!'
          }), true, 1200);
          window.easyDataLayer.sendAnalyticsEvent('share');
        } catch (err) {
          console.error('[NuvemHub] Easy Video Commerce: handleShare Fallback Error:', err);
        }
        document.body.removeChild(dummy);
      }
    }, 'handleShare');
  },

  checkCurrentVideoMuted: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[window.easyDataLayer.videoData.videoIndex];
      return video.muted;
    }, 'checkCurrentVideoMuted');
  },

  handleControlMuteAndUnmute: function (forceMute = null) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[window.easyDataLayer.videoData.videoIndex];

      if (!video) return;

      // Alterna ou força mute
      if (forceMute !== null && (forceMute === true || forceMute === false)) {
        video.muted = forceMute;
      } else {
        video.muted = !video.muted;
      }

      const unmuteIcon = document.querySelector("#easy-video-commerce-nh .controls .control-center .unmute-icon");
      const muteIcon = document.querySelector("#easy-video-commerce-nh .controls .control-center .mute-icon");
      const iconContainer = document.querySelector("#easy-video-commerce-nh .controls .control-center .control-center-icon-container");

      // Usa setStyleHelper para consistência
      window.easyDataLayer.setStyleHelper(unmuteIcon, 'display', video.muted ? 'none' : 'flex');
      window.easyDataLayer.setStyleHelper(muteIcon, 'display', video.muted ? 'flex' : 'none');
      window.easyDataLayer.setStyleHelper(iconContainer, 'display', 'flex');

      if (window.easyDataLayer.videoData.muteTimeInstance) clearTimeout(window.easyDataLayer.videoData.muteTimeInstance);
      window.easyDataLayer.videoData.muteTimeInstance = setTimeout(() => {
        window.easyDataLayer.setStyleHelper(iconContainer, 'display', 'none');
      }, 1500);
    }, 'handleControlMuteAndUnmute');
  },

  handleModalComments: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector('#easy-video-commerce-nh #comments-container');
      const wrapper = document.querySelector('#easy-video-commerce-nh #comments-container .wrapper');

      if (!container || !wrapper) return;

      if (window.easyDataLayer.uiData.modalCommentsTimeInstance) {
        clearTimeout(window.easyDataLayer.uiData.modalCommentsTimeInstance);
      }

      const isOpen =
        wrapper.style.bottom === '0px' ||
        wrapper.style.bottom === '0%' ||
        wrapper.style.bottom === '0';

      if (isOpen) {
        window.easyDataLayer.setStyleHelper(wrapper, 'bottom', '-100%');
        window.easyDataLayer.setStyleHelper(container, 'transition', 'opacity 0.25s');
        window.easyDataLayer.setStyleHelper(container, 'opacity', '0');
        window.easyDataLayer.uiData.modalCommentsTimeInstance = setTimeout(() => {
          window.easyDataLayer.setStyleHelper(container, 'display', 'none');
          window.easyDataLayer.setStyleHelper(container, 'opacity', '1');
        }, 250);
      } else {
        window.easyDataLayer.setStyleHelper(container, 'display', 'flex');
        window.easyDataLayer.setStyleHelper(container, 'opacity', '0');
        window.easyDataLayer.uiData.modalCommentsTimeInstance = setTimeout(() => {
          window.easyDataLayer.setStyleHelper(wrapper, 'bottom', '0');
          window.easyDataLayer.setStyleHelper(container, 'transition', 'opacity 0.25s');
          window.easyDataLayer.setStyleHelper(container, 'opacity', '1');
        }, 10);
      }
    }, 'handleModalComments');
  },

  checkCurrentMediaAndPlayNext: function (forward) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const DELAY_BEFORE_PLAY = 150;
      const DELAY_DEBOUNCE = 300;

      window.easyDataLayer.videoData.playNextFireCalls += (forward ? 1 : -1);

      if (window.easyDataLayer.videoData.playNextFireTimeInstance) {
        clearTimeout(window.easyDataLayer.videoData.playNextFireTimeInstance);
      }

      window.easyDataLayer.videoData.playNextFireTimeInstance = setTimeout(() => {
        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const { videoIndex, playNextFireCalls, allSources } = window.easyDataLayer.videoData;
        const lastIndex = allSources.length - 1;

        // Utilitário para calcular o próximo índice válido
        const getNextIndex = (current, calls, max) => {
          const idx = current + calls;
          if (idx >= max) return max - 1;
          if (idx < 0) return 0;
          return idx;
        };

        const nextIndex = getNextIndex(videoIndex, window.easyDataLayer.videoData.playNextFireCalls, allSources.length);

        window.easyDataLayer.videoData.playNextFireCalls = 0;

        if (videoIndex === nextIndex || nextIndex < 0 || nextIndex >= allSources.length) {
          window.easyDataLayer.restartCurrentMedia();
          return;
        }

        const nextVid = videos?.[nextIndex];
        const oldVideo = videos?.[videoIndex];
        if (oldVideo) oldVideo.pause();
        const currentVideoMuted = window.easyDataLayer.checkCurrentVideoMuted();

        // check if video not exists, then preload
        if (!nextVid) {
          window.easyDataLayer.handlePreLoadingPlaybackMedia(nextIndex);
          window.easyDataLayer.handleEndedMedia(nextIndex);
          return;
        }

        // update index
        window.easyDataLayer.videoData.videoIndex = nextIndex;

        let mustSetProgressBarAction = true;
        // check if already load
        if (nextVid.readyState < 4) {
          if (nextVid.src !== window.easyDataLayer.videoData.allSources[nextIndex]) {
            nextVid.src = window.easyDataLayer.videoData.allSources[nextIndex];
            nextVid.load();
            window.easyDataLayer.setVideoEventListeners();
            mustSetProgressBarAction = false;
          } else {
            nextVid.src = window.easyDataLayer.videoData.allSources[nextIndex];
            nextVid.load();
          }
        }

        // show and play
        window.easyDataLayer.setStyleHelper(nextVid, 'display', 'flex');
        if (oldVideo) window.easyDataLayer.resetVideo(oldVideo);

        if (mustSetProgressBarAction) window.easyDataLayer.setProgressBarAction(forward);

        setTimeout(() => {
          window.easyDataLayer.setAlertShow(false);
          nextVid.play();
          if (!currentVideoMuted) window.easyDataLayer.handleControlMuteAndUnmute(false);
        }, DELAY_BEFORE_PLAY);
      }, DELAY_DEBOUNCE);
    }, 'checkCurrentMediaAndPlayNext');
  },

  resetVideo: function (video) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      if (!video) return;

      video.style.display = 'none';
      video.currentTime = 0;
      video.pause();
      video.muted = true;
    }, 'resetVideo');
  },

  observeUrlChange: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      if (window.easyDataLayer?.uiData?.urlObserver) return;

      let oldHref = document.location.pathname;
      const body = document.body;


      const observer = new MutationObserver(() => {
        if (oldHref !== document.location.pathname) {
          oldHref = document.location.pathname;
          window.easyDataLayer.destroy('url-change');
          window.easyDataLayer.main();
        }
      });

      window.easyDataLayer.uiData.urlObserver = observer;
      if (body) {
        observer.observe(body, { childList: true, subtree: true });
      }
    }, 'observeUrlChange');
  },

  disableZoomPage: function (event) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      if (event.scale !== 1) {
        event.preventDefault();
      }
    }, 'disableZoomPage');
  },

  disableDoubleTapZoom: function (event) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      event.preventDefault();
    }, 'disableDoubleTapZoom');
  },

  addDisableZoomPageEvent: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      document.addEventListener('touchmove', window.easyDataLayer.disableZoomPage, { passive: false });
      document.addEventListener('dblclick', window.easyDataLayer.disableDoubleTapZoom, { passive: false });
    }, 'addDisableZoomPageEvent');
  },

  removeDisableZoomPageEvent: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      document.removeEventListener('touchmove', window.easyDataLayer.disableZoomPage);
      document.removeEventListener('dblclick', window.easyDataLayer.disableDoubleTapZoom);
    }, 'removeDisableZoomPageEvent');
  },

  destroyDomElements: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const container = document.getElementById('easy-video-commerce-nh-container');
      if (container?._easyvcHammerInstance && typeof container._easyvcHammerInstance.destroy === 'function') {
        try {
          container._easyvcHammerInstance.destroy();
        } catch (error) {
          console.error('[NuvemHub] Easy Video Commerce: destroyDomElements - hammer destroy failed', error);
        }
      }

      if (container) {
        if (window.easyDataLayer.refs.whatsappHandler) {
          const btnWpp = container.querySelector('.extra-control .btn-wpp');
          if (btnWpp) {
            btnWpp.removeEventListener('click', window.easyDataLayer.refs.whatsappHandler);
          }
        }
        container.remove();
      }

      const fadeDesktop = document.getElementById('easy-video-commerce-nh-fade-desktop');
      if (fadeDesktop) {
        fadeDesktop.remove();
      }

      const style = document.getElementById(window.easyDataLayer.refs.styleId);
      if (style) {
        style.remove();
      }

      window.easyDataLayer.refs.whatsappHandler = null;
    }, 'destroyDomElements');
  },

  destroy: function (reason = 'manual') {
    window.easyDataLayer.utils.executeWithLogging(() => {
      clearEasyVCTimeouts();
      window.easyDataLayer.removeDisableZoomPageEvent();
      window.easyDataLayer.destroyDomElements();

      if (window.easyDataLayer.refs.whatsappHandler) {
        window.easyDataLayer.refs.whatsappHandler = null;
      }

      window.easyDataLayer.videoData.playNextFireCalls = 0;
      window.easyDataLayer.videoData.preloadStarted = false;
      window.easyDataLayer.videoData.videoIndex = 0;
      window.easyDataLayer.videoData.allSources = [];
      window.easyDataLayer.videoData.eventListenerAdded = [];
      window.easyDataLayer.videoData.allVideosAttachedData = [];

      window.easyDataLayer.analytics.viewTriggered = false;
      window.easyDataLayer.analytics.errorTriggered = false;

      window.easyDataLayer.uiData.helloMessage = null;
      window.easyDataLayer.uiData.hasAlertMessageEventListener = false;

      window._easyvcInitLoaded = false;

      console.log(`[NuvemHub] Easy Video Commerce: destroyed (${reason})`);
    }, 'destroy');
  },

  getEasyCampaigns: function () {
    return new Promise((resolve) => {
      const lowercasePath = window.location.pathname.toLowerCase();
      const query = `filter=${encodeURIComponent(lowercasePath)}`;

      fetch(`${window.easyDataLayer.config.apiUrl}/campaign/list/display/${window.easyDataLayer.store.storeId}?${query}`)
        .then(function (result) {
          if (!result.ok) {
            // 404, 500, etc
            resolve(null);
            return;
          }
          return result.json();
        })
        .then(function (data) { resolve(data) })
        .catch(function (error) {
          console.error("[NuvemHub] Easy Video Commerce: getEasyCampaigns", error);
          resolve(null);
        })
    })
  },

  setSource: function (videos) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      window.easyDataLayer.videoData.allSources = videos.map(video => video.sourceUrl);
      window.easyDataLayer.videoData.eventListenerAdded = videos.map(() => false);
      window.easyDataLayer.videoData.allVideosAttachedData = videos;
      document.querySelector("#easy-video-commerce-nh video").src = videos[0].sourceUrl;

      window.easyDataLayer.setVideoEventListeners();
    }, 'setSource');
  },

  setVideoEventListeners: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const enableEasyContainer = (value) => {
        const container = document.querySelector("#easy-video-commerce-nh-container");
        const fade = document.querySelector("#easy-video-commerce-nh-fade-desktop");
        window.easyDataLayer.setStyleHelper(container, 'display', value);

        const isMaximized = container.classList.contains("maximized");
        if (fade && isMaximized && !window.easyDataLayer.uiData.isMobile) {
          window.easyDataLayer.setStyleHelper(fade, 'display', value);
        }
      };

      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[window.easyDataLayer.videoData.videoIndex];
      if (!video) return;

      // Remove listeners antigos se já adicionados
      if (video._easyvcListeners) {
        video.removeEventListener('loadeddata', video._easyvcListeners.loadeddata);
        video.removeEventListener('error', video._easyvcListeners.error);
        video.removeEventListener('ended', video._easyvcListeners.ended);
      }

      window.easyDataLayer.videoData.eventListenerAdded[window.easyDataLayer.videoData.videoIndex] = true;
      window.easyDataLayer.setAlertShow(true);
      video.muted = true;

      // Handlers nomeados para fácil remoção
      const onLoadedData = () => {
        console.log("[NuvemHub] Easy Video Commerce: video loaded");
        window.easyDataLayer.setAlertShow(false);
        enableEasyContainer('flex');
        window.easyDataLayer.setHTMLProgressBars();
        window.easyDataLayer.setProgressBarAction(true);
        window.easyDataLayer.setResponsiveStyle();
        video.play();
      };

      const onError = () => {
        console.log("[NuvemHub] Easy Video Commerce: video error, trying again...");
        if (!window.easyDataLayer.analytics.errorTriggered) {
          window.easyDataLayer.sendAnalyticsEvent('loaderror');
          window.easyDataLayer.analytics.errorTriggered = true;
          enableEasyContainer('none');

          video.src = '';
          setTimeout(() => {
            video.src = window.easyDataLayer.videoData.allSources[window.easyDataLayer.videoData.videoIndex];
            video.load();
          }, 50);
        }
      };

      const onEnded = () => {
        console.log("[NuvemHub] Easy Video Commerce: video ended");
        const maximized = document.querySelector("#easy-video-commerce-nh-container").classList.contains("maximized");
        if (maximized) {
          window.easyDataLayer.handleEndedMedia();
        } else {
          window.easyDataLayer.setAlertShow(false);
          video.currentTime = 0;
          video.muted = true;
          video.play();
        }
      };

      // Salva referência para remoção futura
      video._easyvcListeners = {
        loadeddata: onLoadedData,
        error: onError,
        ended: onEnded
      };

      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('error', onError);
      video.addEventListener('ended', onEnded);

      video.load();
    }, 'setVideoEventListeners');
  },

  setAlertShow: function (show, message, autoClose = false, timeout = 1500) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const alert = document.querySelector('#easy-video-commerce-nh #alert-message');
      const alertText = document.querySelector('#easy-video-commerce-nh #alert-message span');

      if (!alert || !alertText) return;

      // Helper para limpar e resetar o timeout
      const clearAlertTimeout = () => {
        if (window.easyDataLayer.uiData.alertMessageTimeInstance) {
          clearTimeout(window.easyDataLayer.uiData.alertMessageTimeInstance);
          window.easyDataLayer.uiData.alertMessageTimeInstance = null;
        }
      };

      clearAlertTimeout();

      // Adiciona listener de click apenas uma vez
      if (!window.easyDataLayer.uiData.hasAlertMessageEventListener) {
        alert.addEventListener('click', () => {
          window.easyDataLayer.setStyleHelper(alert, 'display', 'none');
          alertText.textContent = 'Loading...';
          clearAlertTimeout();
        });
        window.easyDataLayer.uiData.hasAlertMessageEventListener = true;
      }

      if (show) {
        window.easyDataLayer.setStyleHelper(alert, 'display', 'flex');
        alertText.textContent = message || 'Loading...';
      } else {
        window.easyDataLayer.setStyleHelper(alert, 'display', 'none');
        alertText.textContent = 'Loading...';
      }

      if (autoClose && show) {
        window.easyDataLayer.uiData.alertMessageTimeInstance = setTimeout(() => {
          window.easyDataLayer.setAlertShow(false);
        }, timeout);
      }
    }, 'setAlertShow');
  },

  setHTMLProgressBars: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const progressContainer = document.querySelector('#easy-video-commerce-nh .progress-container');
      if (!progressContainer) return;

      // Limpa barras antigas antes de criar novas (evita duplicidade)
      progressContainer.innerHTML = '';

      window.easyDataLayer.videoData.allSources.forEach((_, index) => {
        const progressBar = document.createElement('div');
        progressBar.classList.add('progress-bar-item');
        progressBar.id = `progress-bar-${index + 1}`;

        window.easyDataLayer.setStyleHelper(progressBar, 'height', '4px');
        window.easyDataLayer.setStyleHelper(progressBar, 'width', '100%');
        window.easyDataLayer.setStyleHelper(progressBar, 'background-color', 'rgba(255, 255, 255, .35)');
        window.easyDataLayer.setStyleHelper(progressBar, 'border-radius', '6px');

        const progress = document.createElement('div');
        window.easyDataLayer.setStyleHelper(progress, 'height', '100%');
        window.easyDataLayer.setStyleHelper(progress, 'background-color', 'rgb(255, 255, 255)');
        window.easyDataLayer.setStyleHelper(progress, 'transition', 'width 0.35s ease');
        window.easyDataLayer.setStyleHelper(progress, 'width', '0%');
        window.easyDataLayer.setStyleHelper(progress, 'border-radius', '6px');

        progressBar.appendChild(progress);
        progressContainer.appendChild(progressBar);
      });
    }, 'setHTMLProgressBars');
  },

  setProgressBarAction: function (forward) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const addVideoEventListener = (video, event, handler) => {
        video.addEventListener(event, handler);
        return function removeEventListener() {
          video.removeEventListener(event, handler);
        };
      };

      const allBars = document.querySelectorAll('#easy-video-commerce-nh .progress-bar-item > div');
      const { videoIndex, allSources } = window.easyDataLayer.videoData;

      // Atualiza barras anteriores e posteriores
      for (let i = 0; i < videoIndex; i++) {
        window.easyDataLayer.setStyleHelper(allBars[i], 'width', '100%');
      }
      for (let i = videoIndex + 1; i < allSources.length; i++) {
        window.easyDataLayer.setStyleHelper(allBars[i], 'width', '0%');
      }

      // Barra do vídeo atual
      const bar = document.querySelector(`#progress-bar-${videoIndex + 1} > div`);
      window.easyDataLayer.setStyleHelper(bar, 'display', 'flex');

      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[videoIndex];
      const nextVideo = videos?.[videoIndex + (forward ? 1 : -1)];

      // Remove listener anterior, se houver
      if (window.easyDataLayer.videoData.removeEventListenerProgressBarAction) {
        window.easyDataLayer.videoData.removeEventListenerProgressBarAction();
      }

      window.easyDataLayer.videoData.preloadStarted = false;
      window.easyDataLayer.videoData.removeEventListenerProgressBarAction = addVideoEventListener(video, 'timeupdate', () => {
        const percent = (video.currentTime / video.duration) * 100;
        window.easyDataLayer.setStyleHelper(bar, 'width', `${percent}%`);

        // Preload do próximo vídeo se passou de 60%
        if (video.currentTime / video.duration > 0.60 && !window.easyDataLayer.videoData.preloadStarted) {
          if (!nextVideo) window.easyDataLayer.handlePreLoadingPlaybackMedia();
          window.easyDataLayer.videoData.preloadStarted = true;
        }
      });
    }, 'setProgressBarAction');
  },

  setResponsiveStyle: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const shortHeight = window.innerHeight < 700;
      const isMobile = window.easyDataLayer.uiData.isMobile;

      const centerControl = document.querySelector('#easy-video-commerce-nh .controls .control-center .control-center-icon-container');
      const extraControlsDiv = document.querySelector('#easy-video-commerce-nh .extra-control');
      const leftArrow = document.querySelector('#easy-video-commerce-nh .controls .control-left svg');
      const rightArrow = document.querySelector('#easy-video-commerce-nh .controls .control-right svg');

      if (!centerControl || !extraControlsDiv || !leftArrow || !rightArrow) return;

      // Define valores de margin e bottom conforme contexto
      const marginBottom = shortHeight
        ? (isMobile ? '10vh' : '0')
        : (isMobile ? '5vh' : '0');
      const centerControlCheckValue = isMobile ? '4vh' : '0';

      // Só aplica se necessário (evita reflow desnecessário)
      if (centerControl.style.marginBottom !== centerControlCheckValue) {
        window.easyDataLayer.setStyleHelper(extraControlsDiv, 'bottom', 'calc(5vh + 14px)');
        window.easyDataLayer.setStyleHelper(leftArrow, 'margin-bottom', marginBottom);
        window.easyDataLayer.setStyleHelper(centerControl, 'margin-bottom', marginBottom);
        window.easyDataLayer.setStyleHelper(rightArrow, 'margin-bottom', marginBottom);
      }
    }, 'setResponsiveStyle');
  },

  handlePreLoadingPlaybackMedia: function (videoIndex) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      if (window.easyDataLayer.videoData.handlePreLoadingTimeInstance) {
        clearTimeout(window.easyDataLayer.videoData.handlePreLoadingTimeInstance);
      }

      window.easyDataLayer.videoData.handlePreLoadingTimeInstance = setTimeout(() => {
        // Corrige: se videoIndex for 0, usar explicitamente 0
        const nextIndex = (videoIndex !== undefined && videoIndex !== null)
          ? videoIndex
          : window.easyDataLayer.videoData.videoIndex + 1;

        if (nextIndex >= window.easyDataLayer.videoData.allSources.length) return;

        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const videoContainer = document.querySelector("#easy-video-commerce-nh .easy-source-container");
        if (!videoContainer) return;

        for (let i = 0; i <= nextIndex; i++) {
          let video = videos[i];

          // Se não existe, cria o elemento e aplica estilos via setStyleHelper
          if (!video) {
            video = document.createElement('video');
            window.easyDataLayer.setStyleHelper(video, 'width', '100%');
            window.easyDataLayer.setStyleHelper(video, 'height', '100%');
            window.easyDataLayer.setStyleHelper(video, 'object-fit', 'cover');
            window.easyDataLayer.setStyleHelper(video, 'position', 'absolute');
            window.easyDataLayer.setStyleHelper(video, 'top', '0');
            window.easyDataLayer.setStyleHelper(video, 'left', '0');
            window.easyDataLayer.setStyleHelper(video, 'display', 'none');

            video.muted = true;
            video.disablePictureInPicture = true;
            video.playsInline = true;
            video.autoplay = true;
            videoContainer.appendChild(video);
          }

          // Só faz preload do vídeo alvo
          if (i === nextIndex) {
            // Só recarrega se src diferente
            if (video.src !== window.easyDataLayer.videoData.allSources[nextIndex]) {
              video.src = window.easyDataLayer.videoData.allSources[nextIndex];
              video.load();
            }
          }
        }
      }, 300);
    }, 'handlePreLoadingPlaybackMedia');
  },

  handlePlayPauseMedia: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[window.easyDataLayer.videoData.videoIndex];
      const btnPause = document.querySelector('#easy-video-commerce-nh .header-controls .btn-pause');
      const btnPlay = document.querySelector('#easy-video-commerce-nh .header-controls .btn-play');

      if (!video) return;

      if (video.paused) {
        video.play();
        if (btnPause) window.easyDataLayer.setStyleHelper(btnPause, 'display', 'flex');
        if (btnPlay) window.easyDataLayer.setStyleHelper(btnPlay, 'display', 'none');
      } else {
        video.pause();
        if (btnPause) window.easyDataLayer.setStyleHelper(btnPause, 'display', 'none');
        if (btnPlay) window.easyDataLayer.setStyleHelper(btnPlay, 'display', 'flex');
      }
    }, 'handlePlayPauseMedia');
  },

  restartCurrentMedia: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      if (window.easyDataLayer.videoData.restartCurrentMediaTimeInstance) {
        clearTimeout(window.easyDataLayer.videoData.restartCurrentMediaTimeInstance);
      }

      window.easyDataLayer.videoData.restartCurrentMediaTimeInstance = setTimeout(() => {
        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const video = videos[window.easyDataLayer.videoData.videoIndex];
        if (!video) return;

        video.currentTime = 0;
        video.play();

        const btnPause = document.querySelector('#easy-video-commerce-nh .header-controls .btn-pause');
        const btnPlay = document.querySelector('#easy-video-commerce-nh .header-controls .btn-play');

        if (btnPause) window.easyDataLayer.setStyleHelper(btnPause, 'display', 'flex');
        if (btnPlay) window.easyDataLayer.setStyleHelper(btnPlay, 'display', 'none');
      }, 300);
    }, 'restartCurrentMedia');
  },

  handleEndedMedia: function (videoIndex) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      if (window.easyDataLayer.videoData.handleEndedMediaTimeInstance) {
        clearTimeout(window.easyDataLayer.videoData.handleEndedMediaTimeInstance);
      }

      window.easyDataLayer.videoData.handleEndedMediaTimeInstance = setTimeout(() => {
        // Corrige: permite nextIndex = 0
        const nextIndex = (videoIndex !== undefined && videoIndex !== null)
          ? videoIndex
          : window.easyDataLayer.videoData.videoIndex + 1;

        if (nextIndex >= window.easyDataLayer.videoData.allSources.length) {
          window.easyDataLayer.restartCurrentMedia();
          return;
        }

        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const newVideo = videos?.[nextIndex];
        const oldVideo = videos[window.easyDataLayer.videoData.videoIndex];
        const currentVideoMuted = window.easyDataLayer.checkCurrentVideoMuted();

        // Já está visível ou não existe
        if (!newVideo || newVideo.style.display === 'flex') return;

        window.easyDataLayer.videoData.videoIndex = nextIndex;
        window.easyDataLayer.setStyleHelper(newVideo, 'display', 'flex');
        window.easyDataLayer.resetVideo(oldVideo);
        newVideo.currentTime = 0;

        setTimeout(() => {
          window.easyDataLayer.setAlertShow(false);
          newVideo.play();
          if (!currentVideoMuted) window.easyDataLayer.handleControlMuteAndUnmute(false);
        }, 150);

        if (!window.easyDataLayer.videoData.eventListenerAdded[window.easyDataLayer.videoData.videoIndex]) {
          window.easyDataLayer.setVideoEventListeners();
        } else {
          window.easyDataLayer.setProgressBarAction(true);
        }
      }, 300);
    }, 'handleEndedMedia');
  },

  setVideoSide: function (position) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector("#easy-video-commerce-nh-container");
      const span = document.querySelector("#easy-video-commerce-nh span.hello-message");

      if (!container || !span) return;

      // Helper para resetar as posições
      function unsetPositionStyles(element) {
        ['top', 'bottom', 'left', 'right'].forEach(prop => {
          window.easyDataLayer.setStyleHelper(element, prop, 'unset');
        });
      }

      const paddingSide = window.easyDataLayer.uiData.isMobile ? '8px' : '14px';

      const positions = {
        "left-top": { elem: { left: paddingSide, top: "5%" }, span: { top: "60px", left: "100px", right: "unset" } },
        "left-middle-top": { elem: { left: paddingSide, top: "20%" }, span: { top: "2px", left: "90px", right: "unset" } },
        "left-middle": { elem: { left: paddingSide, top: "calc(50% - 60px)" }, span: { top: "2px", left: "90px", right: "unset" } },
        "left-middle-bottom": { elem: { left: paddingSide, bottom: "20%" }, span: { top: "2px", left: "90px", right: "unset" } },
        "left-bottom": { elem: { left: paddingSide, bottom: "5%" }, span: { top: "2px", left: "90px", right: "unset" } },
        "right-top": { elem: { right: paddingSide, top: "5%" }, span: { top: "60px", right: "100px", left: "unset" } },
        "right-middle-top": { elem: { right: paddingSide, top: "20%" }, span: { top: "2px", right: "90px", left: "unset" } },
        "right-middle": { elem: { right: paddingSide, top: "calc(50% - 60px)" }, span: { top: "2px", right: "90px", left: "unset" } },
        "right-middle-bottom": { elem: { right: paddingSide, bottom: "20%" }, span: { top: "2px", right: "90px", left: "unset" } },
        "right-bottom": { elem: { right: paddingSide, bottom: "5%" }, span: { top: "2px", right: "90px", left: "unset" } },
      };

      const posi = position || window.easyDataLayer.videoData.position;
      if (!posi || !positions[posi]) return;

      window.easyDataLayer.videoData.position = posi;

      // Limpa estilos antigos antes de aplicar novos
      unsetPositionStyles(container);
      unsetPositionStyles(span);

      // Aplica estilos usando setStyleHelper para manter padrão do projeto
      Object.entries(positions[posi].elem).forEach(([prop, value]) => {
        window.easyDataLayer.setStyleHelper(container, prop, value);
      });
      Object.entries(positions[posi].span).forEach(([prop, value]) => {
        window.easyDataLayer.setStyleHelper(span, prop, value);
      });
    }, 'setVideoSide');
  },

  setHelloMessage: function (msg) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      // Helper para limpar timeout
      const clear = (t) => t && clearTimeout(t);

      // Só define a mensagem se ainda não houver uma
      if (msg && !window.easyDataLayer.uiData.helloMessage) {
        window.easyDataLayer.uiData.helloMessage = msg;
      }
      const elem = document.querySelector("#easy-video-commerce-nh span.hello-message");
      if (!elem || !window.easyDataLayer.uiData.helloMessage || elem.style.display === 'flex') return;

      clear(window.easyDataLayer.uiData.helloMessageTimeInstance);

      const container = document.querySelector("#easy-video-commerce-nh-container");
      if (!container) return;
      const isMaximized = () => container.classList.contains("maximized");

      // Exibe mensagem apenas se não estiver maximizado
      if (!isMaximized()) {
        elem.innerHTML = window.easyDataLayer.uiData.helloMessage;
        window.easyDataLayer.setStyleHelper(elem, 'display', 'flex');
        window.easyDataLayer.setStyleHelper(elem, 'opacity', '0');

        // Animação de fade-in após display flex
        window.easyDataLayer.uiData.helloMessageTimeInstance = setTimeout(() => {
          if (!isMaximized()) {
            window.easyDataLayer.setStyleHelper(elem, 'opacity', '1');
          }

          // Timeout para fade-out após 5s
          clear(window.easyDataLayer.uiData.helloMessageTimeInstance);
          window.easyDataLayer.uiData.helloMessageTimeInstance = setTimeout(() => {
            window.easyDataLayer.setStyleHelper(elem, 'opacity', '0');

            // Timeout para esconder após fade-out
            clear(window.easyDataLayer.uiData.helloMessageTimeInstance);
            window.easyDataLayer.uiData.helloMessageTimeInstance = setTimeout(() => {
              window.easyDataLayer.setStyleHelper(elem, 'display', 'none');
            }, 300);
          }, 5000);
        }, 300);
      }
    }, "setHelloMessage");
  },

  setCustomColor: function (color) {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector("#easy-video-commerce-nh-container");
      const helloMsg = document.querySelector("#easy-video-commerce-nh span.hello-message");

      if (!container || !helloMsg) return;

      // Usa setStyleHelper para manter padrão do projeto
      window.easyDataLayer.setStyleHelper(container, 'border-color', color);
      window.easyDataLayer.setStyleHelper(helloMsg, 'background-color', color);

      // Helper para parsear cor (hex ou rgb)
      function parseColor(color) {
        let r, g, b;
        if (color.charAt(0) === '#') {
          const hex = color.length === 4
            ? color.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3')
            : color;
          r = parseInt(hex.substring(1, 3), 16);
          g = parseInt(hex.substring(3, 5), 16);
          b = parseInt(hex.substring(5, 7), 16);
        } else {
          const rgb = color.match(/\d+/g);
          r = parseInt(rgb?.[0] ?? 0, 10);
          g = parseInt(rgb?.[1] ?? 0, 10);
          b = parseInt(rgb?.[2] ?? 0, 10);
        }
        return { r, g, b };
      }

      // Calcula brilho para decidir cor do texto/borda
      const { r, g, b } = parseColor(color);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const brightnessColor = brightness > 128 ? 'black' : 'white';

      window.easyDataLayer.setStyleHelper(helloMsg, 'color', brightnessColor);
      window.easyDataLayer.setStyleHelper(helloMsg, 'border-color', brightnessColor);
    }, 'setCustomColor');
  },

  enableDraggable: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      // Evita carregar múltiplas vezes
      if (window._easyvcHammerLoaded) {
        if (typeof Hammer !== "undefined") {
          window.easyDataLayer.initDraggableHammer();
        }
        return;
      }
      window._easyvcHammerLoaded = true;

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js';

      script.onload = function () {
        window.easyDataLayer.initDraggableHammer();
      };

      document.body.appendChild(script);
    }, 'enableDraggable');
  },

  initDraggableHammer: function () {
    const container = document.querySelector('.easy-video-commerce-nh-container');
    if (!container || typeof Hammer === "undefined") return;

    // Evita múltiplas instâncias do Hammer
    if (container._easyvcHammerInstance) return;

    const hammer = new Hammer(container);
    container._easyvcHammerInstance = hammer;

    hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 4 }));

    hammer.on('pan', function (event) {
      if (event.direction === 8 || event.direction === 16) {
        if (container.classList.contains('maximized')) return;

        if (!window.easyDataLayer.dnd.isDragging) {
          window.easyDataLayer.dnd.isDragging = true;
          container.classList.add('dragging');
          if (window.easyDataLayer.dnd.draggingTimeInstance) {
            clearTimeout(window.easyDataLayer.dnd.draggingTimeInstance);
          }
        }

        const elemHeight = container.offsetHeight;
        window.easyDataLayer.dnd.posY = event.center.y - (elemHeight / 2);

        // Ensure posY does not move the element off-screen
        if (window.easyDataLayer.dnd.posY < 0) {
          window.easyDataLayer.dnd.posY = 0;
        }
        // For the bottom boundary
        if (window.easyDataLayer.dnd.posY + elemHeight > window.innerHeight) {
          window.easyDataLayer.dnd.posY = window.innerHeight - elemHeight;
        }

        container.style.top = window.easyDataLayer.dnd.posY + "px";
      }

      if (event.isFinal) {
        window.easyDataLayer.dnd.isDragging = false;
        window.easyDataLayer.dnd.draggingTimeInstance = setTimeout(() => {
          container.classList.remove('dragging');
        }, 400);
      }
    });
  },

  utils: {
    executeWithLogging: function (fn, message) {
      try {
        return fn();
      } catch (error) {
        console.error(`[NuvemHub] Easy Video Commerce: ${message || 'Error'}`, error);
        return undefined;
      }
    },

    isValidValue: function (value) {
      // Considera undefined, null, string vazia, string 'null', string 'undefined' como inválidos
      return (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        value !== 'null' &&
        value !== 'undefined'
      );
    },

    isEmpty: function (array) {
      // Garante que array-like objects e falsy sejam tratados corretamente
      if (!array || typeof array.length !== 'number') return true;
      return array.length === 0;
    },

    waitForElements: function (selector, timeout = 10000, intervalTime = 100) {
      // timeout em ms para evitar loop infinito
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const interval = setInterval(() => {
          const elements = document.querySelectorAll(selector);
          if (elements && elements.length > 0) {
            clearInterval(interval);
            resolve(elements);
          } else if (Date.now() - start > timeout) {
            clearInterval(interval);
            reject(new Error(`[NuvemHub] Easy Video Commerce: waitForElements timeout for selector: ${selector}`));
          }
        }, intervalTime);
      });
    }
  },

  checkLanguage: function () {
    window.easyDataLayer.utils.executeWithLogging(() => {
      const supportedLanguages = ["es", "pt", "en"];
      // Usa navigator.languages (preferências do usuário) ou fallback para navigator.language/userLanguage
      const userLanguages = navigator?.languages || [navigator?.language || navigator?.userLanguage || "en"];

      // Busca o primeiro idioma suportado
      const detected = userLanguages
        .map(lang => lang.slice(0, 2))
        .find(shortLang => supportedLanguages.includes(shortLang));

      window.easyDataLayer.config.lang = detected || "en";
    }, 'checkLanguage');
  },

  generateUUIDv4: function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  main: async function () {
    await window.easyDataLayer.utils.executeWithLogging(async () => {
      console.log("[NuvemHub] Easy Video Commerce: starting...");

      window.easyDataLayer.setup();

      const existingWidget = document.querySelector('#easy-video-commerce-nh');
      if (window._easyvcInitLoaded && !existingWidget) {
        window._easyvcInitLoaded = false;
      }

      if (window._easyvcInitLoaded || existingWidget) {
        console.log("[NuvemHub] Easy Video Commerce: instance already running");
        return;
      }
      window._easyvcInitLoaded = true;

      window.easyDataLayer.analytics.uuid = window.easyDataLayer.generateUUIDv4();
      window.easyDataLayer.sendAnalyticsEvent('init');
      window.easyDataLayer.checkLanguage();

      if (!window.easyDataLayer.utils.isValidValue(window.easyDataLayer.store.storeId)) {
        console.log("[NuvemHub] Easy Video Commerce: storeId is not defined");
        return;
      }

      const result = await window.easyDataLayer.getEasyCampaigns();

      if (!result?.campaigns || window.easyDataLayer.utils.isEmpty(result.campaigns)) {
        console.log("[NuvemHub] Easy Video Commerce: no campaigns found");
        return;
      }

      const split = Math.random() < 0.5;
      let campaign = result.campaigns[0];

      if (result.campaigns.length > 1 && result?.abTestId) {
        window.easyDataLayer.analytics.testId = result.abTestId;
        campaign = split ? result.campaigns[0] : result.campaigns[1];
      }

      window.easyDataLayer.analytics.campaignId = campaign._id;

      window.easyDataLayer.setHTML();
      window.easyDataLayer.observeUrlChange();

      await window.easyDataLayer.utils.waitForElements("#easy-video-commerce-nh video, #easy-video-commerce-nh span.hello-message");

      const videos = campaign?.["videos"];
      if (window.easyDataLayer.utils.isEmpty(videos)) {
        console.log("[NuvemHub] Easy Video Commerce: no videos found in the campaign");
        return;
      }

      window.easyDataLayer.setSource(videos);
      window.easyDataLayer.setVideoSide(campaign?.["position"]);
      window.easyDataLayer.setHelloMessage(campaign?.["helloMessage"]);
      if (result?.personalization?.color) {
        window.easyDataLayer.setCustomColor(result.personalization.color);
      }

      window.easyDataLayer.identifyWhatsappNumberOnWebsite();

      if (result?.whatsapp) {
        const numberOnly = result.whatsapp?.replace(/\D/g, '');
        window.easyDataLayer.store.whatsapp = numberOnly;
        window.easyDataLayer.setupWppEvent();
      }

      window.easyDataLayer.enableDraggable();
    }, 'main');
  },
};

function clearEasyVCTimeouts() {
  try {
    // VideoData
    if (window.easyDataLayer?.videoData?.playNextFireTimeInstance) {
      clearTimeout(window.easyDataLayer.videoData.playNextFireTimeInstance);
      window.easyDataLayer.videoData.playNextFireTimeInstance = null;
    }
    if (window.easyDataLayer?.videoData?.handlePreLoadingTimeInstance) {
      clearTimeout(window.easyDataLayer.videoData.handlePreLoadingTimeInstance);
      window.easyDataLayer.videoData.handlePreLoadingTimeInstance = null;
    }
    if (window.easyDataLayer?.videoData?.handleEndedMediaTimeInstance) {
      clearTimeout(window.easyDataLayer.videoData.handleEndedMediaTimeInstance);
      window.easyDataLayer.videoData.handleEndedMediaTimeInstance = null;
    }
    if (window.easyDataLayer?.videoData?.restartCurrentMediaTimeInstance) {
      clearTimeout(window.easyDataLayer.videoData.restartCurrentMediaTimeInstance);
      window.easyDataLayer.videoData.restartCurrentMediaTimeInstance = null;
    }
    if (window.easyDataLayer?.videoData?.muteTimeInstance) {
      clearTimeout(window.easyDataLayer.videoData.muteTimeInstance);
      window.easyDataLayer.videoData.muteTimeInstance = null;
    }

    // UIData
    if (window.easyDataLayer?.uiData?.helloMessageTimeInstance) {
      clearTimeout(window.easyDataLayer.uiData.helloMessageTimeInstance);
      window.easyDataLayer.uiData.helloMessageTimeInstance = null;
    }
    if (window.easyDataLayer?.uiData?.alertMessageTimeInstance) {
      clearTimeout(window.easyDataLayer.uiData.alertMessageTimeInstance);
      window.easyDataLayer.uiData.alertMessageTimeInstance = null;
    }
    if (window.easyDataLayer?.uiData?.modalCommentsTimeInstance) {
      clearTimeout(window.easyDataLayer.uiData.modalCommentsTimeInstance);
      window.easyDataLayer.uiData.modalCommentsTimeInstance = null;
    }

    // DnD
    if (window.easyDataLayer?.dnd?.draggingTimeInstance) {
      clearTimeout(window.easyDataLayer.dnd.draggingTimeInstance);
      window.easyDataLayer.dnd.draggingTimeInstance = null;
    }

    // ProgressBarAction (remove listener)
    if (window.easyDataLayer?.videoData?.removeEventListenerProgressBarAction) {
      try { window.easyDataLayer.videoData.removeEventListenerProgressBarAction(); } catch (e) { }
      window.easyDataLayer.videoData.removeEventListenerProgressBarAction = null;
    }
  } catch (e) {
    // Silencia erros de limpeza
  }
}

// Origin
if (document?.currentScript?.src) {
  const url = new URL(document.currentScript.src);
  const easySrc = url.searchParams.get('easysrc');
  if (easySrc) {
    window._easyvcScriptSource = easySrc; // "gtm" ou "legacy"
  }
}

const canRunEasyVC =
  !window._easyvcPriority || // Nunca rodou antes
  (window._easyvcPriority !== "gtm" && window._easyvcScriptSource === "gtm"); // GTM sobrescreve legacy

if (canRunEasyVC) {
  if (window._easyvcPriority && window._easyvcPriority !== window._easyvcScriptSource) {
    console.log("[NuvemHub] Easy Video Commerce: Clearing previous instance...");
    if (window.easyDataLayer?.destroy) {
      window.easyDataLayer.destroy('priority-conflict');
    } else {
      const previousContainer = document.getElementById("easy-video-commerce-nh-container");
      const previousFade = document.getElementById("easy-video-commerce-nh-fade-desktop");
      if (previousContainer) previousContainer.remove();
      if (previousFade) previousFade.remove();
      clearEasyVCTimeouts();
      window._easyvcInitLoaded = false;
    }
    delete window.easyDataLayer;
  }

  window._easyvcPriority = window._easyvcScriptSource;

  window.easyDataLayer = easyDataLayer;

  window.easyDataLayer.main();
}
