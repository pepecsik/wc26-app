const CORS = { 'Access-Control-Allow-Origin': '*' };

exports.handler = async () => {
  try {
    const authStr = Buffer.from(`${process.env.B2_KEY_ID}:${process.env.B2_APP_KEY}`).toString('base64');
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: { Authorization: `Basic ${authStr}` },
    });
    const auth = await authRes.json();
    if (!authRes.ok) throw new Error(`B2 auth: ${auth.message}`);

    const updateRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_update_bucket`, {
      method: 'POST',
      headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: auth.accountId,
        bucketId: auth.allowed?.bucketId,
        corsRules: [{
          corsRuleName: 'allowUploadFromApp',
          allowedOrigins: ['https://timbo-wc-2026.netlify.app', 'http://localhost:5173'],
          allowedOperations: ['b2_upload_file'],
          allowedHeaders: ['*'],
          maxAgeSeconds: 3600,
        }],
      }),
    });
    const updated = await updateRes.json();
    if (!updateRes.ok) throw new Error(`B2 update: ${updated.message}`);

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
