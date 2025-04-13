const axios = require('axios');
const https = require('https');

module.exports = async (req, res) => {
  // ターゲットURLを取得
  let targetUrl = req.query.url || req.url.slice(1);

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // プロトコルが省略されている場合、https:// をデフォルトで付与
  try {
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }
    const parsedUrl = new URL(decodeURIComponent(targetUrl));
    targetUrl = parsedUrl.toString();
  } catch (error) {
    console.error('Invalid URL format:', targetUrl, error.message);
    return res.status(400).json({ error: 'Invalid URL format', details: error.message });
  }

  try {
    // axios でリクエスト（SSL 検証を無効化）
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: new URL(targetUrl).host,
        'User-Agent': 'Mozilla/5.0 (compatible; ProxyBot/1.0)',
      },
      data: req.body,
      timeout: 10000,
      // SSL 証明書検証を無効化（個人利用向け）
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    // CORS ヘッダー設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // レスポンスを返す
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy Error:', {
      targetUrl,
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : null,
    });

    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch the target URL',
      details: error.message,
      targetUrl,
    });
  }
};
