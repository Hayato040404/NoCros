const axios = require('axios');

module.exports = async (req, res) => {
  // ターゲットURLを取得（クエリまたはパスから）
  let targetUrl = req.query.url || req.url.slice(1);

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // プロトコルが省略されている場合、https:// をデフォルトで付与
  try {
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`; // デフォルトで https を試す
    }

    // URL のフォーマットを検証
    const parsedUrl = new URL(decodeURIComponent(targetUrl));
    targetUrl = parsedUrl.toString(); // 正規化された URL を使用
  } catch (error) {
    console.error('Invalid URL format:', targetUrl, error.message);
    return res.status(400).json({ error: 'Invalid URL format', details: error.message });
  }

  try {
    // ターゲットURLにリクエスト
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
