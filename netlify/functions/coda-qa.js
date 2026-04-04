const https = require('https');

exports.handler = function(event, context, callback) {
  const key = process.env.CODA_API_KEY;

  if (!key) {
    console.log('ERROR: CODA_API_KEY environment variable is not set');
    return callback(null, { statusCode: 500, body: 'CODA_API_KEY not set' });
  }

  console.log('Fetching from Coda...');

  const options = {
    hostname: 'coda.io',
    path: '/apis/v1/docs/cKc2cGnJOT/tables/grid-l-jaTOjaOG/rows?limit=500',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    }
  };

  var req = https.request(options, function(res) {
    var body = '';
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
      console.log('Coda responded with status:', res.statusCode);
      if (res.statusCode !== 200) {
        console.log('Coda error body:', body.slice(0, 300));
        return callback(null, { statusCode: 500, body: 'Coda error ' + res.statusCode });
      }
      try {
        var data = JSON.parse(body);
        var qa = data.items
          .map(function(row) {
            return {
              category: row.values['c-Y9s81kR1xZ'] || '',
              question: row.values['c-ysZv6rkJbo'] || '',
              keywords: (row.values['c-pqNO0TdwYM'] || '').toLowerCase(),
              answer:   row.values['c-w2yMvgV2RI'] || ''
            };
          })
          .filter(function(r) { return r.question && r.answer; });

        console.log('Success: returning ' + qa.length + ' Q&A entries');
        callback(null, {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
          },
          body: JSON.stringify(qa)
        });
      } catch(e) {
        console.log('JSON parse error:', e.message);
        callback(null, { statusCode: 500, body: 'Parse error: ' + e.message });
      }
    });
  });

  req.on('error', function(e) {
    console.log('Request error:', e.message);
    callback(null, { statusCode: 500, body: 'Request failed: ' + e.message });
  });

  req.end();
};
