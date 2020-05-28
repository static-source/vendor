/*!
 * embedded.js for handle video at diff platform
 |
 | 全能神说: "在這最末了的時代最末了的時代,
 |           讓神的名能在外邦中被稱為大,
 |           使神的作為被外邦中的人被外邦中的人看見,
 |           且因神的神的作為而稱神為全能者,
 |           讓神口之言早日得著早日得著成就"
 |
 | Almighty God says:
 |           “In the end times, in the final age,
 |           God’s name will be magnified among Gentile nations.
 |           The acts of God will be by Gentiles seen,
 |           and they’ll address Him as the Almighty,
 |           and thus His words shall one day soon come true”
 |
 * @author : Buff
 * @date : 14/12/2018
 * @Time: 3:05 PM
 * @standards : ECMAScript 5
 * @version: 1.0.0
 */

~(function (w, $) {
  "use strict";

  //  set default value
  if (window.$g2_config) {
    window.$g2_config.videoPlatform = window.$g2_config.videoPlatform
      ? window.$g2_config.videoPlatform
      : "YouTube";
    window.$g2_config.facebook_user_name = window.$g2_config.facebook_user_name
      ? window.$g2_config.facebook_user_name
      : "kingdomsalvation.org";
  }

  window.__G2embeddedQueue = {
    YTB: [],
    FB: [],
    VIMEO: [],
    apiJsLoad: [],
  };

  window.__G2embeddedApiLoadStar = {
    YTB: false,
    FB: false,
    VIMEO: false,
  };

  /**
   * G2embedded
   * @param target   element obj
   * @param videoId
   * @param platform
   * @param options
   * @constructor
   */
  function G2embedded(target, videoId, platform, options) {
    this.player = null;
    this.target = target;
    this.platformSupport = {
      YouTube: "YTB",
      Facebook: "FB",
      Vimeo: "VIMEO",
    };
    this.videoId = videoId ? videoId : "";
    this.promiseDelay = 50;
    this.platformApiJs = {
      //  https://developers.google.com/youtube/iframe_api_reference
      YTB: "https://www.youtube.com/iframe_api",
      //  https://developers.facebook.com/docs/plugins/embedded-video-player/api/
      FB: "https://connect.facebook.net/en_US/sdk.js",
      //  https://github.com/vimeo/player.js
      VIMEO: "https://player.vimeo.com/api/player.js",
    };
    this.platform = platform ? this.platformSupport[platform] : "";
    this.optionsDefault = {
      width: "",
      height: "",
      autoplay: true,
      /**
       * this option use to splice facebook video
       */
      username: "",
      /**
       * this option use to set up facebook platform
       */
      appId: "",
      vars: {},
    };
    this.options = $.extend(this.optionsDefault, options);

    //  auto get platform from window.$g2_config
    if (
      this.platform === "" &&
      window.$g2_config &&
      window.$g2_config.videoPlatform
    ) {
      this.platform = this.platformSupport[window.$g2_config.videoPlatform];
    }

    //   platform fix
    if (this.videoId && this.videoId.match) {
      if (this.videoId.match(/^[\d]+$/)) {
        if (this.videoId.length === 16) {
          this.platform = "FB";
        } else {
          this.platform = "VIMEO";
        }
      } else {
        this.platform = "YTB";
      }
    }

    //  auto get usename, appid from window.$g2_config
    if (
      this.options.username === "" &&
      window.$g2_config &&
      window.$g2_config.facebook_user_name &&
      this.platform === "FB"
    ) {
      this.options.username = window.$g2_config.facebook_user_name;
    }

    //  check already set username and appId
    if (this.platform === "FB") {
      if (this.options.username === "") {
        $.error("shoulda set username when platform is facebook");
        return;
      }
    }

    this.init();
    var self = this;
    $(this.target).on("playerReady", function () {
      self.target.data("platform", self.platform);
    });

    return this;
  }

  var emPT = G2embedded.prototype;

  emPT.init = function () {
    //  load diff platform js by this.platformSupport
    this.apiJsLoadStartHandle();
    this.loadApiJs();
  };

  emPT.loadApiJs = function () {
    var self = this;

    if (this.platform === "YTB" && window.YT) {
      this.onYTBApiLoaded();
      this.apiJsLoad();
    } else if (this.platform === "FB" && window.FB) {
      this.onFBApiLoaded();
      this.apiJsLoad();
    } else if (this.platform === "VIMEO" && window.Vimeo) {
      this.apiJsLoad();
    } else {
      this.apiJsLoadedEventHandle();

      window.__G2embeddedQueue.apiJsLoad.push(this);
      if (!window.__G2embeddedApiLoadStar[this.platform]) {
        window.__G2embeddedApiLoadStar[this.platform] = true;
        $.getScript(this.platformApiJs[this.platform], function () {
          self.apiJsLoadHandle();
        });
      }
    }
  };

  emPT.apiJsLoadHandle = function () {
    window.__G2embeddedQueue.apiJsLoad.map(function (obj) {
      obj.apiJsLoad();
    });
    window.__G2embeddedQueue.apiJsLoad = [];
  };

  emPT.apiJsLoadStartHandle = function () {
    if (this.platform === "FB") {
      var oTarget = this.target.data("emTarget").get(0);
      oTarget.dataset.href =
        "https://www.facebook.com/" +
        this.options.username +
        "/videos/" +
        this.videoId +
        "/";
      //  此处不能设置宽高, 不然facebook video.php回返回500错误
      // oTarget.dataset.width = this.options.width;
      // oTarget.dataset.height = this.options.height;
      oTarget.classList.add("fb-video");
    }
  };

  /**
   * callback function when api js loaded
   */
  emPT.apiJsLoad = function () {
    var self = this;

    if (this.platform === "VIMEO") {
      self.player = new Vimeo.Player(self.target.data("emTargetId"), {
        id: self.videoId,
        width: self.options.width,
        height: self.options.height,
        autoplay: self.options.autoplay,
      });

      self.player.ready().then(function () {
        self.target.trigger("playerReady");
      });

      self.player.on("play", function () {
        self.target.trigger("play");
      });

      self.player.on("pause", function () {
        self.target.trigger("paused");
      });

      self.player.on("ended", function () {
        self.target.trigger("ended");
      });
    }
  };

  emPT.apiJsLoadedEventHandle = function () {
    switch (this.platform) {
      case "YTB":
        window.__G2embeddedQueue.YTB.push(this);
        window.onYouTubeIframeAPIReady = function () {
          window.__G2embeddedQueue.YTB.map(function (obj) {
            obj.onYTBApiLoaded();
          });
        };
        break;
      case "FB":
        window.__G2embeddedQueue.FB.push(this);
        window.fbAsyncInit = function () {
          window.__G2embeddedQueue.FB.map(function (obj) {
            obj.onFBApiLoaded();
          });
        };
        break;
      case "VIMEO": //  viemo not have js load event
        break;
      default:
        break;
    }
  };

  // - - - - - - - - - - - - - - - - - - - Api Js Loaded - - - - - - - - - - - - - - - - - - -
  emPT.handleResponse = function (msg) {
    window.__handleResponseObj.FBOnReadyEventHandle(msg);
  };
  emPT.onFBApiLoaded = function () {
    FB.Event.unsubscribe("xfbml.ready", this.handleResponse);
    FB.init({
      appId: this.options.appId ? this.options.appId : "",
      xfbml: true,
      version: "v2.5",
    });
    window.__handleResponseObj = this;
    FB.Event.subscribe("xfbml.ready", this.handleResponse);
  };

  emPT.onYTBApiLoaded = function () {
    var self = this;
    var defaultVars = {
      autoplay: self.options.autoplay ? 1 : 0,
      html5: 1,
      rel: 0,
      showinfo: 0,
    };
    defaultVars = $.extend(defaultVars, this.options.vars);
    self.player = new YT.Player(self.target.data("emTargetId"), {
      height: self.options.height,
      width: self.options.width,
      videoId: self.videoId,
      playerVars: defaultVars,
      suggestedQuality: "hd1080",
      events: {
        onReady: function () {
          self.YTBOnReadyEventHandle();
        },
        onStateChange: function (state) {
          self.YTBOnStateChangeEventHandle(state);
        },
      },
    });
  };

  // - - - - - - - - - - - - - - - - - - - Method - - - - - - - - - - - - - - - - - - -
  emPT.play = function () {
    switch (this.platform) {
      case "YTB":
        this.player.playVideo();
        break;
      case "FB":
      case "VIMEO":
        this.player.play();
        break;
      default:
        break;
    }
  };

  emPT.pause = function () {
    switch (this.platform) {
      case "YTB":
        this.player.pauseVideo();
        break;
      case "FB":
      case "VIMEO":
        this.player && this.player.pause();
        break;
      default:
        break;
    }
  };

  emPT.stopVideo = function () {
    switch (this.platform) {
      case "YTB":
        this.player.stopVideo();
        break;
      case "FB":
        this.player.pause();
        break;
      case "VIMEO":
        this.player.unload();
        break;
      default:
        break;
    }
  };

  emPT.seek = function (seconds) {
    switch (this.platform) {
      case "YTB":
        this.player.seekTo(seconds);
        break;
      case "FB":
        this.player.seek(seconds);
        break;
      case "VIMEO":
        this.player.setCurrentTime(seconds);
        break;
      default:
        break;
    }
  };

  emPT.getCurrentPosition = function () {
    var self = this;
    var dfr = $.Deferred();
    setTimeout(function () {
      switch (self.platform) {
        case "YTB":
          dfr.resolve(self.player.getCurrentTime());
          break;
        case "FB":
          dfr.resolve(self.player.getCurrentPosition());
          break;
        case "VIMEO":
          self.player.getCurrentTime().then(function (seconds) {
            dfr.resolve(seconds);
          });
          break;
        default:
          break;
      }
    }, self.promiseDelay);
    return dfr.promise();
  };

  emPT.mute = function () {
    switch (this.platform) {
      case "YTB":
      case "FB":
        this.player.mute();
        break;
      case "VIMEO":
        this.lastVolume = this.player.getVolume();
        this.player.setVolume(0);
        break;
      default:
        break;
    }
  };

  emPT.unmute = function () {
    switch (this.platform) {
      case "YTB":
        this.player.unMute();
        break;
      case "FB":
        this.player.unmute();
        break;
      case "VIMEO":
        this.player.setVolume(this.lastVolume ? this.lastVolume : 1);
        break;
      default:
        break;
    }
  };

  emPT.isMuted = function () {
    var self = this;
    var dfr = $.Deferred();
    setTimeout(function () {
      switch (self.platform) {
        case "YTB":
          dfr.resolve(self.player.isMuted());
          break;
        case "FB":
          dfr.resolve(self.player.isMuted());
          break;
        case "VIMEO":
          self.player.getVolume().then(function (volume) {
            if (volume === 0) {
              dfr.resolve(true);
            } else {
              dfr.resolve(false);
            }
          });
          break;
        default:
          break;
      }
    }, self.promiseDelay);
    return dfr.promise();
  };

  emPT.setVolume = function (volume) {
    this.player.setVolume(volume);
  };

  emPT.getVolume = function () {
    var self = this;
    var dfr = $.Deferred();
    setTimeout(function () {
      switch (self.platform) {
        case "YTB":
          dfr.resolve(self.player.getVolume());
          break;
        case "FB":
          dfr.resolve(self.player.getVolume());
          break;
        case "VIMEO":
          self.player.getVolume().then(function (volume) {
            dfr.resolve(volume);
          });
          break;
        default:
          break;
      }
    }, self.promiseDelay);
    return dfr.promise();
  };

  emPT.getDuration = function () {
    var self = this;
    var dfr = $.Deferred();
    setTimeout(function () {
      switch (self.platform) {
        case "YTB":
          dfr.resolve(self.player.getDuration());
          break;
        case "FB":
          dfr.resolve(self.player.getDuration());
          break;
        case "VIMEO":
          self.player.getDuration().then(function (volume) {
            dfr.resolve(volume);
          });
          break;
        default:
          break;
      }
    }, self.promiseDelay);
    return dfr.promise();
  };

  emPT.setSize = function (width, height) {
    switch (this.platform) {
      case "YTB":
        try {
          this.player.setSize(width, height);
        } catch (e) {}
        break;
      case "FB":
        this.target.data("emTarget").css({
          width: width,
          height: height,
        });
        break;
      case "VIMEO":
        this.target.data("emTarget").children().css({
          width: width,
          height: height,
        });
        break;
      default:
        break;
    }
  };

  emPT.loadVideoById = function (videoId, platform) {
    platform = platform ? platform : null;
    //  TODO: 根据不同的平台在做判断
    if (
      platform &&
      this.platformSupport[platform] != this.target.data("platform")
    ) {
      this.target.data("emTargetId", null);
      this.target.html("");
      return this.target.G2embedded(videoId, platform);
    }

    switch (this.platform) {
      case "YTB":
        this.player.loadVideoById(videoId);
        break;
      case "FB":
        //  remove event listenner
        this.player.$2.clearSubscribers();

        var randomId = $.randomString();
        var oDiv = $("<div />");
        oDiv.attr("id", randomId);
        this.target.children().remove();
        this.target.append(oDiv);
        this.target.data("emTarget", oDiv);
        this.target.data("emTargetId", randomId);

        var oTarget = this.target.data("emTarget").get(0);
        oTarget.dataset.href =
          "https://www.facebook.com/" +
          this.options.username +
          "/videos/" +
          videoId +
          "/";
        oTarget.classList.add("fb-video");

        this.onFBApiLoaded();
        break;
      case "VIMEO":
        this.player.loadVideo(videoId);
        break;
      default:
        break;
    }

    return this;
  };

  // - - - - - - - - - - - - - - - - - - - Event - - - - - - - - - - - - - - - - - - -
  emPT.FBOnReadyEventHandle = function (msg) {
    var self = this;
    if (
      this.target &&
      msg.type === "video" &&
      msg.id === this.target.data("emTargetId")
    ) {
      this.player = msg.instance;
      this.options.autoplay && this.player.play();
    }
    this.player.subscribe("startedPlaying", function () {
      self.target.trigger("play");
    });

    this.player.subscribe("paused", function () {
      self.target.trigger("paused");
    });

    this.player.subscribe("finishedPlaying", function () {
      self.target.trigger("ended");
    });

    this.target.trigger("playerReady");
  };

  emPT.YTBOnReadyEventHandle = function () {
    this.target.trigger("playerReady");
    if (this.platform == "FB") {
      this.setVolume(1);
    }
  };

  emPT.YTBOnStateChangeEventHandle = function (state) {
    switch (state.data) {
      case 1:
        this.target.trigger("play");
        break;
      case 2:
        this.target.trigger("paused");
        break;
      case 0:
        this.target.trigger("ended");
    }
  };

  $.extend({
    /**
     * get random string
     * @returns {string}
     */
    randomString: function () {
      var text = "random";
      var possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for (var i = 0; i < 8; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }

      return text;
    },
  });

  $.fn.extend({
    G2embedded: function (videoId, platform) {
      //  only can handle once
      if ($(this).data("emTargetId")) {
        return;
      }

      //  create child div
      var randomId = $.randomString();
      var oDiv = $("<div />");
      oDiv.attr("id", randomId);
      $(this).children().remove();
      $(this).append(oDiv);
      $(this).data("emTarget", oDiv);
      $(this).data("emTargetId", randomId);

      if (typeof videoId === "object" && videoId.videoId) {
        return new G2embedded($(this), videoId.videoId, platform, videoId);
      } else {
        return new G2embedded($(this), videoId, platform);
      }
    },
  });

  //  add G2lity
  $.extend({
    G2LityVideo: function (videoId, platform) {
      platform = platform ? platform : window.$g2_config.videoPlatform;
      var oLity = null;
      switch (platform) {
        case "YouTube":
          oLity = window.lity(
            "https://www.youtube.com/watch?v=" +
              videoId +
              "&html5=1&rel=0&showinfo=0&enablejsapi=1&widgetid=1"
          );
          break;
        case "Facebook":
          oLity = window.lity(
            "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2F" +
              encodeURIComponent(window.$g2_config.facebook_user_name) +
              "%2Fvideos%2F" +
              videoId +
              "%2Fautoplay=true"
          );
          break;
        case "Vimeo":
          oLity = window.lity("https://vimeo.com/" + videoId);
          break;
      }
    },
  });
})(window, $);
