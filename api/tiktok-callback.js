import { request } from 'undici';

export default async function (req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Autorisierungscode fehlt.');
  }

  const redirectUri = `https://${req.headers.host}/api/tiktok-callback`;

  try {
    const tokenResponse = await request('https://open-api.tiktok.com/oauth/access_token/', {
      method: 'POST',
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const { access_token, open_id } = await tokenResponse.body.json();

    const userResponse = await request('https://open-api.tiktok.com/user/info/', {
      method: 'POST',
      body: JSON.stringify({
        access_token,
        open_id,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { data } = await userResponse.body.json();
    const username = data.user.display_name;

    res.status(200).send(`<html><body><p>Benutzername: ${username}</p><script>window.location.href = 'flutterflow_app://tiktok_login_success?username=${encodeURIComponent(username)}';</script></body></html>`);

  } catch (error) {
    console.error(error);
    res.status(500).send('Fehler bei der TikTok-Anmeldung.');
  }
}
