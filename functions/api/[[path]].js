// 기존 Vercel 봇 API로 전달하며 OAuth 리다이렉트와 세션 쿠키를 보존한다.
export async function onRequest({ request }) {
  const upstream = new URL(request.url);
  upstream.protocol = "https:";
  upstream.host = "iryu-discord-bot.vercel.app";

  const proxyRequest = new Request(upstream.toString(), request);
  // OAuth 302 응답을 서버에서 따라가지 않고 브라우저에 그대로 전달한다.
  return fetch(proxyRequest, { redirect: "manual" });
}
