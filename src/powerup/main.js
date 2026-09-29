
/* global TrelloPowerUp */
import { isAuthorized } from "../lib/auth.js";

const ICON_URL =
  typeof window !== "undefined" && window.location.origin
    ? `${window.location.origin}/icons/icon.svg`
    : "./icons/icon.svg";

TrelloPowerUp.initialize({
  "authorization-status": async function (t) {
    const authorized = await isAuthorized(t);
    return { authorized };
  },

  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize BoardPulse",
      url: "./auth.html",
      height: 320,
    });
  },

  "show-settings": function (t) {
    return t.popup({
      title: "BoardPulse Settings",
      url: "./auth.html",
      height: 320,
    });
  },

  "board-buttons": function () {
    return [
      {
        icon: {
          dark: ICON_URL,
          light: ICON_URL,
        },
        text: "BoardPulse",

        callback: async function (t) {
          const authorized = await isAuthorized(t);

          if (authorized) {
            return t.modal({
              title: "BoardPulse",
              url: t.signUrl("./dashboard.html"),
              height: 520,
              fullscreen: false,
            });
          }

          return t.popup({
            title: "Authorize BoardPulse",
            url: "./auth.html",
            height: 320,

            callback: async function () {
              // Check authorization again after the popup closes.
              const nowAuthorized = await isAuthorized(t);

              if (!nowAuthorized) {
                return;
              }

              return t.modal({
                title: "BoardPulse",
                url: t.signUrl("./dashboard.html"),
                height: 520,
                fullscreen: false,
              });
            },
          });
        },
      },
    ];
  },
});