const axios = require('axios');

module.exports = async (req, res) => {
  // クエリパラメータまたはパスの末尾からターゲットURLを取得
  const targetUrl = req.query.url || req.url.slice(1); // /api/proxy/{URL} の {URL} 部分

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // ターゲットURLにリクエストを送信
    const response = await axios({
      method: req.method,
      url: decodeURIComponent(targetUrl),
      headers: {
        // 必要に応じてリクエストヘッダーを転送
        ...req.headers,
        host: new URL(decodeURIComponent(targetUrl)).host, // ホストをターゲットに合わせる
      },
      data: req.body, // POST/PUTなどのボディを転送
    });

    // CORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // レスポンスをクライアントに返す
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch the target URL', details: error.message });
  }
};
