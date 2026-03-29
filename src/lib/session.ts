const TOKEN_KEY = "token";
const USERNAME_KEY = "username";
const TOKEN_EVENT = "auth:token-change";
const USERNAME_EVENT = "auth:username-change";

export const getStoredToken = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
};

export const getStoredUsername = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(USERNAME_KEY) ?? "";
};

export const setIsIframe = (isIframe: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("isIframe", isIframe ? "1" : "0");
}
export const setStoredToken = (token: string) => {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
  window.dispatchEvent(new CustomEvent(TOKEN_EVENT, { detail: token }));
};

export const setStoredUsername = (username: string) => {
  if (typeof window === "undefined") return;
  if (username) {
    window.localStorage.setItem(USERNAME_KEY, username);
  } else {
    window.localStorage.removeItem(USERNAME_KEY);
  }
  window.dispatchEvent(new CustomEvent(USERNAME_EVENT, { detail: username }));
};

export const clearStoredSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USERNAME_KEY);
  window.dispatchEvent(new CustomEvent(TOKEN_EVENT, { detail: "" }));
  window.dispatchEvent(new CustomEvent(USERNAME_EVENT, { detail: "" }));
};

export const onTokenChange = (handler: (token: string) => void) => {
  const listener = (event: Event) => {
    const custom = event as CustomEvent<string>;
    handler(custom.detail ?? "");
  };
  window.addEventListener(TOKEN_EVENT, listener as EventListener);
  return () => window.removeEventListener(TOKEN_EVENT, listener as EventListener);
};

export const onUsernameChange = (handler: (username: string) => void) => {
  const listener = (event: Event) => {
    const custom = event as CustomEvent<string>;
    handler(custom.detail ?? "");
  };
  window.addEventListener(USERNAME_EVENT, listener as EventListener);
  return () => window.removeEventListener(USERNAME_EVENT, listener as EventListener);
};

export const getJwtFromUrl = () => {
  if (typeof window === "undefined") return "";
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ""));
  return queryParams.get("jwt") || hashParams.get("jwt") || "";
};

export const clearJwtFromUrl = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("jwt")) {
    url.searchParams.delete("jwt");
    window.history.replaceState({}, "", url.toString());
  }
  if (url.hash.includes("jwt=")) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#\/?/, ""));
    if (hashParams.has("jwt")) {
      hashParams.delete("jwt");
      const cleaned = hashParams.toString();
      url.hash = cleaned ? `#/${cleaned}` : "";
      window.history.replaceState({}, "", url.toString());
    }
  }
};

export const getWalletFromUrl = () => {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("walletAddress") ?? "";
};

export const clearWalletFromUrl = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("walletAddress")) {
    url.searchParams.delete("walletAddress");
    window.history.replaceState({}, "", url.toString());
  }
};
