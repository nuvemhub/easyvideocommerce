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
    debug: false,
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

  setup: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const debug = sessionStorage.getItem('nuvemhubdebug') === 'true';
      const isLocalhost = window.location.hostname === 'localhost';
      const isDebugMode = debug || isLocalhost;

      if (isDebugMode) {
        Object.assign(easyDataLayer.config, {
          debug: true,
          embbedUrl: "http://localhost:3002/dev/playground",
          apiUrl: "http://localhost:3002",
        });
        easyDataLayer.store.storeId = '68db768056203d3a5512d433';
        console.log('[NuvemHub] Easy Video Commerce: Partial Setup for Debug/Localhost mode.');
        return;
      }

      const script = document.currentScript;
      if (!script?.src) {
        console.error('[NuvemHub] Easy Video Commerce: Stoped on setup, script source not found.');
        return;
      }

      const url = new URL(script.src);
      const storeId = url.searchParams.get('storeId');
      const scriptVersion = url.searchParams.get('vapp');

      if (!storeId || !scriptVersion) {
        console.error('[NuvemHub] Easy Video Commerce: Stoped on setup, storeId or scriptVersion not found in script URL parameters.');
        return;
      }

      easyDataLayer.store.storeId = storeId;
      easyDataLayer.config.embbedUrl = `https://cdn.jsdelivr.net/gh/nuvemhub/easyvideocommerce@${scriptVersion}/dist`;

      const isTesting = window.location.host === 'testing.nuvemhub.com.br';
      easyDataLayer.config.apiUrl = isTesting
        ? "https://easyvc-test.nuvemhub.com.br"
        : "https://easyvc.nuvemhub.com.br";
    }, 'setup');
  },

  sendAnalyticsEvent: function (eventType, data) {
    easyDataLayer.utils.executeWithLogging(() => {
      if (!eventType || easyDataLayer.config.debug) return;

      const pushData = {
        easyvc_uuid: easyDataLayer.analytics.uuid,
        easyvc_type: eventType,
        ...(easyDataLayer.analytics.campaignId && { easyvc_campaign: easyDataLayer.analytics.campaignId }),
        ...(easyDataLayer.analytics.testId && { easyvc_test: easyDataLayer.analytics.testId }),
        ...(data && typeof data === 'object' ? { easyvc_data: JSON.stringify(data) } : {})
      };

      // NuvemShop Analytics 4
      if (typeof gtagNsGA4 === 'function') {
        gtagNsGA4('event', "easyvc_interaction", pushData);
        return;
      }

      // Default Analytics 4
      if (window?.dataLayer) {
        window.dataLayer.push({ ...pushData, event: "easyvc_interaction" });
      } else if (window?.gtag) {
        window.gtag('event', "easyvc_interaction", pushData);
      }
    }, 'sendAnalyticsEvent');
  },

  i18n: function (data) {
    return easyDataLayer.utils.executeWithLogging(() => {
      if (easyDataLayer.config.lang === 'pt' && data?.pt) {
        return data?.pt;
      }
      if (easyDataLayer.config.lang === 'es' && data?.es) {
        return data?.es;
      }
      if (data?.en) {
        return data?.en;
      }

      return "i18n text not found";
    }, 'i18n');
  },

  setStyleHelper: function (el, prop, value) {
    easyDataLayer.utils.executeWithLogging(() => {
      if (el) {
        el.style.setProperty(prop, value, 'important');
      }
    }, 'setStyleHelper');
  },

  identifyWhatsappNumberOnWebsite: function () {
    easyDataLayer.utils.executeWithLogging(() => {
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
        easyDataLayer.store.whatsapp = firstNumber;
        easyDataLayer.setupWppEvent();
      }
    }, 'identifyWhatsappNumberOnWebsite');
  },

  setMinimizedContainerSize: function () {
    const container = document.querySelector("#easy-video-commerce-nh-container");
    const easyNh = document.querySelector("#easy-video-commerce-nh");
    const sourceContainer = document.querySelector("#easy-video-commerce-nh .easy-source-container");

    // Dynamic sizes - @REFACTOR
    if (easyDataLayer.uiData.isMobile) {
      // Mobile
      easyDataLayer.setStyleHelper(container, 'height', "110px");
      easyDataLayer.setStyleHelper(container, 'width', "110px");
      easyDataLayer.setStyleHelper(easyNh, 'height', "100px");
      easyDataLayer.setStyleHelper(easyNh, 'width', "100px");
    } else {
      // Desktop
      easyDataLayer.setStyleHelper(container, 'height', "130px");
      easyDataLayer.setStyleHelper(container, 'width', "130px");
      easyDataLayer.setStyleHelper(easyNh, 'height', "120px");
      easyDataLayer.setStyleHelper(easyNh, 'width', "120px");
    }
    easyDataLayer.setStyleHelper(sourceContainer, 'border-radius', "100%");
  },

  handleMaximaze: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector("#easy-video-commerce-nh-container");
      if (!container) return;

      // Evita maximizar enquanto está arrastando
      if (container.classList.contains("dragging")) return;

      // Sempre desmuta ao maximizar
      easyDataLayer.handleControlMuteAndUnmute(false);

      // Ajusta container e conteúdo para maximizado
      easyDataLayer.setStyleHelper(container, 'border-width', '0');
      container.classList.toggle("maximized");
      easyDataLayer.setStyleHelper(container, 'z-index', '1999999999');

      const easyNh = container.querySelector("#easy-video-commerce-nh");
      if (easyNh) {
        easyDataLayer.setStyleHelper(easyNh, 'height', "100%");
        easyDataLayer.setStyleHelper(easyNh, 'width', "100%");
      }

      // Esconde mensagem de hello e mostra controles principais
      const helloMsg = container.querySelector("span.hello-message");
      if (helloMsg) easyDataLayer.setStyleHelper(helloMsg, 'display', "none");

      const progressContainer = container.querySelector(".progress-container");
      if (progressContainer) easyDataLayer.setStyleHelper(progressContainer, 'display', "flex");

      const controls = container.querySelector(".controls");
      if (controls) easyDataLayer.setStyleHelper(controls, 'display', "flex");

      // Esconde central icon após 1.5s
      setTimeout(() => {
        const centerIcon = container.querySelector(".controls .control-center .control-center-icon-container");
        if (centerIcon) easyDataLayer.setStyleHelper(centerIcon, 'display', "none");
      }, 1500);

      // Mostra botões e header
      const showSelectors = [
        ".header-title",
        ".header-controls",
        ".extra-control"
      ];
      showSelectors.forEach(sel => {
        const el = container.querySelector(sel);
        if (el) easyDataLayer.setStyleHelper(el, 'display', "flex");
      });

      // Mostra botão WhatsApp se existir número
      if (easyDataLayer.store.whatsapp) {
        const btnWpp = container.querySelector(".btn-wpp");
        if (btnWpp) easyDataLayer.setStyleHelper(btnWpp, 'display', "flex");
      }

      // Reinicia vídeo atual
      easyDataLayer.restartCurrentMedia();

      // Aplica estilos de maximizado conforme device
      const sourceContainer = container.querySelector(".easy-source-container");
      if (easyDataLayer.uiData.isMobile) {
        // Mobile
        easyDataLayer.setStyleHelper(container, 'top', "0");
        easyDataLayer.setStyleHelper(container, 'bottom', "0");
        easyDataLayer.setStyleHelper(container, 'left', "0");
        easyDataLayer.setStyleHelper(container, 'height', "100%");
        easyDataLayer.setStyleHelper(container, 'width', "100%");
        if (sourceContainer) easyDataLayer.setStyleHelper(sourceContainer, 'border-radius', "0");
        easyDataLayer.addDisableZoomPageEvent();
      } else {
        // Desktop
        easyDataLayer.setStyleHelper(container, 'top', '14px');
        easyDataLayer.setStyleHelper(container, 'bottom', '14px');
        easyDataLayer.setStyleHelper(container, 'left', '50%');
        easyDataLayer.setStyleHelper(container, 'transform', 'translateX(-50%)');
        easyDataLayer.setStyleHelper(container, 'height', "calc(100vh - 28px)");
        easyDataLayer.setStyleHelper(container, 'width', "calc((100vh - 28px) * 0.6)");
        if (sourceContainer) easyDataLayer.setStyleHelper(sourceContainer, 'border-radius', "8px");
        const fadeDesktop = document.querySelector("#easy-video-commerce-nh-fade-desktop");
        if (fadeDesktop) {
          easyDataLayer.setStyleHelper(fadeDesktop, 'display', 'flex');
          easyDataLayer.setStyleHelper(fadeDesktop, 'z-index', '1909999999');
        }
      }

      // Dispara evento de view apenas uma vez
      if (!easyDataLayer.analytics.viewTriggered) {
        easyDataLayer.sendAnalyticsEvent('view');
        easyDataLayer.analytics.viewTriggered = true;
      }
    }, 'handleMaximaze');
  },

  handleMinimize: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector("#easy-video-commerce-nh-container");
      const easyNh = document.querySelector("#easy-video-commerce-nh");
      const fadeDesktop = document.querySelector("#easy-video-commerce-nh-fade-desktop");

      // Minimiza para desktop
      const minDesktop = () => {
        easyDataLayer.setStyleHelper(container, 'transform', "translateX(0)");
        easyDataLayer.setStyleHelper(fadeDesktop, 'display', 'none');
        easyDataLayer.setStyleHelper(fadeDesktop, 'z-index', '15000');
      };

      // Minimiza para mobile
      const minMobile = () => {
        easyDataLayer.setStyleHelper(easyNh, 'left', '14px');
        easyDataLayer.setStyleHelper(easyNh, 'bottom', '14px');

        easyDataLayer.removeDisableZoomPageEvent();
      };

      easyDataLayer.handleControlMuteAndUnmute(true);

      easyDataLayer.setStyleHelper(container, 'border-width', '3px');
      container.classList.toggle("maximized");
      easyDataLayer.setStyleHelper(container, 'z-index', '16000');

      // Esconde elementos principais
      [
        ".header-title",
        ".progress-container",
        ".controls",
        ".header-controls",
        ".extra-control"
      ].forEach(sel => {
        const el = document.querySelector(`#easy-video-commerce-nh ${sel}`);
        easyDataLayer.setStyleHelper(el, 'display', 'none');
      });

      // Set minimized size
      easyDataLayer.setMinimizedContainerSize();

      // Aplica estilos de minimizado conforme device
      if (easyDataLayer.uiData.isMobile) {
        minMobile();
      } else {
        minDesktop();
      }

      easyDataLayer.setVideoSide();
    }, 'handleMinimize');
  },

  setHTML: function () {
    const handleControlLeft = () => easyDataLayer.checkCurrentMediaAndPlayNext(false);
    const handleControlRight = () => easyDataLayer.checkCurrentMediaAndPlayNext(true);

    fetch(`${easyDataLayer.config.embbedUrl}/nuvemHubEVCScope.html`)
      .then(response => response.text())
      .then(data => {
        // Fade overlay
        const fadeDesktop = document.createElement('div');
        fadeDesktop.id = 'easy-video-commerce-nh-fade-desktop';
        fadeDesktop.className = 'easy-video-commerce-nh-fade-desktop';
        easyDataLayer.setStyleHelper(fadeDesktop, 'display', 'none');
        easyDataLayer.setStyleHelper(fadeDesktop, 'position', 'fixed');
        easyDataLayer.setStyleHelper(fadeDesktop, 'top', '0');
        easyDataLayer.setStyleHelper(fadeDesktop, 'left', '0');
        easyDataLayer.setStyleHelper(fadeDesktop, 'width', '100%');
        easyDataLayer.setStyleHelper(fadeDesktop, 'height', '100%');
        easyDataLayer.setStyleHelper(fadeDesktop, 'background-color', 'rgba(0, 0, 0, 0.8)');
        easyDataLayer.setStyleHelper(fadeDesktop, 'z-index', '15000');
        document.body.appendChild(fadeDesktop);

        // Main container
        const container = document.createElement('div');
        container.id = 'easy-video-commerce-nh-container';
        container.className = 'easy-video-commerce-nh-container';
        easyDataLayer.setStyleHelper(container, 'display', 'none');
        easyDataLayer.setStyleHelper(container, 'align-items', 'center');
        easyDataLayer.setStyleHelper(container, 'justify-content', 'center');
        easyDataLayer.setStyleHelper(container, 'position', 'fixed');
        easyDataLayer.setStyleHelper(container, 'cursor', 'pointer');
        easyDataLayer.setStyleHelper(container, 'z-index', '16000');
        easyDataLayer.setStyleHelper(container, 'border', '3px solid #000');
        easyDataLayer.setStyleHelper(container, 'border-radius', '100%');
        easyDataLayer.setStyleHelper(container, 'box-sizing', 'border-box');
        easyDataLayer.setStyleHelper(container, 'transition', 'top 0.1s');

        // Easy Container
        const div = document.createElement('div');
        div.id = 'easy-video-commerce-nh';
        div.className = 'easy-video-commerce-nh';
        easyDataLayer.setStyleHelper(div, 'display', 'flex');
        div.innerHTML = data;
        container.appendChild(div);

        document.body.appendChild(container);

        // CSS global para o widget
        const style = document.createElement('style');
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
        document.head.appendChild(style);

        // Adiciona listeners de controles
        const qs = (sel) => document.querySelector(sel);
        qs("#easy-video-commerce-nh .easy-source-container")?.addEventListener("click", easyDataLayer.handleMaximaze);
        qs("#easy-video-commerce-nh .header-controls .btn-restart")?.addEventListener("click", easyDataLayer.restartCurrentMedia);
        qs("#easy-video-commerce-nh .header-controls .btn-pause")?.addEventListener("click", easyDataLayer.handlePlayPauseMedia);
        qs("#easy-video-commerce-nh .header-controls .btn-play")?.addEventListener("click", easyDataLayer.handlePlayPauseMedia);
        qs("#easy-video-commerce-nh .header-controls .btn-close")?.addEventListener("click", easyDataLayer.handleMinimize);
        if (!easyDataLayer.uiData.isMobile) {
          qs("#easy-video-commerce-nh-fade-desktop")?.addEventListener("click", () => easyDataLayer.handleMinimize(false));
        }
        qs("#easy-video-commerce-nh .controls .control-left")?.addEventListener("click", handleControlLeft);
        qs("#easy-video-commerce-nh .controls .control-right")?.addEventListener("click", handleControlRight);
        qs("#easy-video-commerce-nh .controls .control-center")?.addEventListener("click", easyDataLayer.handleControlMuteAndUnmute);

        qs("#easy-video-commerce-nh .extra-control .btn-like")?.addEventListener("click", easyDataLayer.handleLike);
        qs("#easy-video-commerce-nh .extra-control .btn-comments")?.addEventListener("click", easyDataLayer.handleModalComments);
        qs("#easy-video-commerce-nh #comments-container .overlay")?.addEventListener("click", easyDataLayer.handleModalComments);
        qs("#easy-video-commerce-nh #comments-container .comments-btn-close")?.addEventListener("click", easyDataLayer.handleModalComments);
        qs("#easy-video-commerce-nh #comments-container .submit-comment")?.addEventListener("click", easyDataLayer.handleComment);
        qs("#easy-video-commerce-nh .extra-control .btn-share")?.addEventListener("click", easyDataLayer.handleShare);

        qs("#easy-video-commerce-nh-container")?.addEventListener('mouseenter', () => {
          const maximized = container.classList.contains("maximized");
          if (!maximized) {
            easyDataLayer.setHelloMessage(null);
          }
        });

        // Set initial size of minimized container
        easyDataLayer.setMinimizedContainerSize();

        // Tradução dinâmica dos comentários
        const modalCommentsTitle = qs('#easy-video-commerce-nh #comments-container h2');
        const modalCommentsInput = qs('#easy-video-commerce-nh #comments-container input');
        const modalCommentsSubmit = qs('#easy-video-commerce-nh #comments-container .submit-comment');
        if (modalCommentsTitle && modalCommentsInput && modalCommentsSubmit) {
          modalCommentsTitle.textContent = easyDataLayer.i18n({ pt: 'Comentários', es: 'Comentarios', en: 'Comments' });
          modalCommentsInput.placeholder = easyDataLayer.i18n({
            pt: 'Deixe sua opinião ou dúvida! Seu feedback nos ajuda a melhorar cada vez mais. 😊',
            es: '¡Deja tu opinión o duda! Tu feedback nos ayuda a mejorar cada vez más. 😊',
            en: 'Leave your opinion or question! Your feedback helps us improve more and more. 😊'
          });
          modalCommentsSubmit.textContent = easyDataLayer.i18n({ pt: 'Enviar', es: 'Enviar', en: 'Send' });
        }

        easyDataLayer.sendAnalyticsEvent('loaded');
      })
      .catch((error) => {
        console.error("[NuvemHub] Easy Video Commerce: setHTML", error);
      });
  },

  handleLike: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const likeBtn = document.querySelector("#easy-video-commerce-nh .extra-control .btn-like");
      const likeSvgD = likeBtn?.querySelector(".like-icon-disabled");
      const likeSvgE = likeBtn?.querySelector(".like-icon-enabled");

      if (!likeBtn || !likeSvgD || !likeSvgE) return;
      if (likeSvgD.style.display === "none") return;
      easyDataLayer.sendAnalyticsEvent('like');

      // Animação de feedback visual usando setStyleHelper
      easyDataLayer.setStyleHelper(likeSvgD, 'display', 'none');
      easyDataLayer.setStyleHelper(likeSvgE, 'display', 'flex');
      easyDataLayer.setStyleHelper(likeBtn, 'pointer-events', 'none');
      easyDataLayer.setStyleHelper(likeBtn, 'transition', 'transform 0.3s');
      easyDataLayer.setStyleHelper(likeBtn, 'transform', 'scale(1.4)');

      setTimeout(() => {
        easyDataLayer.setStyleHelper(likeBtn, 'transform', 'scale(1)');
        easyDataLayer.setStyleHelper(likeBtn, 'pointer-events', 'all');
      }, 350);

      if (easyDataLayer.config.debug) {
        easyDataLayer.sendAnalyticsEvent('purchase', { value: 99.9, currency: 'BRL' });
      }
    }, 'handleLike');
  },

  handleComment: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const comment = document.querySelector("#easy-video-commerce-nh #comments-container input");
      const btnCommentSubmit = document.querySelector("#easy-video-commerce-nh #comments-container .submit-comment");
      const btnCommentClose = document.querySelector("#easy-video-commerce-nh #comments-container .comments-btn-close");

      if (!comment || !btnCommentSubmit || !btnCommentClose || !comment?.value) return;

      if (comment?.value) {
        easyDataLayer.sendAnalyticsEvent('comment', {
          comment: comment.value
        });
      }

      if (comment && btnCommentSubmit) {
        comment.disabled = true;

        // Success message + animação simples usando setStyleHelper
        easyDataLayer.setStyleHelper(btnCommentSubmit, 'pointer-events', 'none');
        easyDataLayer.setStyleHelper(btnCommentClose, 'pointer-events', 'none');
        btnCommentSubmit.textContent = easyDataLayer.i18n({ pt: 'Enviado!', es: '¡Enviado!', en: 'Sent!' });
        easyDataLayer.setStyleHelper(btnCommentSubmit, 'color', '#2dc653');
        easyDataLayer.setStyleHelper(btnCommentSubmit, 'transition', 'all 0.4s');
        easyDataLayer.setStyleHelper(btnCommentSubmit, 'transform', 'scale(1.12)');

        // Remove animação após um tempo
        setTimeout(() => {
          easyDataLayer.setStyleHelper(btnCommentSubmit, 'transform', 'scale(1)');
        }, 400);
      }

      setTimeout(() => {
        easyDataLayer.handleModalComments();

        if (comment && btnCommentSubmit) {
          comment.disabled = false;
          comment.value = '';

          easyDataLayer.setStyleHelper(btnCommentSubmit, 'pointer-events', 'all');
          easyDataLayer.setStyleHelper(btnCommentClose, 'pointer-events', 'all');
          btnCommentSubmit.textContent = easyDataLayer.i18n({ pt: 'Enviar', es: 'Enviar', en: 'Send' });
          easyDataLayer.setStyleHelper(btnCommentSubmit, 'color', '#303030');
          easyDataLayer.setStyleHelper(btnCommentSubmit, 'transform', 'scale(1)');
        }
      }, 1250);
    }, 'handleComment');
  },

  setupWppEvent: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const btnWpp = document.querySelector("#easy-video-commerce-nh .extra-control .btn-wpp");
      if (!btnWpp) return;

      // Remove event listener anterior para evitar múltiplos binds
      btnWpp.replaceWith(btnWpp.cloneNode(true));
      const newBtnWpp = document.querySelector("#easy-video-commerce-nh .extra-control .btn-wpp");

      if (easyDataLayer.store.whatsapp) {
        easyDataLayer.setStyleHelper(newBtnWpp, 'display', 'flex');
        newBtnWpp.addEventListener("click", function () {
          easyDataLayer.utils.executeWithLogging(() => {
            easyDataLayer.sendAnalyticsEvent('wpp');
            const helloWppText = easyDataLayer.i18n({
              pt: `Olá! Vi um vídeo na loja e quero saber mais. 😊\n\n${window.location.href}`,
              es: `¡Hola! Vi un video en la tienda y quiero saber más. 😊\n\n${window.location.href}`,
              en: `Hi! I saw a video in the store and want to know more. 😊\n\n${window.location.href}`
            });
            window.open(
              `https://wa.me/${easyDataLayer.store.whatsapp}?text=${encodeURIComponent(helloWppText)}`,
              '_blank'
            );
          }, 'handleWppContact');
        });
      } else {
        easyDataLayer.setStyleHelper(newBtnWpp, 'display', 'none');
      }
    }, 'setupWppEvent');
  },

  handleShare: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      // Web Share API
      if (navigator?.share) {
        navigator.share({
          title: document.title,
          text: easyDataLayer.i18n({
            pt: 'Olha esse vídeo interessante que encontrei!',
            es: '¡Mira este video interesante que encontré!',
            en: 'Check out this interesting video I found!'
          }),
          url: window.location.href
        }).then(() => {
          easyDataLayer.sendAnalyticsEvent('share');
        }).catch((error) => {
          console.error('[NuvemHub] Easy Video Commerce: handleShare Web Share API Error:', error);
        });
      } else if (navigator?.clipboard && window?.isSecureContext) {
        // Modern clipboard API
        navigator.clipboard.writeText(window.location.href)
          .then(() => {
            easyDataLayer.setAlertShow(true, easyDataLayer.i18n({
              pt: 'Link copiado!',
              es: '¡Enlace copiado!',
              en: 'Link copied!'
            }), true, 1200);

            easyDataLayer.sendAnalyticsEvent('share');
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
          easyDataLayer.setAlertShow(true, easyDataLayer.i18n({
            pt: 'Link copiado!',
            es: '¡Enlace copiado!',
            en: 'Link copied!'
          }), true, 1200);
          easyDataLayer.sendAnalyticsEvent('share');
        } catch (err) {
          console.error('[NuvemHub] Easy Video Commerce: handleShare Fallback Error:', err);
        }
        document.body.removeChild(dummy);
      }
    }, 'handleShare');
  },

  checkCurrentVideoMuted: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[easyDataLayer.videoData.videoIndex];
      return video.muted;
    }, 'checkCurrentVideoMuted');
  },

  handleControlMuteAndUnmute: function (forceMute = null) {
    easyDataLayer.utils.executeWithLogging(() => {
      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[easyDataLayer.videoData.videoIndex];

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
      easyDataLayer.setStyleHelper(unmuteIcon, 'display', video.muted ? 'none' : 'flex');
      easyDataLayer.setStyleHelper(muteIcon, 'display', video.muted ? 'flex' : 'none');
      easyDataLayer.setStyleHelper(iconContainer, 'display', 'flex');

      if (easyDataLayer.videoData.muteTimeInstance) clearTimeout(easyDataLayer.videoData.muteTimeInstance);
      easyDataLayer.videoData.muteTimeInstance = setTimeout(() => {
        easyDataLayer.setStyleHelper(iconContainer, 'display', 'none');
      }, 1500);
    }, 'handleControlMuteAndUnmute');
  },

  handleModalComments: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector('#easy-video-commerce-nh #comments-container');
      const wrapper = document.querySelector('#easy-video-commerce-nh #comments-container .wrapper');

      if (!container || !wrapper) return;

      if (easyDataLayer.uiData.modalCommentsTimeInstance) {
        clearTimeout(easyDataLayer.uiData.modalCommentsTimeInstance);
      }

      const isOpen =
        wrapper.style.bottom === '0px' ||
        wrapper.style.bottom === '0%' ||
        wrapper.style.bottom === '0';

      if (isOpen) {
        easyDataLayer.setStyleHelper(wrapper, 'bottom', '-100%');
        easyDataLayer.setStyleHelper(container, 'transition', 'opacity 0.25s');
        easyDataLayer.setStyleHelper(container, 'opacity', '0');
        easyDataLayer.uiData.modalCommentsTimeInstance = setTimeout(() => {
          easyDataLayer.setStyleHelper(container, 'display', 'none');
          easyDataLayer.setStyleHelper(container, 'opacity', '1');
        }, 250);
      } else {
        easyDataLayer.setStyleHelper(container, 'display', 'flex');
        easyDataLayer.setStyleHelper(container, 'opacity', '0');
        easyDataLayer.uiData.modalCommentsTimeInstance = setTimeout(() => {
          easyDataLayer.setStyleHelper(wrapper, 'bottom', '0');
          easyDataLayer.setStyleHelper(container, 'transition', 'opacity 0.25s');
          easyDataLayer.setStyleHelper(container, 'opacity', '1');
        }, 10);
      }
    }, 'handleModalComments');
  },

  checkCurrentMediaAndPlayNext: function (forward) {
    easyDataLayer.utils.executeWithLogging(() => {
      const DELAY_BEFORE_PLAY = 150;
      const DELAY_DEBOUNCE = 300;

      easyDataLayer.videoData.playNextFireCalls += (forward ? 1 : -1);

      if (easyDataLayer.videoData.playNextFireTimeInstance) {
        clearTimeout(easyDataLayer.videoData.playNextFireTimeInstance);
      }

      easyDataLayer.videoData.playNextFireTimeInstance = setTimeout(() => {
        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const { videoIndex, playNextFireCalls, allSources } = easyDataLayer.videoData;
        const lastIndex = allSources.length - 1;

        // Utilitário para calcular o próximo índice válido
        const getNextIndex = (current, calls, max) => {
          const idx = current + calls;
          if (idx >= max) return max - 1;
          if (idx < 0) return 0;
          return idx;
        };

        const nextIndex = getNextIndex(videoIndex, easyDataLayer.videoData.playNextFireCalls, allSources.length);

        easyDataLayer.videoData.playNextFireCalls = 0;

        if (videoIndex === nextIndex || nextIndex < 0 || nextIndex >= allSources.length) {
          easyDataLayer.restartCurrentMedia();
          return;
        }

        const nextVid = videos?.[nextIndex];
        const oldVideo = videos?.[videoIndex];
        if (oldVideo) oldVideo.pause();
        const currentVideoMuted = easyDataLayer.checkCurrentVideoMuted();

        // check if video not exists, then preload
        if (!nextVid) {
          easyDataLayer.handlePreLoadingPlaybackMedia(nextIndex);
          easyDataLayer.handleEndedMedia(nextIndex);
          return;
        }

        // update index
        easyDataLayer.videoData.videoIndex = nextIndex;

        let mustSetProgressBarAction = true;
        // check if already load
        if (nextVid.readyState < 4) {
          if (nextVid.src !== easyDataLayer.videoData.allSources[nextIndex]) {
            nextVid.src = easyDataLayer.videoData.allSources[nextIndex];
            nextVid.load();
            easyDataLayer.setVideoEventListeners();
            mustSetProgressBarAction = false;
          } else {
            nextVid.src = easyDataLayer.videoData.allSources[nextIndex];
            nextVid.load();
          }
        }

        // show and play
        easyDataLayer.setStyleHelper(nextVid, 'display', 'flex');
        if (oldVideo) easyDataLayer.resetVideo(oldVideo);

        if (mustSetProgressBarAction) easyDataLayer.setProgressBarAction(forward);

        setTimeout(() => {
          easyDataLayer.setAlertShow(false);
          nextVid.play();
          if (!currentVideoMuted) easyDataLayer.handleControlMuteAndUnmute(false);
        }, DELAY_BEFORE_PLAY);
      }, DELAY_DEBOUNCE);
    }, 'checkCurrentMediaAndPlayNext');
  },

  resetVideo: function (video) {
    easyDataLayer.utils.executeWithLogging(() => {
      if (!video) return;

      video.style.display = 'none';
      video.currentTime = 0;
      video.pause();
      video.muted = true;
    }, 'resetVideo');
  },

  observeUrlChange: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      let oldHref = document.location.pathname;
      const body = document.body;

      // Helper para remover container e fade
      const removeEasyVCElements = () => {
        const container = document.getElementById('easy-video-commerce-nh-container');
        const fadeDesktop = document.getElementById('easy-video-commerce-nh-fade-desktop');
        if (container) container.remove();
        if (fadeDesktop) fadeDesktop.remove();
      };

      const observer = new MutationObserver(() => {
        if (oldHref !== document.location.pathname) {
          oldHref = document.location.pathname;
          removeEasyVCElements();
          console.log("[NuvemHub] Easy Video Commerce: observeUrlChange - elements removed");
        }
      });

      observer.observe(body, { childList: true, subtree: true });
    }, 'observeUrlChange');
  },

  disableZoomPage: function (event) {
    easyDataLayer.utils.executeWithLogging(() => {
      if (event.scale !== 1) {
        event.preventDefault();
      }
    }, 'disableZoomPage');
  },

  disableDoubleTapZoom: function (event) {
    easyDataLayer.utils.executeWithLogging(() => {
      event.preventDefault();
    }, 'disableDoubleTapZoom');
  },

  addDisableZoomPageEvent: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      document.addEventListener('touchmove', easyDataLayer.disableZoomPage, { passive: false });
      document.addEventListener('dblclick', easyDataLayer.disableDoubleTapZoom, { passive: false });
    }, 'addDisableZoomPageEvent');
  },

  removeDisableZoomPageEvent: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      document.removeEventListener('touchmove', easyDataLayer.disableZoomPage);
      document.removeEventListener('dblclick', easyDataLayer.disableDoubleTapZoom);
    }, 'removeDisableZoomPageEvent');
  },

  getEasyCampaigns: function () {
    return new Promise((resolve) => {
      const lowercasePath = window.location.pathname.toLowerCase();
      const query = `filter=${encodeURIComponent(lowercasePath)}`;

      fetch(`${easyDataLayer.config.apiUrl}/campaign/list/display/${easyDataLayer.store.storeId}?${query}`)
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
    easyDataLayer.utils.executeWithLogging(() => {
      easyDataLayer.videoData.allSources = videos.map(video => video.sourceUrl);
      easyDataLayer.videoData.eventListenerAdded = videos.map(() => false);
      easyDataLayer.videoData.allVideosAttachedData = videos;
      document.querySelector("#easy-video-commerce-nh video").src = videos[0].sourceUrl;

      easyDataLayer.setVideoEventListeners();
    }, 'setSource');
  },

  setVideoEventListeners: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const enableEasyContainer = (value) => {
        const container = document.querySelector("#easy-video-commerce-nh-container");
        const fade = document.querySelector("#easy-video-commerce-nh-fade-desktop");
        easyDataLayer.setStyleHelper(container, 'display', value);

        const isMaximized = container.classList.contains("maximized");
        if (fade && isMaximized) {
          easyDataLayer.setStyleHelper(fade, 'display', value);
        }
      };

      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[easyDataLayer.videoData.videoIndex];
      if (!video) return;

      // Remove listeners antigos se já adicionados
      if (video._easyvcListeners) {
        video.removeEventListener('loadeddata', video._easyvcListeners.loadeddata);
        video.removeEventListener('error', video._easyvcListeners.error);
        video.removeEventListener('ended', video._easyvcListeners.ended);
      }

      easyDataLayer.videoData.eventListenerAdded[easyDataLayer.videoData.videoIndex] = true;
      easyDataLayer.setAlertShow(true);
      video.muted = true;

      // Handlers nomeados para fácil remoção
      const onLoadedData = () => {
        console.log("[NuvemHub] Easy Video Commerce: video loaded");
        easyDataLayer.setAlertShow(false);
        enableEasyContainer('flex');
        easyDataLayer.setHTMLProgressBars();
        easyDataLayer.setProgressBarAction(true);
        easyDataLayer.setResponsiveStyle();
        video.play();
      };

      const onError = () => {
        console.log("[NuvemHub] Easy Video Commerce: video error, trying again...");
        if (!easyDataLayer.analytics.errorTriggered) {
          easyDataLayer.sendAnalyticsEvent('loaderror');
          easyDataLayer.analytics.errorTriggered = true;
          enableEasyContainer('none');

          video.src = '';
          setTimeout(() => {
            video.src = easyDataLayer.videoData.allSources[easyDataLayer.videoData.videoIndex];
            video.load();
          }, 50);
        }
      };

      const onEnded = () => {
        console.log("[NuvemHub] Easy Video Commerce: video ended");
        const maximized = document.querySelector("#easy-video-commerce-nh-container").classList.contains("maximized");
        if (maximized) {
          easyDataLayer.handleEndedMedia();
        } else {
          easyDataLayer.setAlertShow(false);
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
    easyDataLayer.utils.executeWithLogging(() => {
      const alert = document.querySelector('#easy-video-commerce-nh #alert-message');
      const alertText = document.querySelector('#easy-video-commerce-nh #alert-message span');

      if (!alert || !alertText) return;

      // Helper para limpar e resetar o timeout
      const clearAlertTimeout = () => {
        if (easyDataLayer.uiData.alertMessageTimeInstance) {
          clearTimeout(easyDataLayer.uiData.alertMessageTimeInstance);
          easyDataLayer.uiData.alertMessageTimeInstance = null;
        }
      };

      clearAlertTimeout();

      // Adiciona listener de click apenas uma vez
      if (!easyDataLayer.uiData.hasAlertMessageEventListener) {
        alert.addEventListener('click', () => {
          easyDataLayer.setStyleHelper(alert, 'display', 'none');
          alertText.textContent = 'Loading...';
          clearAlertTimeout();
        });
        easyDataLayer.uiData.hasAlertMessageEventListener = true;
      }

      if (show) {
        easyDataLayer.setStyleHelper(alert, 'display', 'flex');
        alertText.textContent = message || 'Loading...';
      } else {
        easyDataLayer.setStyleHelper(alert, 'display', 'none');
        alertText.textContent = 'Loading...';
      }

      if (autoClose && show) {
        easyDataLayer.uiData.alertMessageTimeInstance = setTimeout(() => {
          easyDataLayer.setAlertShow(false);
        }, timeout);
      }
    }, 'setAlertShow');
  },

  setHTMLProgressBars: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const progressContainer = document.querySelector('#easy-video-commerce-nh .progress-container');
      if (!progressContainer) return;

      // Limpa barras antigas antes de criar novas (evita duplicidade)
      progressContainer.innerHTML = '';

      easyDataLayer.videoData.allSources.forEach((_, index) => {
        const progressBar = document.createElement('div');
        progressBar.classList.add('progress-bar-item');
        progressBar.id = `progress-bar-${index + 1}`;

        easyDataLayer.setStyleHelper(progressBar, 'height', '4px');
        easyDataLayer.setStyleHelper(progressBar, 'width', '100%');
        easyDataLayer.setStyleHelper(progressBar, 'background-color', 'rgba(255, 255, 255, .35)');
        easyDataLayer.setStyleHelper(progressBar, 'border-radius', '6px');

        const progress = document.createElement('div');
        easyDataLayer.setStyleHelper(progress, 'height', '100%');
        easyDataLayer.setStyleHelper(progress, 'background-color', 'rgb(255, 255, 255)');
        easyDataLayer.setStyleHelper(progress, 'transition', 'width 0.35s ease');
        easyDataLayer.setStyleHelper(progress, 'width', '0%');
        easyDataLayer.setStyleHelper(progress, 'border-radius', '6px');

        progressBar.appendChild(progress);
        progressContainer.appendChild(progressBar);
      });
    }, 'setHTMLProgressBars');
  },

  setProgressBarAction: function (forward) {
    easyDataLayer.utils.executeWithLogging(() => {
      const addVideoEventListener = (video, event, handler) => {
        video.addEventListener(event, handler);
        return function removeEventListener() {
          video.removeEventListener(event, handler);
        };
      };

      const allBars = document.querySelectorAll('#easy-video-commerce-nh .progress-bar-item > div');
      const { videoIndex, allSources } = easyDataLayer.videoData;

      // Atualiza barras anteriores e posteriores
      for (let i = 0; i < videoIndex; i++) {
        easyDataLayer.setStyleHelper(allBars[i], 'width', '100%');
      }
      for (let i = videoIndex + 1; i < allSources.length; i++) {
        easyDataLayer.setStyleHelper(allBars[i], 'width', '0%');
      }

      // Barra do vídeo atual
      const bar = document.querySelector(`#progress-bar-${videoIndex + 1} > div`);
      easyDataLayer.setStyleHelper(bar, 'display', 'flex');

      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[videoIndex];
      const nextVideo = videos?.[videoIndex + (forward ? 1 : -1)];

      // Remove listener anterior, se houver
      if (easyDataLayer.videoData.removeEventListenerProgressBarAction) {
        easyDataLayer.videoData.removeEventListenerProgressBarAction();
      }

      easyDataLayer.videoData.preloadStarted = false;
      easyDataLayer.videoData.removeEventListenerProgressBarAction = addVideoEventListener(video, 'timeupdate', () => {
        const percent = (video.currentTime / video.duration) * 100;
        easyDataLayer.setStyleHelper(bar, 'width', `${percent}%`);

        // Preload do próximo vídeo se passou de 60%
        if (video.currentTime / video.duration > 0.60 && !easyDataLayer.videoData.preloadStarted) {
          if (!nextVideo) easyDataLayer.handlePreLoadingPlaybackMedia();
          easyDataLayer.videoData.preloadStarted = true;
        }
      });
    }, 'setProgressBarAction');
  },

  setResponsiveStyle: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const shortHeight = window.innerHeight < 700;
      const isMobile = easyDataLayer.uiData.isMobile;

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
        easyDataLayer.setStyleHelper(extraControlsDiv, 'bottom', 'calc(5vh + 14px)');
        easyDataLayer.setStyleHelper(leftArrow, 'margin-bottom', marginBottom);
        easyDataLayer.setStyleHelper(centerControl, 'margin-bottom', marginBottom);
        easyDataLayer.setStyleHelper(rightArrow, 'margin-bottom', marginBottom);
      }
    }, 'setResponsiveStyle');
  },

  handlePreLoadingPlaybackMedia: function (videoIndex) {
    easyDataLayer.utils.executeWithLogging(() => {
      if (easyDataLayer.videoData.handlePreLoadingTimeInstance) {
        clearTimeout(easyDataLayer.videoData.handlePreLoadingTimeInstance);
      }

      easyDataLayer.videoData.handlePreLoadingTimeInstance = setTimeout(() => {
        // Corrige: se videoIndex for 0, usar explicitamente 0
        const nextIndex = (videoIndex !== undefined && videoIndex !== null)
          ? videoIndex
          : easyDataLayer.videoData.videoIndex + 1;

        if (nextIndex >= easyDataLayer.videoData.allSources.length) return;

        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const videoContainer = document.querySelector("#easy-video-commerce-nh .easy-source-container");
        if (!videoContainer) return;

        for (let i = 0; i <= nextIndex; i++) {
          let video = videos[i];

          // Se não existe, cria o elemento e aplica estilos via setStyleHelper
          if (!video) {
            video = document.createElement('video');
            easyDataLayer.setStyleHelper(video, 'width', '100%');
            easyDataLayer.setStyleHelper(video, 'height', '100%');
            easyDataLayer.setStyleHelper(video, 'object-fit', 'cover');
            easyDataLayer.setStyleHelper(video, 'position', 'absolute');
            easyDataLayer.setStyleHelper(video, 'top', '0');
            easyDataLayer.setStyleHelper(video, 'left', '0');
            easyDataLayer.setStyleHelper(video, 'display', 'none');

            video.muted = true;
            video.disablePictureInPicture = true;
            video.playsInline = true;
            video.autoplay = true;
            videoContainer.appendChild(video);
          }

          // Só faz preload do vídeo alvo
          if (i === nextIndex) {
            // Só recarrega se src diferente
            if (video.src !== easyDataLayer.videoData.allSources[nextIndex]) {
              video.src = easyDataLayer.videoData.allSources[nextIndex];
              video.load();
            }
          }
        }
      }, 300);
    }, 'handlePreLoadingPlaybackMedia');
  },

  handlePlayPauseMedia: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[easyDataLayer.videoData.videoIndex];
      const btnPause = document.querySelector('#easy-video-commerce-nh .header-controls .btn-pause');
      const btnPlay = document.querySelector('#easy-video-commerce-nh .header-controls .btn-play');

      if (!video) return;

      if (video.paused) {
        video.play();
        if (btnPause) easyDataLayer.setStyleHelper(btnPause, 'display', 'flex');
        if (btnPlay) easyDataLayer.setStyleHelper(btnPlay, 'display', 'none');
      } else {
        video.pause();
        if (btnPause) easyDataLayer.setStyleHelper(btnPause, 'display', 'none');
        if (btnPlay) easyDataLayer.setStyleHelper(btnPlay, 'display', 'flex');
      }
    }, 'handlePlayPauseMedia');
  },

  restartCurrentMedia: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      if (easyDataLayer.videoData.restartCurrentMediaTimeInstance) {
        clearTimeout(easyDataLayer.videoData.restartCurrentMediaTimeInstance);
      }

      easyDataLayer.videoData.restartCurrentMediaTimeInstance = setTimeout(() => {
        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const video = videos[easyDataLayer.videoData.videoIndex];
        if (!video) return;

        video.currentTime = 0;
        video.play();

        const btnPause = document.querySelector('#easy-video-commerce-nh .header-controls .btn-pause');
        const btnPlay = document.querySelector('#easy-video-commerce-nh .header-controls .btn-play');

        if (btnPause) easyDataLayer.setStyleHelper(btnPause, 'display', 'flex');
        if (btnPlay) easyDataLayer.setStyleHelper(btnPlay, 'display', 'none');
      }, 300);
    }, 'restartCurrentMedia');
  },

  handleEndedMedia: function (videoIndex) {
    easyDataLayer.utils.executeWithLogging(() => {
      if (easyDataLayer.videoData.handleEndedMediaTimeInstance) {
        clearTimeout(easyDataLayer.videoData.handleEndedMediaTimeInstance);
      }

      easyDataLayer.videoData.handleEndedMediaTimeInstance = setTimeout(() => {
        // Corrige: permite nextIndex = 0
        const nextIndex = (videoIndex !== undefined && videoIndex !== null)
          ? videoIndex
          : easyDataLayer.videoData.videoIndex + 1;

        if (nextIndex >= easyDataLayer.videoData.allSources.length) {
          easyDataLayer.restartCurrentMedia();
          return;
        }

        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const newVideo = videos?.[nextIndex];
        const oldVideo = videos[easyDataLayer.videoData.videoIndex];
        const currentVideoMuted = easyDataLayer.checkCurrentVideoMuted();

        // Já está visível ou não existe
        if (!newVideo || newVideo.style.display === 'flex') return;

        easyDataLayer.videoData.videoIndex = nextIndex;
        easyDataLayer.setStyleHelper(newVideo, 'display', 'flex');
        easyDataLayer.resetVideo(oldVideo);
        newVideo.currentTime = 0;

        setTimeout(() => {
          easyDataLayer.setAlertShow(false);
          newVideo.play();
          if (!currentVideoMuted) easyDataLayer.handleControlMuteAndUnmute(false);
        }, 150);

        if (!easyDataLayer.videoData.eventListenerAdded[easyDataLayer.videoData.videoIndex]) {
          easyDataLayer.setVideoEventListeners();
        } else {
          easyDataLayer.setProgressBarAction(true);
        }
      }, 300);
    }, 'handleEndedMedia');
  },

  setVideoSide: function (position) {
    easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector("#easy-video-commerce-nh-container");
      const span = document.querySelector("#easy-video-commerce-nh span.hello-message");

      if (!container || !span) return;

      // Helper para resetar as posições
      function unsetPositionStyles(element) {
        ['top', 'bottom', 'left', 'right'].forEach(prop => {
          easyDataLayer.setStyleHelper(element, prop, 'unset');
        });
      }

      const paddingSide = easyDataLayer.uiData.isMobile ? '8px' : '14px';

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

      const posi = position || easyDataLayer.videoData.position;
      if (!posi || !positions[posi]) return;

      easyDataLayer.videoData.position = posi;

      // Limpa estilos antigos antes de aplicar novos
      unsetPositionStyles(container);
      unsetPositionStyles(span);

      // Aplica estilos usando setStyleHelper para manter padrão do projeto
      Object.entries(positions[posi].elem).forEach(([prop, value]) => {
        easyDataLayer.setStyleHelper(container, prop, value);
      });
      Object.entries(positions[posi].span).forEach(([prop, value]) => {
        easyDataLayer.setStyleHelper(span, prop, value);
      });
    }, 'setVideoSide');
  },

  setHelloMessage: function (msg) {
    easyDataLayer.utils.executeWithLogging(() => {
      // Helper para limpar timeout
      const clear = (t) => t && clearTimeout(t);

      // Só define a mensagem se ainda não houver uma
      if (msg && !easyDataLayer.uiData.helloMessage) {
        easyDataLayer.uiData.helloMessage = msg;
      }
      const elem = document.querySelector("#easy-video-commerce-nh span.hello-message");
      if (!elem || !easyDataLayer.uiData.helloMessage || elem.style.display === 'flex') return;

      clear(easyDataLayer.uiData.helloMessageTimeInstance);

      const container = document.querySelector("#easy-video-commerce-nh-container");
      if (!container) return;
      const isMaximized = () => container.classList.contains("maximized");

      // Exibe mensagem apenas se não estiver maximizado
      if (!isMaximized()) {
        elem.innerHTML = easyDataLayer.uiData.helloMessage;
        easyDataLayer.setStyleHelper(elem, 'display', 'flex');
        easyDataLayer.setStyleHelper(elem, 'opacity', '0');

        // Animação de fade-in após display flex
        easyDataLayer.uiData.helloMessageTimeInstance = setTimeout(() => {
          if (!isMaximized()) {
            easyDataLayer.setStyleHelper(elem, 'opacity', '1');
          }

          // Timeout para fade-out após 5s
          clear(easyDataLayer.uiData.helloMessageTimeInstance);
          easyDataLayer.uiData.helloMessageTimeInstance = setTimeout(() => {
            easyDataLayer.setStyleHelper(elem, 'opacity', '0');

            // Timeout para esconder após fade-out
            clear(easyDataLayer.uiData.helloMessageTimeInstance);
            easyDataLayer.uiData.helloMessageTimeInstance = setTimeout(() => {
              easyDataLayer.setStyleHelper(elem, 'display', 'none');
            }, 300);
          }, 5000);
        }, 300);
      }
    }, "setHelloMessage");
  },

  setCustomColor: function (color) {
    easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector("#easy-video-commerce-nh-container");
      const helloMsg = document.querySelector("#easy-video-commerce-nh span.hello-message");

      if (!container || !helloMsg) return;

      // Usa setStyleHelper para manter padrão do projeto
      easyDataLayer.setStyleHelper(container, 'border-color', color);
      easyDataLayer.setStyleHelper(helloMsg, 'background-color', color);

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

      easyDataLayer.setStyleHelper(helloMsg, 'color', brightnessColor);
      easyDataLayer.setStyleHelper(helloMsg, 'border-color', brightnessColor);
    }, 'setCustomColor');
  },

  enableDraggable: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      // Evita carregar múltiplas vezes
      if (window._easyvcHammerLoaded) {
        if (typeof Hammer !== "undefined") {
          easyDataLayer.initDraggableHammer();
        }
        return;
      }
      window._easyvcHammerLoaded = true;

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js';

      script.onload = function () {
        easyDataLayer.initDraggableHammer();
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

        if (!easyDataLayer.dnd.isDragging) {
          easyDataLayer.dnd.isDragging = true;
          container.classList.add('dragging');
          if (easyDataLayer.dnd.draggingTimeInstance) {
            clearTimeout(easyDataLayer.dnd.draggingTimeInstance);
          }
        }

        const elemHeight = container.offsetHeight;
        easyDataLayer.dnd.posY = event.center.y - (elemHeight / 2);

        // Ensure posY does not move the element off-screen
        if (easyDataLayer.dnd.posY < 0) {
          easyDataLayer.dnd.posY = 0;
        }
        // For the bottom boundary
        if (easyDataLayer.dnd.posY + elemHeight > window.innerHeight) {
          easyDataLayer.dnd.posY = window.innerHeight - elemHeight;
        }

        container.style.top = easyDataLayer.dnd.posY + "px";
      }

      if (event.isFinal) {
        easyDataLayer.dnd.isDragging = false;
        easyDataLayer.dnd.draggingTimeInstance = setTimeout(() => {
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
    easyDataLayer.utils.executeWithLogging(() => {
      const supportedLanguages = ["es", "pt", "en"];
      // Usa navigator.languages (preferências do usuário) ou fallback para navigator.language/userLanguage
      const userLanguages = navigator?.languages || [navigator?.language || navigator?.userLanguage || "en"];

      // Busca o primeiro idioma suportado
      const detected = userLanguages
        .map(lang => lang.slice(0, 2))
        .find(shortLang => supportedLanguages.includes(shortLang));

      easyDataLayer.config.lang = detected || "en";
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
    await easyDataLayer.utils.executeWithLogging(async () => {
      console.log("[NuvemHub] Easy Video Commerce: starting...");

      easyDataLayer.setup();

      if (easyDataLayer.config.debug) {
        console.log("[NuvemHub] Easy Video Commerce: debug mode is enabled");
        const previousContainer = document.getElementById("easy-video-commerce-nh-container");
        const previousFade = document.getElementById("easy-video-commerce-nh-fade-desktop");
        if (previousContainer) previousContainer.remove();
        if (previousFade) previousFade.remove();
      }

      if (window._easyvcInitLoaded || document.querySelector('#easy-video-commerce-nh')) {
        console.log("[NuvemHub] Easy Video Commerce: instance already running");
        return;
      }
      window._easyvcInitLoaded = true;

      easyDataLayer.analytics.uuid = easyDataLayer.generateUUIDv4();
      easyDataLayer.sendAnalyticsEvent('init');
      easyDataLayer.checkLanguage();

      if (!easyDataLayer.utils.isValidValue(easyDataLayer.store.storeId)) {
        console.log("[NuvemHub] Easy Video Commerce: storeId is not defined");
        return;
      }

      const result = await easyDataLayer.getEasyCampaigns();

      if (!result?.campaigns || easyDataLayer.utils.isEmpty(result.campaigns)) {
        console.log("[NuvemHub] Easy Video Commerce: no campaigns found");
        return;
      }

      const split = Math.random() < 0.5;
      let campaign = result.campaigns[0];

      if (result.campaigns.length > 1 && result?.abTestId) {
        easyDataLayer.analytics.testId = result.abTestId;
        campaign = split ? result.campaigns[0] : result.campaigns[1];
      }

      easyDataLayer.analytics.campaignId = campaign._id;

      easyDataLayer.setHTML();
      easyDataLayer.observeUrlChange();

      await easyDataLayer.utils.waitForElements("#easy-video-commerce-nh video, #easy-video-commerce-nh span.hello-message");

      const videos = campaign?.["videos"];
      if (easyDataLayer.utils.isEmpty(videos)) {
        console.log("[NuvemHub] Easy Video Commerce: no videos found in the campaign");
        return;
      }

      easyDataLayer.setSource(videos);
      easyDataLayer.setVideoSide(campaign?.["position"]);
      easyDataLayer.setHelloMessage(campaign?.["helloMessage"]);
      if (result?.personalization?.color) {
        easyDataLayer.setCustomColor(result.personalization.color);
      }

      easyDataLayer.identifyWhatsappNumberOnWebsite();

      if (result?.whatsapp) {
        const numberOnly = result.whatsapp?.replace(/\D/g, '');
        easyDataLayer.store.whatsapp = numberOnly;
        easyDataLayer.setupWppEvent();
      }

      easyDataLayer.enableDraggable();
    }, 'main');
  },
};

window.easyDataLayer = easyDataLayer;

easyDataLayer.main();
