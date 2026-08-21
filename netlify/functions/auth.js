// Decap CMS GitHub OAuth 回调 — 部署到 Netlify Functions
const crypto = require('crypto');

function createHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function createHmac(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function randomBytes(size) {
  return crypto.randomBytes(size).toString('hex');
}

exports.handler = async (event) => {
  const { code, state } = event.queryStringParameters || {};

  if (!code) {
    // Step 1: 重定向到 GitHub OAuth
    const csrf = randomBytes(32);
    const redirect = `https://github.com/login/oauth/authorize?client_id=${process.env.OAUTH_CLIENT_ID}&scope=repo,user&state=${csrf}`;
    return {
      statusCode: 302,
      headers: {
        Location: redirect,
        'Set-Cookie': `csrf=${csrf}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=300`,
      },
    };
  }

  // Step 2: 用 code 换 token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.OAUTH_CLIENT_ID,
      client_secret: process.env.OAUTH_CLIENT_SECRET,
      code,
    }),
  });
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return { statusCode: 400, body: JSON.stringify(tokenData) };
  }

  // 返回 token 给 Decap CMS
  const html = `<!DOCTYPE html>
<html><body>
<script>
  window.opener.postMessage(${JSON.stringify({
    token: tokenData.access_token,
    provider: 'github',
  })}, '*');
  window.close();
</script>
<p>授权成功！正在关闭窗口...</p>
</body></html>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: html,
  };
};
