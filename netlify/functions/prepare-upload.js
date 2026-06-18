const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: 'Method not allowed' };

  try {
    const { home, away, slot, drinkCount, emoji } = JSON.parse(event.body);

    // 1. Tick sheet checkbox + write drink count + get filenames from Apps Script
    const scriptRes = await fetch(process.env.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home, away, slot, drinkCount, emoji }),
      redirect: 'follow',
    });
    const scriptText = await scriptRes.text();
    console.log('Apps Script status:', scriptRes.status);
    console.log('Apps Script response:', scriptText.slice(0, 500));
    let script;
    try {
      script = JSON.parse(scriptText);
    } catch {
      throw new Error(`Apps Script returned non-JSON (status ${scriptRes.status}): ${scriptText.slice(0, 200)}`);
    }
    if (script.error) throw new Error(`Sheet: ${script.error}`);

    // 2. Authorize with Backblaze B2
    const authStr = Buffer.from(`${process.env.B2_KEY_ID}:${process.env.B2_APP_KEY}`).toString('base64');
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: { Authorization: `Basic ${authStr}` },
    });
    const auth = await authRes.json();
    if (!authRes.ok) throw new Error(`B2 auth: ${auth.message}`);

    const bucketId = auth.allowed?.bucketId;

    // 3. Get a single-use upload URL
    const urlRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucketId }),
    });
    const urlData = await urlRes.json();
    if (!urlRes.ok) throw new Error(`B2 upload URL: ${urlData.message}`);

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename1: script.filename1,
        filename2: script.filename2,
        filename3: script.filename3,
        filename4: script.filename4,
        uploadUrl: urlData.uploadUrl,
        uploadAuthToken: urlData.authorizationToken,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
