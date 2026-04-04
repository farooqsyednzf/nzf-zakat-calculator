// netlify/functions/claude-chat.js
// Proxies Anthropic API calls so the API key never goes to the browser.
// Set ANTHROPIC_API_KEY in Netlify → Site configuration → Environment variables.

const https = require('https');

exports.handler = function(event, context, callback) {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return callback(null, { statusCode: 405, body: 'Method Not Allowed' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    console.log('ERROR: ANTHROPIC_API_KEY not set');
    return callback(null, { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }) });
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return callback(null, { statusCode: 400, body: 'Invalid JSON' });
  }

  var payload = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: body.system || '',
    messages: body.messages || []
  });

  var options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  var req = https.request(options, function(res) {
    var data = '';
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() {
      console.log('Anthropic responded:', res.statusCode);
      callback(null, {
        statusCode: res.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: data
      });
    });
  });

  req.on('error', function(e) {
    console.log('Anthropic request error:', e.message);
    callback(null, { statusCode: 500, body: JSON.stringify({ error: e.message }) });
  });

  req.write(payload);
  req.end();
};
