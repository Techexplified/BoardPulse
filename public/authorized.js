
(function () {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("token") || window.location.hash.slice(1);

  const titleEl = document.getElementById("status-title");
  const descEl = document.getElementById("status-desc");
  const spinnerEl = document.getElementById("spinner");

  function showError(message) {
    if (spinnerEl) spinnerEl.style.display = "none";
    if (titleEl) titleEl.textContent = "Authorization Failed";
    if (descEl) {
      descEl.textContent = message;
      descEl.style.color = "#f87168";
    }
  }

  if (!token) {
    showError("No authorization token was received from Trello.");
    return;
  }

  const message = {
    source: "insight-auth",
    token: token
  };

  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, window.location.origin);
    }

    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("insight-auth-channel");
      channel.postMessage(message);
      channel.close();
    }
  } catch (error) {
    console.error("Failed to send authorization token:", error);
    showError("Could not send the authorization token. Please try again.");
    return;
  }

  if (spinnerEl) spinnerEl.style.display = "none";
  if (titleEl) titleEl.textContent = "Successfully Connected!";
  if (descEl) {
    descEl.textContent = "Insight is authorized. Closing this window…";
  }

  setTimeout(function () {
    window.close();
  }, 1000);
})();