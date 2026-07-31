const BYPASS_COOKIE_NAME = "__prerender_bypass";
function setBypassCookie(token) {
  return `${BYPASS_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/`;
}
function clearBypassCookie() {
  return `${BYPASS_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

export { clearBypassCookie as c, setBypassCookie as s };
