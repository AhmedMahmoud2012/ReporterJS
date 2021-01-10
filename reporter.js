document.addEventListener("DOMContentLoaded", function() {
  (function(window) {
    const DEFAULT_SETTINGS = {
      "beacon-id": "DEVELOPM",
      "beacon-version": "6",
      "shop-domain": "https://pro-amino-development-store-two.myshopify.com/"
    };
    const Tracker = {
      info: {
        ...DEFAULT_SETTINGS
      },
      generateID() {
        /*generated 16 character string*/
        return {
          id: Math.random()
            .toString(32)
            .substr(2)
            .padStart(16, Date.now())
        };
      },
      getBrowserInfo() {
        const {
          parsedResult: { browser, os }
        } = bowser.getParser(window.navigator.userAgent);
        return {
          "broswer-version": browser.version,
          browser: browser.name,
          "operating-system": os.name
        };
      },
      async getUserInfo() {
        const ipInfoResponse = await fetch(
          "https://api.ipify.org/?format=json"
        );
        const { ip: ip_address } = await ipInfoResponse.json();
        const locationInfoResponse = await fetch(
          `https://ipinfo.io/${ip_address}/json`
        );
        const { country, city } = await locationInfoResponse.json();
        return {
          country,
          city,
          mobile: this.mobileUtil().getMobileInfo(),
          "ip-address": ip_address,
          email: localStorage.getItem("email") || ""
        };
      },
      getPageInfo() {
        return {
          "page-title": document.title,
          "page-url": window.location.href,
          "referral-url": document.referrer
        };
      },
      getUTMInfo() {
        return {
          "utm-campaign": this.getQueryParam("utm_campaign"),
          "utm-medium": this.getQueryParam("utm_medium"),
          "utm-source": this.getQueryParam("utm_source")
        };
      },
      getDate() {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const yyyy = today.getFullYear();
        return mm + "/" + dd + "/" + yyyy;
      },
      getTime() {
        const today = new Date();
        const h = String(today.getHours()).padStart(2, "0");
        const m = String(today.getMinutes()).padStart(2, "0");
        const s = String(today.getSeconds()).padStart(2, "0");
        return h + ":" + m + ":" + s;
      },
      getReleaseInfo() {
        const diffTime = Math.abs(this.info.start - Date.now());
        const h = String(Math.floor(diffTime / (1000 * 60 * 60)) % 24).padStart(
          2,
          "0"
        );
        const m = String(Math.floor(diffTime / (1000 * 60)) % 60).padStart(
          2,
          "0"
        );
        const s = String(Math.floor(diffTime / 1000) % 60).padStart(2, "0");
        return {
          "leave-time": this.getTime(),
          "leave-date": this.getDate(),
          "visit-duration": h + ":" + m + ":" + s
        };
      },
      mobileUtil() {
        return {
          Android: function() {
            return navigator.userAgent.match(/Android/i);
          },
          BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry/i);
          },
          iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
          },
          Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i);
          },
          Windows: function() {
            return (
              navigator.userAgent.match(/IEMobile/i) ||
              navigator.userAgent.match(/WPDesktop/i)
            );
          },
          getMobileInfo: function() {
            return this.Android()
              ? "Yes"
              : this.BlackBerry()
              ? "Yes"
              : this.iOS()
              ? "Yes"
              : this.Opera()
              ? "Yes"
              : this.Windows()
              ? "Yes"
              : "No";
          }
        };
      },
      async loadScript(url, cb) {
        return new Promise((resolve, reject) => {
          var script = document.createElement("script");
          script.src = url;
          script.onload = async function() {
            if (cb) {
              await cb();
            } else {
              resolve();
            }
          };
          document.head.appendChild(script);
        });
      },
      getQueryParam(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
        if (!results) return "";
        if (!results[2]) return "";
        return decodeURIComponent(results[2].replace(/\+/g, " "));
      },
      async buildInfo() {
        const userInfo = await this.getUserInfo();
        this.info = {
          ...this.info,
          ...userInfo,
          ...this.generateID(),
          ...this.getUTMInfo(),
          ...this.getBrowserInfo(),
          ...this.getPageInfo()
        };
      },
      async fireUserEnters() {
        await this.buildInfo();
        this.info = {
          ...this.info,
          start: Date.now(),
          "visit-date": this.getDate(),
          "visit-time": this.getTime(),
          "leave-time": "",
          "leave-date": "",
          "visit-duration": ""
        };
      },
      fireUserLeaves() {
        this.info = {
          ...this.info,
          ...this.generateID(),
          ...this.getReleaseInfo()
        };
      }
    };

    function JSON_to_URLEncoded(element, key, list) {
      var list = list || [];
      if (typeof element == "object") {
        for (var idx in element)
          JSON_to_URLEncoded(
            element[idx],
            key ? key + "[" + idx + "]" : idx,
            list
          );
      } else {
        list.push(key + "=" + encodeURIComponent(element));
      }
      return list.join("&");
    }
    Tracker.loadScript(
      "https://unpkg.com/bowser@2.4.0/es5.js",
      async function() {
        await Tracker.loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"
        );
        await Tracker.fireUserEnters();
        $("[type='email']").keyup(function(event) {
          Tracker.info.email = this.value;
          localStorage.setItem("email", this.value);
        });
      }
    );

    let done = false;
    window.addEventListener("unload", event => {
      if (!done) {
        done = true;
        Tracker.fireUserLeaves();
        let blob = new Blob([JSON_to_URLEncoded(Tracker.info)], {
          type: "application/x-www-form-urlencoded"
        });
        navigator.sendBeacon(
          "https://senczliuxa.execute-api.us-east-1.amazonaws.com/dev/",
          blob
        );
      }
    });
    window.addEventListener("pagehide", function(e) {
      if (!done) {
        done = true;
        Tracker.fireUserLeaves();
        let blob = new Blob([JSON_to_URLEncoded(Tracker.info)], {
          type: "application/x-www-form-urlencoded"
        });
        navigator.sendBeacon(
          "https://senczliuxa.execute-api.us-east-1.amazonaws.com/dev/",
          blob
        );
      }
    });
  })(window);
});
