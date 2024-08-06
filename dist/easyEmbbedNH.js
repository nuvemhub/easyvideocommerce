/* global gtag */
/* global gtagNsGA4 */
/* global Hammer */
var easyDataLayer = {
  config: {
    embbedUrl: location.hostname.match("localhost") ? "http://localhost:5200" : "https://cdn.jsdelivr.net/gh/nuvemhub/easyvideocommerce@2.0.2/dist",
    apiUrl: location.hostname.match("localhost") ? "http://localhost:3002" : "https://api.nuvemhub.com.br",
    storeId: null,
    wppNumber: null,
    productId: null,
  },

  videoData: {
    position: null,
    videoIndex: 0,
    allSources: [],
    progressBarActionInstance: null,
    preloadStarted: false,
    muteTimeInstance: null,
    playNextFireTimeInstance: null,
    playNextFireCalls: 0,
    handlePreLoadingTimeInstance: null,
    handleEndedMediaTimeInstance: null,
    restartCurrentMediaTimeInstance: null,
    helloMessageTimeInstance: null,
    helloMessage: null,
    eventListenerAdded: [],
    allVideosAttachedData: [],
  },

  dnd: {
    posY: 0,
    isDragging: false,
    draggingTimeInstance: null,
  },

  analytics: {
    campaignId: null,
    testId: null,
    viewTriggered: false,
    errorTriggered: false,
  },

  setStoreId: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const script = document.currentScript;
      if (script?.src) {
        const url = new URL(document.currentScript.src);
        const storeId = url.searchParams.get('storeId');
        if (storeId) easyDataLayer.config.storeId = storeId;
      }
    }, 'setStoreId');
  },

  sendAnalyticsEvent: function (event, data) {
    easyDataLayer.utils.executeWithLogging(() => {
      if (typeof gtag === 'function') {
        if (!data) {
          gtag('event', event);
        } else {
          gtag('event', event, data);
        }
      } else if (typeof gtagNsGA4 === 'function') {
        if (!data) {
          gtagNsGA4('event', event);
        } else {
          gtagNsGA4('event', event, data);
        }
      }
    }, 'sendAnalyticsEvent');
  },

  handleMaximaze: function (isMobile) {
    easyDataLayer.utils.executeWithLogging(() => {
      const maxDesktop = () => {
        document.querySelector("#easy-video-commerce-nh-container").style.bottom = '14px';
        document.querySelector("#easy-video-commerce-nh-container").style.top = '14px';
        document.querySelector("#easy-video-commerce-nh-container").style.left = '50%';
        document.querySelector("#easy-video-commerce-nh-container").style.transform = 'translateX(-50%)';

        document.querySelector("#easy-video-commerce-nh-container").style.height = "calc(100vh - 28px)";
        document.querySelector("#easy-video-commerce-nh-container").style.width = "calc((100vh - 28px) * 0.6)";
        document.querySelector("#easy-video-commerce-nh-container #easy-video-commerce-nh").style.height = "100%";
        document.querySelector("#easy-video-commerce-nh-container #easy-video-commerce-nh").style.width = "100%";
        document.querySelector("#easy-video-commerce-nh .easy-source-container").style.borderRadius = "8px";
        document.querySelector("#easy-video-commerce-nh-fade-desktop").style.display = 'flex';

        easyDataLayer.restartCurrentMedia();
      }
      const maxMobile = () => {
        document.querySelector("#easy-video-commerce-nh-container").style.left = "0";
        document.querySelector("#easy-video-commerce-nh-container").style.bottom = "0";
        document.querySelector("#easy-video-commerce-nh-container").style.top = "0";
        document.querySelector("#easy-video-commerce-nh-container").style.height = "100%";
        document.querySelector("#easy-video-commerce-nh-container").style.width = "100%";
        document.querySelector("#easy-video-commerce-nh-container #easy-video-commerce-nh").style.height = "100%";
        document.querySelector("#easy-video-commerce-nh-container #easy-video-commerce-nh").style.width = "100%";
        document.querySelector("#easy-video-commerce-nh .easy-source-container").style.borderRadius = "0";

        easyDataLayer.addDisableZoomPageEvent();
      }

      const container = document.querySelector("#easy-video-commerce-nh-container");
      if (container.classList.contains("dragging")) return;

      easyDataLayer.checkForModals();

      easyDataLayer.handleControlMuteAndUnmute(false);

      document.querySelector("#easy-video-commerce-nh-container").style.borderWidth = '0';
      document.querySelector("#easy-video-commerce-nh-container").classList.toggle("maximized");

      document.querySelector("#easy-video-commerce-nh span.hello-message").style.display = "none";
      document.querySelector("#easy-video-commerce-nh .progress-container").style.display = "flex";

      document.querySelector("#easy-video-commerce-nh .controls").style.display = "flex";
      setTimeout(() => {
        document.querySelector("#easy-video-commerce-nh .controls .control-center .control-center-icon-container").style.display = "none";
      }, 1500);

      document.querySelector("#easy-video-commerce-nh .header-controls").style.display = "flex";
      document.querySelector("#easy-video-commerce-nh .btn-like").style.display = "flex";
      document.querySelector("#easy-video-commerce-nh .btn-comments").style.display = "flex";
      document.querySelector("#easy-video-commerce-nh .btn-wpp").style.display = "flex";
      if (easyDataLayer.config.wppNumber) {
        document.querySelector("#easy-video-commerce-nh .btn-wpp").style.opacity = "1";
        document.querySelector("#easy-video-commerce-nh .btn-wpp").style.cursor = "pointer";
      }

      const productImages = document.querySelectorAll('#easy-video-commerce-nh .product-showcase-image');
      productImages.forEach(image => image.style.display = 'flex');

      const showcase = document.querySelector('#easy-video-commerce-nh #featured-product-showcase');
      if (showcase) showcase.style.display = 'flex';


      if (isMobile) {
        maxMobile();
      } else {
        maxDesktop();
      }


      if (!easyDataLayer.analytics.viewTriggered) {
        if (easyDataLayer.analytics.testId) {
          easyDataLayer.sendAnalyticsEvent(`nhev-tab-${easyDataLayer.analytics.campaignId}-vw`);
        }
        easyDataLayer.sendAnalyticsEvent('nhev-view');
        easyDataLayer.analytics.viewTriggered = true;
      }
    }, 'handleMaximaze');
  },

  handleMinimize: function (isMobile) {
    easyDataLayer.utils.executeWithLogging(() => {
      const minDesktop = () => {
        document.querySelector("#easy-video-commerce-nh-container").style.height = "130px";
        document.querySelector("#easy-video-commerce-nh-container").style.width = "130px";
        document.querySelector("#easy-video-commerce-nh-container #easy-video-commerce-nh").style.height = "120px";
        document.querySelector("#easy-video-commerce-nh-container #easy-video-commerce-nh").style.width = "120px";
        document.querySelector("#easy-video-commerce-nh-container").style.transform = "translateX(0)";
        document.querySelector("#easy-video-commerce-nh .easy-source-container").style.borderRadius = "100%";
        document.querySelector("#easy-video-commerce-nh-fade-desktop").style.display = 'none';
      }
      const minMobile = () => {
        document.querySelector("#easy-video-commerce-nh").style.left = '14px';
        document.querySelector("#easy-video-commerce-nh").style.bottom = '14px';

        document.querySelector("#easy-video-commerce-nh-container").style.height = "110px";
        document.querySelector("#easy-video-commerce-nh-container").style.width = "110px";
        document.querySelector("#easy-video-commerce-nh").style.height = "100px";
        document.querySelector("#easy-video-commerce-nh").style.width = "100px";
        document.querySelector("#easy-video-commerce-nh .easy-source-container").style.borderRadius = "100%";

        easyDataLayer.removeDisableZoomPageEvent();
      }

      easyDataLayer.handleControlMuteAndUnmute(true);

      document.querySelector("#easy-video-commerce-nh-container").style.borderWidth = '3px';
      document.querySelector("#easy-video-commerce-nh-container").classList.toggle("maximized");

      document.querySelector("#easy-video-commerce-nh .progress-container").style.display = "none";
      document.querySelector("#easy-video-commerce-nh .controls").style.display = "none";
      document.querySelector("#easy-video-commerce-nh .header-controls").style.display = "none";
      document.querySelector("#easy-video-commerce-nh .btn-like").style.display = "none";
      document.querySelector("#easy-video-commerce-nh .btn-comments").style.display = "none";
      document.querySelector("#easy-video-commerce-nh .btn-wpp").style.display = "none";

      const productImages = document.querySelectorAll('#easy-video-commerce-nh .product-showcase-image');
      productImages.forEach(image => image.style.display = 'none');

      const showcase = document.querySelector('#easy-video-commerce-nh #featured-product-showcase');
      if (showcase) showcase.style.display = 'none';

      if (isMobile) {
        minMobile();
      } else {
        minDesktop();
      }

      easyDataLayer.setVideoSide();
    }, 'handleMinimize');
  },

  handleContainerHover: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector("#easy-video-commerce-nh-container");
      container.addEventListener('mouseenter', () => {
        const maximized = container.classList.contains("maximized");
        if (!maximized) {
          easyDataLayer.setHelloMessage(null);
        }
      });
    }, 'handleContainerHover');
  },

  setHTML: function () {
    const handleControlLeft = () => easyDataLayer.checkCurrentMediaAndPlayNext(false);

    const handleControlRight = () => easyDataLayer.checkCurrentMediaAndPlayNext(true);

    fetch(`${easyDataLayer.config.embbedUrl}/easyScope.html`)
      .then(response => response.text())
      .then(data => {
        const isMobile = window.innerWidth < 768;
        // Fade
        var fadeDesktop = document.createElement('div');

        fadeDesktop.id = 'easy-video-commerce-nh-fade-desktop';
        fadeDesktop.className = 'easy-video-commerce-nh-fade-desktop';

        fadeDesktop.style.display = 'none';
        fadeDesktop.style.position = 'fixed';
        fadeDesktop.style.top = '0';
        fadeDesktop.style.left = '0';
        fadeDesktop.style.width = '100%';
        fadeDesktop.style.height = '100%';
        fadeDesktop.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        fadeDesktop.style.zIndex = '9999999';

        document.body.appendChild(fadeDesktop);
        // Container
        var container = document.createElement('div');

        container.id = 'easy-video-commerce-nh-container';
        container.className = 'easy-video-commerce-nh-container';

        container.style.display = 'none';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.width = isMobile ? '110px' : '130px';
        container.style.height = isMobile ? '110px' : '130px';
        container.style.position = 'fixed';
        container.style.cursor = 'pointer';
        container.style.zIndex = '99999999';
        container.style.border = '3px solid #000';
        container.style.borderRadius = '100%';
        container.style.boxSizing = 'border-box';
        container.style.transition = 'top 0.1s';

        // Easy Container
        var div = document.createElement('div');

        div.id = 'easy-video-commerce-nh';
        div.className = 'easy-video-commerce-nh';

        div.style.display = 'flex';
        div.style.width = isMobile ? '100px' : '120px';
        div.style.height = isMobile ? '100px' : '120px';

        div.innerHTML = data;
        container.appendChild(div);

        document.body.appendChild(container);

        let style = document.createElement('style');
        style.innerHTML = `
          #easy-video-commerce-nh button {
            outline: none;
            border: 0;
            margin: 0;
            padding: 0;
            cursor: pointer;
            background-color: transparent;
          }

          #easy-video-commerce-nh button:focus {
            opacity: 1;
          }

          #easy-video-commerce-nh,
          #easy-video-commerce-nh button,
          #easy-video-commerce-nh div,
          #easy-video-commerce-nh a {
            -webkit-tap-highlight-color: transparent;
            outline: none;
          }

          #easy-video-commerce-nh button,
          #easy-video-commerce-nh a,
          #easy-video-commerce-nh p,
          #easy-video-commerce-nh h1,
          #easy-video-commerce-nh h2,
          #easy-video-commerce-nh h3,
          #easy-video-commerce-nh h4,
          #easy-video-commerce-nh h5,
          #easy-video-commerce-nh h6,
          #easy-video-commerce-nh span,
          #easy-video-commerce-nh div,
          #easy-video-commerce-nh input,
          #easy-video-commerce-nh textarea,
          #easy-video-commerce-nh select,
          #easy-video-commerce-nh option,
          #easy-video-commerce-nh label {
            font-family: sans-serif;
            margin: 0;
          }

          #easy-video-commerce-nh button:hover, 
          #easy-video-commerce-nh button:focus {
            border: 0;
            outline: none;
          }

          #easy-video-commerce-nh a:hover, 
          #easy-video-commerce-nh a:focus {
            border: 0;
            outline: none;
          }
        `;
        document.head.appendChild(style);

        document.querySelector("#easy-video-commerce-nh .easy-source-container").addEventListener("click", () => easyDataLayer.handleMaximaze(isMobile));
        document.querySelector("#easy-video-commerce-nh .header-controls .btn-restart").addEventListener("click", () => easyDataLayer.restartCurrentMedia());
        document.querySelector("#easy-video-commerce-nh .header-controls .btn-pause").addEventListener("click", () => easyDataLayer.handlePlayPauseMedia());
        document.querySelector("#easy-video-commerce-nh .header-controls .btn-play").addEventListener("click", () => easyDataLayer.handlePlayPauseMedia());
        document.querySelector("#easy-video-commerce-nh .header-controls .btn-close").addEventListener("click", () => easyDataLayer.handleMinimize(isMobile));
        if (!isMobile) {
          document.querySelector("#easy-video-commerce-nh-fade-desktop").addEventListener("click", () => easyDataLayer.handleMinimize(false));
        }
        document.querySelector("#easy-video-commerce-nh .controls .control-left").addEventListener("click", handleControlLeft);
        document.querySelector("#easy-video-commerce-nh .controls .control-right").addEventListener("click", handleControlRight);
        document.querySelector("#easy-video-commerce-nh .controls .control-center").addEventListener("click", easyDataLayer.handleControlMuteAndUnmute);

        document.querySelector("#easy-video-commerce-nh .extra-control .btn-like").addEventListener("click", easyDataLayer.handleLike);
        document.querySelector("#easy-video-commerce-nh .extra-control .btn-comments").addEventListener("click", easyDataLayer.handleModalComments);
        document.querySelector("#easy-video-commerce-nh #comments-container .overlay").addEventListener("click", easyDataLayer.handleModalComments);
        document.querySelector("#easy-video-commerce-nh #comments-container .comments-btn-close").addEventListener("click", easyDataLayer.handleModalComments);
        document.querySelector("#easy-video-commerce-nh #comments-container .submit-comment").addEventListener("click", easyDataLayer.handleComment);

        easyDataLayer.handleContainerHover();

        if (easyDataLayer.analytics.testId) {
          easyDataLayer.sendAnalyticsEvent(`nhev-tab-${easyDataLayer.analytics.campaignId}-sw`);
        }
        easyDataLayer.sendAnalyticsEvent('nhev-showed');
      })
      .catch((error) => {
        console.error("[NuvemHub] Easy Video Commerce: setHTML", error);
      });
  },

  handleLike: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      // event
      if (easyDataLayer.analytics.testId) {
        easyDataLayer.sendAnalyticsEvent(`nhev-tab-${easyDataLayer.analytics.campaignId}-lk`);
      }
      easyDataLayer.sendAnalyticsEvent('nhev-like');

      // animation
      const likeSvgD = document.querySelector("#easy-video-commerce-nh .extra-control .btn-like .like-icon-disabled");
      const likeSvgE = document.querySelector("#easy-video-commerce-nh .extra-control .btn-like .like-icon-enabled");
      const likeBtn = document.querySelector("#easy-video-commerce-nh .extra-control .btn-like");

      if (likeSvgD && likeSvgE && likeBtn) {
        if (likeSvgD.style.display === "none") return;

        likeSvgD.style.display = "none";
        likeSvgE.style.display = "flex";
        likeBtn.style.pointerEvents = "none";
        likeBtn.style.transform = "scale(1.2)";
        setTimeout(() => {
          likeBtn.style.transform = "scale(1)";
        }, 300);
      }
    }, 'handleLike');
  },

  handleComment: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const comment = document.querySelector("#easy-video-commerce-nh #comments-container textarea");
      const btnCommentSubmit = document.querySelector("#easy-video-commerce-nh #comments-container .submit-comment");
      const btnCommentClose = document.querySelector("#easy-video-commerce-nh #comments-container .comments-btn-close");

      if (comment?.value) {
        if (easyDataLayer.analytics.testId) {
          easyDataLayer.sendAnalyticsEvent(`nhev-tab-${easyDataLayer.analytics.campaignId}-cm`, {
            'data': JSON.stringify({
              comment: comment.value
            })
          });
        }
        easyDataLayer.sendAnalyticsEvent('nhev-comment', {
          'data': JSON.stringify({
            comment: comment.value
          })
        });
      }

      if (comment && btnCommentSubmit) {
        comment.disabled = true;

        // Success message
        btnCommentSubmit.style.pointerEvents = "none";
        btnCommentClose.style.pointerEvents = "none";
        btnCommentSubmit.textContent = "Enviado!";
        btnCommentSubmit.style.backgroundColor = "#38b000";
        btnCommentSubmit.style.color = "white";
        btnCommentSubmit.transition = "background-color 0.5s";
      }

      setTimeout(() => {
        easyDataLayer.handleModalComments();

        if (comment && btnCommentSubmit) {
          comment.disabled = false;
          comment.value = '';

          btnCommentSubmit.style.pointerEvents = "all";
          btnCommentClose.style.pointerEvents = "all";
          btnCommentSubmit.textContent = "Enviar";
          btnCommentSubmit.style.backgroundColor = "#edf2f7";
          btnCommentSubmit.style.color = "black";
        }
      }, 1500);
    }, 'handleComment');
  },

  setWppEvent: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      if (easyDataLayer.config.wppNumber) {
        document.querySelector("#easy-video-commerce-nh .extra-control .btn-wpp").addEventListener("click", easyDataLayer.handleWppContact);
      } else {
        document.querySelector("#easy-video-commerce-nh .extra-control .btn-wpp").style.display = "none";
      }
    }, 'setWppEvent');
  },

  handleWppContact: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      if (easyDataLayer.analytics.testId) {
        easyDataLayer.sendAnalyticsEvent(`nhev-tab-${easyDataLayer.analytics.campaignId}-wp`);
      }
      easyDataLayer.sendAnalyticsEvent('nhev-wpp');

      window.open(
        `https://wa.me/${easyDataLayer.config.wppNumber}?text=${encodeURIComponent("Olá, vi um vídeo no site e gostaria de mais informações!")}`,
        '_blank'
      );
    }, 'handleWppContact');
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

      if (video) {
        if (forceMute !== null && (forceMute === true || forceMute === false)) {
          video.muted = forceMute;
        } else {
          video.muted = !video.muted;
        }

        const unmuteIcon = document.querySelector("#easy-video-commerce-nh .controls .control-center .unmute-icon");
        const muteIcon = document.querySelector("#easy-video-commerce-nh .controls .control-center .mute-icon");
        const iconContainer = document.querySelector("#easy-video-commerce-nh .controls .control-center .control-center-icon-container");

        unmuteIcon.style.display = video.muted ? "none" : "flex";
        muteIcon.style.display = video.muted ? "flex" : "none";

        iconContainer.style.display = "flex";
        if (easyDataLayer.videoData.muteTimeInstance) clearTimeout(easyDataLayer.videoData.muteTimeInstance);
        easyDataLayer.videoData.muteTimeInstance = setTimeout(() => {
          iconContainer.style.display = "none";
        }, 1500);
      }
    }, 'handleControlMuteAndUnmute');
  },

  handleModalComments: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector('#easy-video-commerce-nh #comments-container')
      const wrapper = document.querySelector('#easy-video-commerce-nh #comments-container .wrapper')

      if (wrapper.style.bottom === '0px' || wrapper.style.bottom === '0%' || wrapper.style.bottom === '0') {
        wrapper.style.bottom = '-100%';
        container.style.display = 'none';
      } else {
        container.style.display = 'flex';
        wrapper.style.bottom = '0';
      }
    }, 'handleModalComments');
  },

  checkCurrentMediaAndPlayNext: function (forward) {
    easyDataLayer.utils.executeWithLogging(() => {
      easyDataLayer.videoData.playNextFireCalls += (forward ? 1 : -1);

      if (easyDataLayer.videoData.playNextFireTimeInstance) {
        clearTimeout(easyDataLayer.videoData.playNextFireTimeInstance);
      }

      easyDataLayer.videoData.playNextFireTimeInstance = setTimeout(() => {
        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const { videoIndex, playNextFireCalls, allSources } = easyDataLayer.videoData;
        const calculatedIndex = videoIndex + playNextFireCalls;
        const lastIndex = allSources.length - 1;

        const nextIndex = calculatedIndex >= allSources.length ? lastIndex : calculatedIndex < 0 ? 0 : calculatedIndex;

        easyDataLayer.videoData.playNextFireCalls = 0;

        if (videoIndex === nextIndex || nextIndex < 0 || nextIndex >= allSources.length) {
          easyDataLayer.restartCurrentMedia();
          return;
        }

        const nextVid = videos?.[nextIndex];
        const oldVideo = videos?.[videoIndex];
        oldVideo.pause();
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
        nextVid.style.display = 'flex';
        easyDataLayer.resetVideo(oldVideo);
        easyDataLayer.setProductsToShow();
        if (mustSetProgressBarAction) easyDataLayer.setProgressBarAction(forward);
        setTimeout(() => {
          nextVid.play();
          if (!currentVideoMuted) easyDataLayer.handleControlMuteAndUnmute(false);
        }, 150);
      }, 300);
    }, 'checkCurrentMediaAndPlayNext');
  },

  resetVideo: function (video) {
    easyDataLayer.utils.executeWithLogging(() => {
      video.style.display = 'none';
      video.currentTime = 0;
      video.pause();
      video.muted = true;
    }, 'resetVideo');
  },

  observeUrlChange: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      let oldHref = document.location.pathname;
      const body = document.querySelector("body");

      const observer = new MutationObserver(() => {
        if (oldHref !== document.location.pathname) {
          oldHref = document.location.pathname;

          const container = document.getElementById('easy-video-commerce-nh-container');
          const fadeDesktop = document.getElementById('easy-video-commerce-nh-fade-desktop');
          if (container && fadeDesktop) {
            container.parentNode.removeChild(container);
            fadeDesktop.parentNode.removeChild(fadeDesktop);
          }
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

  getEasyCampaigns: function (template, categorieId, productId) {
    return new Promise((resolve) => {
      const params = [
        template ? `pagePath=${template}` : null,
        categorieId ? `categorieId=${categorieId}` : null,
        productId ? `productId=${productId}` : null
      ].filter(Boolean).join('&');

      fetch(`${easyDataLayer.config.apiUrl}/easyvideocommerce/campaign/buffer/${easyDataLayer.config.storeId}?${params}`)
        .then(function (result) { return result.json() })
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
        if (container) {
          container.style.display = value;
        }
      }

      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[easyDataLayer.videoData.videoIndex];
      easyDataLayer.videoData.eventListenerAdded[easyDataLayer.videoData.videoIndex] = true;
      easyDataLayer.setLoadingVideo(true);
      video.muted = true;

      video.addEventListener('loadeddata', () => {
        console.log("[NuvemHub] Easy Video Commerce: video loaded");

        easyDataLayer.setLoadingVideo(false);
        enableEasyContainer('flex');
        easyDataLayer.setHTMLProgressBars();
        easyDataLayer.setProgressBarAction(true);
        easyDataLayer.setProductsToShow();
        easyDataLayer.setResponsiveStyle();
        video.play();
      });

      video.addEventListener('error', () => {
        console.log("[NuvemHub] Easy Video Commerce: video error, trying again...");
        if (!easyDataLayer.analytics.errorTriggered) {
          if (easyDataLayer.analytics.testId) {
            easyDataLayer.sendAnalyticsEvent(`nhev-tab-${easyDataLayer.analytics.campaignId}-le`);
          }
          easyDataLayer.sendAnalyticsEvent('nhev-loaderror');

          easyDataLayer.analytics.errorTriggered = true;

          enableEasyContainer('none');
          video.src = easyDataLayer.videoData.allSources[easyDataLayer.videoData.videoIndex];
          video.load();
        }
      });

      video.addEventListener('ended', () => {
        console.log("[NuvemHub] Easy Video Commerce: video ended");
        const maximized = document.querySelector("#easy-video-commerce-nh-container").classList.contains("maximized");
        if (maximized) {
          easyDataLayer.handleEndedMedia();
        } else {
          video.currentTime = 0;
          video.muted = true;
          video.play();
        }
      });

      video.load();
    }, 'setVideoEventListeners');
  },

  setLoadingVideo: function (show) {
    easyDataLayer.utils.executeWithLogging(() => {
      const loading = document.querySelector('#easy-video-commerce-nh #loading');
      if (show) {
        loading.style.display = 'flex';
      } else {
        loading.style.display = 'none';
      }
    }, 'setLoadingVideo');
  },

  setHTMLProgressBars: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      if (document.querySelector('#easy-video-commerce-nh .progress-bar-item')) return;

      easyDataLayer.videoData.allSources.forEach((_, index) => {
        const progressBar = document.createElement('div');
        progressBar.classList.add('progress-bar-item');
        progressBar.id = `progress-bar-${index + 1}`;

        progressBar.style.height = '4px';
        progressBar.style.width = '100%';
        progressBar.style.backgroundColor = 'rgba(255, 255, 255, .35)';
        progressBar.style.borderRadius = '2px';

        const progress = document.createElement('div');
        progress.style.height = '100%';
        progress.style.backgroundColor = 'rgb(255, 255, 255)';
        progress.style.transition = 'bottom 1s';
        progress.style.width = '0%';

        progressBar.appendChild(progress);
        document.querySelector('#easy-video-commerce-nh .progress-container').appendChild(progressBar);
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
      }

      const allBars = document.querySelectorAll('#easy-video-commerce-nh .progress-bar-item > div');

      for (let i = 0; i < easyDataLayer.videoData.videoIndex; i++) {
        const bar = allBars[i];
        bar.style.width = '100%';
      }

      for (let i = (easyDataLayer.videoData.videoIndex + 1); i < easyDataLayer.videoData.allSources.length; i++) {
        const bar = allBars[i];
        bar.style.width = '0%';
      }

      const bar = document.querySelector(`#progress-bar-${easyDataLayer.videoData.videoIndex + 1} > div`);

      const videos = document.querySelectorAll('#easy-video-commerce-nh video');
      const video = videos[easyDataLayer.videoData.videoIndex];
      const nextVideo = videos?.[easyDataLayer.videoData.videoIndex + (forward ? 1 : -1)];

      if (easyDataLayer.videoData.removeEventListenerProgressBarAction) {
        easyDataLayer.videoData.removeEventListenerProgressBarAction();
      }

      easyDataLayer.videoData.preloadStarted = false;
      easyDataLayer.videoData.removeEventListenerProgressBarAction = addVideoEventListener(video, 'timeupdate', () => {
        const percent = (video.currentTime / video.duration) * 100;
        bar.style.width = `${percent}%`;

        if (video.currentTime / video.duration > 0.60 && !easyDataLayer.videoData.preloadStarted) {
          if (!nextVideo) easyDataLayer.handlePreLoadingPlaybackMedia();
          easyDataLayer.videoData.preloadStarted = true;
        }
      });
    }, 'setProgressBarAction');
  },

  setProductsToShow: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const isMobile = window.innerWidth < 768;

      // Remove
      const productImages = document.querySelectorAll('#easy-video-commerce-nh .product-showcase-image');
      if (Array.from(productImages).length > 0) productImages.forEach(image => image.remove());

      const fprod = document.querySelector('#easy-video-commerce-nh #featured-product-showcase');
      if (fprod) fprod.remove();

      // Add
      const products = easyDataLayer.videoData.allVideosAttachedData[easyDataLayer.videoData.videoIndex]?.products;
      const maximized = document.querySelector("#easy-video-commerce-nh-container").classList.contains("maximized");
      if (products) {
        // Featured product
        const featuredProduct = products.find(product => product.isFeatured);
        if (featuredProduct) {
          const easyContainer = document.querySelector('#easy-video-commerce-nh');

          const container = document.createElement('button');
          container.id = 'featured-product-showcase';
          container.onclick = () => {
            if (easyDataLayer.config.productId !== featuredProduct.id) {
              window.open(featuredProduct.link, '_self');
            } else {
              const isMobile = window.innerWidth < 768;
              easyDataLayer.handleMinimize(isMobile);
            }
          };

          container.style.position = 'absolute';
          container.style.bottom = isMobile ? '3vh' : '2vh';
          container.style.left = '14px';
          container.style.width = 'calc(80% - 14px)';
          container.style.height = isMobile ? '20vw' : '80px';
          container.style.boxShadow = '4px 4px 8px rgba(0, 0, 0, 0.2)';
          container.style.display = maximized ? 'flex' : 'none';

          const image = document.createElement('img');
          image.src = featuredProduct?.imageSrc;
          image.style.width = isMobile ? '20vw' : '80px';
          image.style.height = isMobile ? '20vw' : '80px';
          image.style.objectFit = 'cover';
          image.style.borderTopLeftRadius = '8px';
          image.style.borderBottomLeftRadius = '8px';
          image.style.backgroundColor = '#fff';
          container.appendChild(image);

          const flex = document.createElement('div');
          flex.style.display = 'flex';
          flex.style.flexDirection = 'column';
          flex.style.justifyContent = 'center';
          flex.style.backgroundColor = 'rgba(255,255,255,0.2)';
          flex.style.width = isMobile ? 'calc(100% - 20vw)' : 'calc(100% - 80px)';
          flex.style.height = '100%';
          flex.style.paddingLeft = '16px';
          flex.style.paddingRight = '16px';
          flex.style.borderTopRightRadius = '8px';
          flex.style.borderBottomRightRadius = '8px';
          container.appendChild(flex);

          const heading = document.createElement('h2');
          heading.textContent = featuredProduct.name;
          heading.style.color = 'white';
          heading.style.fontSize = isMobile ? '4.6vw' : '16px';
          heading.style.whiteSpace = 'nowrap';
          heading.style.overflow = 'hidden';
          heading.style.textOverflow = 'ellipsis';
          heading.style.fontWeight = 'bold';
          heading.style.textAlign = 'left';
          flex.appendChild(heading);

          const text = document.createElement('p');
          text.textContent = featuredProduct.price;
          text.style.color = 'white';
          text.style.fontSize = isMobile ? '4vw' : '14px';
          text.style.marginTop = isMobile ? '-0.5vw' : '-2px';
          text.style.whiteSpace = 'nowrap';
          text.style.overflow = 'hidden';
          text.style.textOverflow = 'ellipsis';
          text.style.textAlign = 'left';
          flex.appendChild(text);

          easyContainer.appendChild(container);
        }

        let indexProduct = 0;
        products.forEach((product) => {
          if (product.isFeatured) return;

          const container = document.querySelector('#easy-video-commerce-nh');

          const productImageBtn = document.createElement('button');
          productImageBtn.classList.add('product-showcase-image');
          productImageBtn.classList.add(`image-${indexProduct + 1}`);
          productImageBtn.onclick = () => {
            if (easyDataLayer.config.productId !== product.id) {
              window.open(product.link, '_self');
            } else {
              const isMobile = window.innerWidth < 768;
              easyDataLayer.handleMinimize(isMobile);
            }
          };

          productImageBtn.style.display = maximized ? 'flex' : 'none';
          productImageBtn.style.width = isMobile ? '20vw' : '80px';
          productImageBtn.style.height = isMobile ? '20vw' : '80px';
          productImageBtn.style.position = 'absolute';
          productImageBtn.style.left = '14px';
          productImageBtn.style.bottom = isMobile ? `calc(${indexProduct * 20}vw + ${indexProduct * 8}px + ${featuredProduct ? '3vh + 20vw + 8px' : '3vh'})` : `calc(${indexProduct * 80}px + ${indexProduct * 8}px + ${featuredProduct ? '2vh + 80px + 8px' : '2vh'})`;
          productImageBtn.style.transition = '';

          const productImage = document.createElement('img');

          productImage.src = product.imageSrc;
          productImage.alt = product.name;
          productImage.style.width = isMobile ? '20vw' : '80px';
          productImage.style.height = isMobile ? '20vw' : '80px';
          productImage.style.objectFit = 'cover';
          productImage.style.borderRadius = '8px';
          productImage.style.backgroundColor = '#fff';

          productImageBtn.appendChild(productImage);
          container.appendChild(productImageBtn);

          indexProduct++;
        });
      }
    }, 'setProductsToShow');
  },

  setResponsiveStyle: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const isMobile = window.innerWidth < 768;
      const shortHeight = window.innerHeight < 700;

      const centerControl = document.querySelector('#easy-video-commerce-nh .controls .control-center .control-center-icon-container');
      const centerControlCheckValue = isMobile ? '4vh' : '0';
      if (centerControl?.style?.marginBottom !== centerControlCheckValue) {
        const extraControlsDiv = document.querySelector('#easy-video-commerce-nh .extra-control');
        extraControlsDiv.style.bottom = isMobile ? 'calc(3vh + 60px)' : 'calc(2vh + 60px)';

        const leftArrow = document.querySelector('#easy-video-commerce-nh .controls .control-left svg');
        const rightArrow = document.querySelector('#easy-video-commerce-nh .controls .control-right svg');
        if (shortHeight) {
          leftArrow.style.marginBottom = isMobile ? '10vh' : '0';
          centerControl.style.marginBottom = isMobile ? '10vh' : '0';
          rightArrow.style.marginBottom = isMobile ? '10vh' : '0';
        } else {
          leftArrow.style.marginBottom = isMobile ? '5vh' : '0';
          centerControl.style.marginBottom = isMobile ? '5vh' : '0';
          rightArrow.style.marginBottom = isMobile ? '5vh' : '0';
        }

        const wppSpan = document.querySelector('#easy-video-commerce-nh .extra-control .btn-wpp span');
        wppSpan.style.fontSize = isMobile ? '3.2vw' : '14px';
      }
    }, 'setResponsiveStyle');
  },

  handlePreLoadingPlaybackMedia: function (videoIndex) {
    easyDataLayer.utils.executeWithLogging(() => {
      if (easyDataLayer.videoData.handlePreLoadingTimeInstance) {
        clearTimeout(easyDataLayer.videoData.handlePreLoadingTimeInstance);
      }

      easyDataLayer.videoData.handlePreLoadingTimeInstance = setTimeout(() => {
        const nextIndex = videoIndex || easyDataLayer.videoData.videoIndex + 1;

        if (nextIndex >= easyDataLayer.videoData.allSources.length) return;

        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const videoContainer = document.querySelector("#easy-video-commerce-nh .easy-source-container");

        for (let i = 0; i <= nextIndex; i++) {
          let video = videos[i];

          // If the video doesn't exist, create it
          if (!video) {
            video = document.createElement('video');

            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
            video.style.position = 'absolute';
            video.style.top = '0';
            video.style.left = '0';
            video.style.display = 'none';

            video.muted = true;
            video.disablePictureInPicture = true;
            video.playsInline = true;
            video.autoplay = true;
            videoContainer.appendChild(video);
          }

          // If we're at the next index, set the source and load the video
          if (i === nextIndex) {
            video.src = easyDataLayer.videoData.allSources[nextIndex];
            video.load();
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

      if (video?.paused) {
        video.play();
        if (btnPause) btnPause.style.display = 'flex';
        if (btnPlay) btnPlay.style.display = 'none';
      } else {
        video.pause();
        if (btnPause) btnPause.style.display = 'none';
        if (btnPlay) btnPlay.style.display = 'flex';
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
        video.currentTime = 0;
        video.play();

        const btnPause = document.querySelector('#easy-video-commerce-nh .header-controls .btn-pause');
        const btnPlay = document.querySelector('#easy-video-commerce-nh .header-controls .btn-play');

        if (btnPause) btnPause.style.display = 'flex';
        if (btnPlay) btnPlay.style.display = 'none';
      }, 300);
    }, 'restartCurrentMedia');
  },

  handleEndedMedia: function (videoIndex) {
    easyDataLayer.utils.executeWithLogging(() => {
      if (easyDataLayer.videoData.handleEndedMediaTimeInstance) {
        clearTimeout(easyDataLayer.videoData.handleEndedMediaTimeInstance);
      }

      easyDataLayer.videoData.handleEndedMediaTimeInstance = setTimeout(() => {
        const nextIndex = videoIndex || easyDataLayer.videoData.videoIndex + 1;

        if (nextIndex >= easyDataLayer.videoData.allSources.length) {
          easyDataLayer.restartCurrentMedia();
          return;
        }

        const videos = document.querySelectorAll('#easy-video-commerce-nh video');
        const newVideo = videos?.[nextIndex];
        const oldVideo = videos[easyDataLayer.videoData.videoIndex];
        const currentVideoMuted = easyDataLayer.checkCurrentVideoMuted();

        // already appears
        if (!newVideo || newVideo?.style?.display === 'flex') return;

        easyDataLayer.videoData.videoIndex = nextIndex;
        newVideo.style.display = 'flex';
        easyDataLayer.resetVideo(oldVideo);
        newVideo.currentTime = 0;
        easyDataLayer.setProductsToShow();
        setTimeout(() => {
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

      function applyPositionStyleUnset(element) {
        element.style.top = 'unset';
        element.style.bottom = 'unset';
        element.style.left = 'unset';
        element.style.right = 'unset';
      }

      const isMobile = window.innerWidth < 768;
      const paddingSide = isMobile ? '8px' : '14px';

      const positions = {
        "left-top": { elem: { left: paddingSide, top: "5%" }, span: { top: "60px", left: "100px" } },
        "left-middle-top": { elem: { left: paddingSide, top: "20%" }, span: { top: "2px", left: "90px" } },
        "left-middle": { elem: { left: paddingSide, top: "calc(50% - 60px)" }, span: { top: "2px", left: "90px" } },
        "left-middle-bottom": { elem: { left: paddingSide, bottom: "20%" }, span: { top: "2px", left: "90px" } },
        "left-bottom": { elem: { left: paddingSide, bottom: "5%" }, span: { top: "2px", left: "90px" } },
        "right-top": { elem: { right: paddingSide, top: "5%" }, span: { top: "60px", right: "100px" } },
        "right-middle-top": { elem: { right: paddingSide, top: "20%" }, span: { top: "2px", right: "90px" } },
        "right-middle": { elem: { right: paddingSide, top: "calc(50% - 60px)" }, span: { top: "2px", right: "90px" } },
        "right-middle-bottom": { elem: { right: paddingSide, bottom: "20%" }, span: { top: "2px", right: "90px" } },
        "right-bottom": { elem: { right: paddingSide, bottom: "5%" }, span: { top: "2px", right: "90px" } },
      };

      if (container && span && (position || easyDataLayer.videoData.position)) {
        const posi = position || easyDataLayer.videoData.position;
        easyDataLayer.videoData.position = posi;

        if (positions?.[posi]) {
          applyPositionStyleUnset(container);
          applyPositionStyleUnset(span);
          Object.assign(container.style, positions[posi].elem);
          Object.assign(span.style, positions[posi].span);
        }
      }
    }, 'setVideoSide');
  },

  setHelloMessage: function (msg) {
    easyDataLayer.utils.executeWithLogging(() => {
      const cleanTimeout = (timeT) => {
        if (timeT) {
          clearTimeout(timeT);
        }
      };

      if (msg && !easyDataLayer.videoData.helloMessage) {
        easyDataLayer.videoData.helloMessage = msg;
      }

      const elem = document.querySelector("#easy-video-commerce-nh span.hello-message");

      cleanTimeout(easyDataLayer.videoData.helloMessageTimeInstance);

      if (elem && easyDataLayer.videoData.helloMessage) {
        elem.innerHTML = easyDataLayer.videoData.helloMessage;
        elem.style.display = "flex";

        easyDataLayer.videoData.helloMessageTimeInstance = setTimeout(() => {
          if (elem) {
            elem.style.opacity = 1;
            cleanTimeout(easyDataLayer.videoData.helloMessageTimeInstance);

            easyDataLayer.videoData.helloMessageTimeInstance = setTimeout(() => {
              if (elem) {
                elem.style.opacity = 0;
                cleanTimeout(easyDataLayer.videoData.helloMessageTimeInstance);

                easyDataLayer.videoData.helloMessageTimeInstance = setTimeout(() => {
                  elem.style.display = "none";
                }, 500);
              }
            }, 5000);
          }
        }, 300);
      }
    }, 'setHelloMessage');
  },

  setCustomColor: function (color) {
    easyDataLayer.utils.executeWithLogging(() => {
      const container = document.querySelector("#easy-video-commerce-nh-container");
      const helloMsg = document.querySelector("#easy-video-commerce-nh span.hello-message");

      if (container && helloMsg) {
        container.style.borderColor = color;
        helloMsg.style.backgroundColor = color;

        // Helper function to parse color
        const parseColor = (color) => {
          let r, g, b;
          if (color.charAt(0) === '#') {
            const rgb = color.substring(1, 7);
            r = parseInt(rgb.substring(0, 2), 16);
            g = parseInt(rgb.substring(2, 4), 16);
            b = parseInt(rgb.substring(4, 6), 16);
          } else {
            const rgb = color.match(/\d+/g);
            r = parseInt(rgb[0]);
            g = parseInt(rgb[1]);
            b = parseInt(rgb[2]);
          }
          return { r, g, b };
        };

        // Parse the color
        const { r, g, b } = parseColor(color);

        // Calculate the brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Set the text color based on the brightness
        const brightnessColor = brightness > 128 ? 'black' : 'white';
        helloMsg.style.color = brightnessColor;
        helloMsg.style.borderColor = brightnessColor;
      }
    }, 'setCustomColor');
  },

  enableDraggable: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js';

      script.onload = function () {
        const container = document.querySelector('.easy-video-commerce-nh-container');
        if (container) {
          const hammer = new Hammer(container);

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
                easyDataLayer.checkForModals();
              }, 400);
            }
          });
        }
      };

      document.body.appendChild(script);
    }, 'enableDraggable');
  },

  checkForModals: function () {
    easyDataLayer.utils.executeWithLogging(() => {
      const allElements = document.querySelectorAll('*');

      let biggerIndex = null
      Array.from(allElements).forEach(el => {
        const id = el.id;
        if (id === 'easy-video-commerce-nh-container' || id === 'easy-video-commerce-nh-fade-desktop') return;

        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex, 10);
        const display = style.display;
        const opacity = parseFloat(style.opacity);

        if (
          !isNaN(zIndex) &&
          zIndex > 10000 &&
          display !== 'none' &&
          opacity > 0 &&
          (!biggerIndex || zIndex > biggerIndex)
        ) {
          biggerIndex = zIndex;
        }
      });

      const container = document.querySelector('#easy-video-commerce-nh-container');
      const fadeDesktop = document.querySelector('#easy-video-commerce-nh-fade-desktop');

      if (biggerIndex) {
        container.style.zIndex = biggerIndex - 10;
        fadeDesktop.style.zIndex = biggerIndex - 100;
      }
      if (!biggerIndex && container.style.zIndex !== '99999999') {
        container.style.zIndex = 99999999;
        fadeDesktop.style.zIndex = 9999999;
      }
    }, 'checkForModals');
  },

  utils: {
    executeWithLogging: function (fn, message) {
      try {
        return fn();
      } catch (error) {
        console.error(`[NuvemHub] Easy Video Commerce: ${message}`, error);
      }
    },
    isValidValue: function (value) {
      return value !== undefined && value !== null && value !== '' && value !== 'null';
    },
    isEmpty: function (array) {
      if (!array) return true;
      return Array.isArray(array) && array?.length === 0;
    },
    waitForElements: function (selector) {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          const elements = document.querySelectorAll(selector);
          if (elements?.length > 0) {
            clearInterval(interval);
            resolve(elements);
          }
        }, 100);
      });
    }
  },

  main: async function () {
    easyDataLayer.utils.executeWithLogging(async () => {
      if (document.querySelector('#easy-video-commerce-nh')) return;

      console.log("[NuvemHub] Easy Video Commerce: starting...");
      easyDataLayer.setStoreId();

      const mock = ["localhost", "nuvemhub.vercel.app", "nuvemhub.com.br"].some(hostname => location.hostname.includes(hostname));
      if (mock) {
        window.LS = {
          template: "home",
        }
      }

      if (!window?.LS || !easyDataLayer.utils.isValidValue(easyDataLayer.config?.storeId)) return;

      const template = window.LS?.template ? window.LS?.template : null;
      const categorieId = window.LS?.category?.id ? window.LS?.category?.id : null;
      const productId = window.LS?.product?.id ? window.LS?.product?.id : null;
      easyDataLayer.config.productId = productId;

      const result = await easyDataLayer.getEasyCampaigns(template, categorieId, productId);

      if (!result?._id) return;

      easyDataLayer.analytics.campaignId = result._id;

      if (result?.tests?.[0]) {
        easyDataLayer.analytics.testId = result.tests[0];
      }

      easyDataLayer.setHTML();
      easyDataLayer.observeUrlChange();

      await easyDataLayer.utils.waitForElements("#easy-video-commerce-nh video, #easy-video-commerce-nh span.hello-message");
      const videos = result?.["videos"];
      if (easyDataLayer.utils.isEmpty(videos)) return;

      easyDataLayer.setSource(videos);
      easyDataLayer.setVideoSide(result?.["position"]);
      easyDataLayer.setHelloMessage(result?.["helloMessage"]);
      if (result?.store?.apps?.length > 0) {
        const app = result.store.apps.find(app => app.name === "easyvideocommerce");
        if (app?.personalization?.color) {
          easyDataLayer.setCustomColor(app.personalization.color);
        }
      }
      if (result?.store?.whatsappNumber) {
        easyDataLayer.config.wppNumber = result.store.whatsappNumber;
        easyDataLayer.setWppEvent();
      }
      easyDataLayer.enableDraggable();
      easyDataLayer.checkForModals();
    }, 'main');
  }
};

window.easyDataLayer = easyDataLayer;

easyDataLayer.main();
