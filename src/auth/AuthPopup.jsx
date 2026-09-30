import React, { useEffect, useRef, useState } from "react";
import {
  APP_NAME,
  AUTH_MESSAGE_SOURCE,
  buildAuthorizeUrl,
  saveToken,
} from "../lib/auth.js";
import {
  CheckIcon,
  SpinnerIcon,
  InsightIcon,
} from "../lib/icons.jsx";
import "./auth.css";

export default function AuthPopup({ t }) {
  const [status, setStatus] = useState("idle"); // idle | waiting | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const popupRef = useRef(null);

  // Listen for the postMessage dispatched by /authorized.html once the member approves
  useEffect(() => {
    async function handleMessage(event) {
      // The token is a credential: only trust messages from our own origin
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.source !== AUTH_MESSAGE_SOURCE) return;

      if (!event.data.token) {
        setStatus("error");
        setErrorMessage("No authorization token received from Trello.");
        return;
      }

      try {
        await saveToken(t, event.data.token);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMessage("Failed to store authorization credentials: " + (err.message || "Unknown error"));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [t]);

    // Fallback listener for authorization popup communication
  useEffect(() => {
    let channel;

    try {
      channel = new BroadcastChannel("insight-auth-channel");

      channel.onmessage = async function (event) {
        if (!event.data || event.data.source !== AUTH_MESSAGE_SOURCE) {
          return;
        }

        if (!event.data.token) {
          setStatus("error");
          setErrorMessage("No authorization token received from Trello.");
          return;
        }

        try {
          await saveToken(t, event.data.token);
          setStatus("success");
        } catch (err) {
          setStatus("error");
          setErrorMessage(
            "Failed to store authorization credentials: " +
              (err.message || "Unknown error")
          );
        }
      };
    } catch (err) {
      console.warn("BroadcastChannel unavailable:", err);
    }

    return () => {
      if (channel) {
        channel.close();
      }
    };
  }, [t]);

  // Keep the popup height snugly fit to content so no scrollbars appear
  useEffect(() => {
    if (t && typeof t.sizeTo === "function") {
      t.sizeTo("#root").catch(() => {});
    }
  }, [t, status]);

 async function handleAuthorize() {
  setStatus("waiting");
  setErrorMessage("");

  try {
    const returnUrl = `${window.location.origin}/authorized.html`;
    const authUrl = buildAuthorizeUrl(returnUrl);

    if (!t || typeof t.authorize !== "function") {
      throw new Error("Trello authorization is not available.");
    }

    const token = await t.authorize(authUrl, {
      width: 580,
      height: 750,
    });

    if (!token) {
      throw new Error("No authorization token was received.");
    }

    await saveToken(t, token);

    setStatus("success");
  } catch (err) {
    console.error("[Insight] Authorization failed:", err);

    setStatus("error");
    setErrorMessage(
      err?.message || "Authorization failed. Please try again."
    );
  }
}

  if (status === "success") {
    return (
      <div className="auth-popup-container auth-state-box">
        <div className="auth-success-circle">
          <CheckIcon width={26} height={26} />
        </div>
<h3 className="auth-title"><h2>BoardPulse</h2></h3>        <p className="auth-subtitle" style={{ marginBottom: "16px" }}>
          Your Trello account is connected securely.
        </p>
     <button
  type="button"
  onClick={() => {
    t.closePopup();
  }}
  className="auth-btn-primary"
>
  Continue
</button>
      </div>
    );
  }

  return (
    <div className="auth-popup-container">
      <div className="auth-header">
        <div className="auth-icon-badge">
          <InsightIcon width={22} height={22} />
        </div>
        <div>
<h3 className="auth-title">BoardPulse</h3>          <p className="auth-subtitle">Trello Authorization</p>
        </div>
      </div>

      <p className="auth-body-text">
        Connect your Trello account so {APP_NAME} can securely interact with board data and provide intelligent insights.
      </p>

      <div className="auth-features-list">
        <div className="auth-feature-item">
          <span className="auth-feature-dot"></span>
          <span>Member-scoped private token storage</span>
        </div>
        <div className="auth-feature-item">
          <span className="auth-feature-dot"></span>
          <span>Secure read and write permissions</span>
        </div>
        <div className="auth-feature-item">
          <span className="auth-feature-dot"></span>
          <span>Revoke access anytime from Trello settings</span>
        </div>
      </div>

      {status === "error" && (
        <div className="auth-error-box">
          {errorMessage || "Couldn't connect. Please verify popups are allowed and try again."}
        </div>
      )}

      <button
        type="button"
        onClick={handleAuthorize}
        disabled={status === "waiting"}
        className="auth-btn-primary"
      >
        {status === "waiting" ? (
          <>
            <SpinnerIcon width={16} height={16} />
            Waiting for approval…
          </>
        ) : (
          "Connect Trello Account"
        )}
      </button>

      {status === "waiting" && (
        <p className="auth-body-text" style={{ textAlign: "center", marginTop: "10px", fontSize: "12px" }}>
          Please complete authorization in the popup window.
        </p>
      )}

      {status === "error" && (
        <button type="button" onClick={handleAuthorize} className="auth-link-btn">
          Try again
        </button>
      )}
    </div>
  );
}
