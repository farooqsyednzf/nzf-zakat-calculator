// netlify/functions/coda-qa.js
// Proxies the Coda API so the browser never touches Coda directly (avoids CORS).
// Deploy with: CODA_API_KEY environment variable set in Netlify dashboard.

exports.handler = async (event, context) => {
  const CODA_API_KEY = process.env.CODA_API_KEY;

  if (!CODA_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'CODA_API_KEY not configured in Netlify environment variables.' })
    };
  }

  const DOC_ID   = 'cKc2cGnJOT';
  const TABLE_ID = 'grid-l-jaTOjaOG';
  const url = `https://coda.io/apis/v1/docs/${DOC_ID}/tables/${TABLE_ID}/rows?limit=500`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${CODA_API_KEY}` }
    });

    if (!res.ok) {
      throw new Error(`Coda returned ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();

    const qa = data.items
      .map(row => ({
        category: row.values['c-Y9s81kR1xZ'] || '',
        question: row.values['c-ysZv6rkJbo'] || '',
        keywords: (row.values['c-pqNO0TdwYM'] || '').toLowerCase(),
        answer:   row.values['c-w2yMvgV2RI'] || ''
      }))
      .filter(r => r.question && r.answer);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // cache for 1 hour on CDN
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(qa)
    };

  } catch (err) {
    console.error('Coda fetch failed:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
