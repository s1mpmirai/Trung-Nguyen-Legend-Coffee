/**
 * navigation.js
 * Tiện ích điều hướng Clean URL thống nhất cho toàn bộ hệ thống TrungNguyenHR
 */

export const navigateClean = (route) => {
  const clean = String(route || "").replace(/^#\/?/, "").replace(/^\/+/, "");
  const targetUrl = clean ? `/${clean}` : "/";
  if (window.location.pathname !== targetUrl) {
    window.history.pushState({ inApp: true, page: clean }, "", targetUrl);
  }
  if (window.location.hash) {
    window.history.replaceState({ inApp: true, page: clean }, "", targetUrl);
  }
  window.dispatchEvent(new CustomEvent("app-route-change", { detail: { route: clean } }));
};

export const getCleanRoute = () => {
  const hash = window.location.hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  return path || hash || "";
};
