const Anthropic = require('@anthropic-ai/sdk');

// ─── Config ────────────────────────────────────────────────────────────────
const CODA_API_KEY   = process.env.CODA_API_KEY;
const CODA_DOC_ID    = 'cKc2cGnJOT';
const CODA_TABLE_ID  = 'grid-l-jaTOjaOG';

const ZOHO_CLIENT_ID     = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_ORG_ID        = '914791857';

const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY;

const DEPT = {
  zakat_distribution: '1253395000000435085',
  zakat_education:    '1253395000000457123',
  donor_management:   '1253395000000445607',
  finance:            '1253395000000485377',
  general:            '1253395000000468725',
};

// ─── Zoho OAuth token refresh ───────────────────────────────────────────────
async function getZohoAccessToken() {
  const res = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id:     ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Zoho token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ─── Tool: Search Coda knowledge base ──────────────────────────────────────
async function searchCodaKnowledge(query) {
  const url = `https://coda.io/apis/v1/docs/${CODA_DOC_ID}/tables/${CODA_TABLE_ID}/rows`
    + `?query=${encodeURIComponent(query)}&limit=5&valueFormat=simpleWithArrays&useColumnNames=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${CODA_API_KEY}` },
  });

  if (!res.ok) {
    const err = await res.text();
    return { found: false, error: `Coda API error: ${err}` };
  }

  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    return { found: false, results: [] };
  }

  return {
    found: true,
    results: data.items.map(row => ({
      category: row.values['Category']  || '',
      question: row.values['Question']  || '',
      answer:   row.values['Answer']    || '',
      tags:     row.values['Tags']      || '',
    })),
  };
}

// ─── Tool: Create Zoho Desk ticket ─────────────────────────────────────────
async function createZohoDeskTicket({ name, email, subject, description, department }) {
  const token  = await getZohoAccessToken();
  const deptId = DEPT[department] || DEPT.general;

  // Zoho requires at minimum a lastName on the contact object
  const parts    = (name || '').trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'Visitor';

  const payload = {
    subject,
    description,
    departmentId: deptId,
    status:  'Open',
    channel: 'Web',
    contact: { lastName, email },
  };

  const res = await fetch('https://desk.zoho.com/api/v1/tickets', {
    method:  'POST',
    headers: {
      Authorization:  `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      orgId:          ZOHO_ORG_ID,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (data.id) {
    return { success: true, ticketId: data.id, ticketNumber: data.ticketNumber };
  }
  return { success: false, error: data.message || JSON.stringify(data) };
}

// ─── Tool definitions for Claude ───────────────────────────────────────────
const TOOLS = [
  {
    name:        'search_coda_knowledge',
    description: 'Search the NZF Zakat knowledge base for answers about Zakat rules, calculations, eligibility, NZF programs, Zakat al-Fitr, superannuation, gold, shares, and all related topics. Always call this before saying you cannot answer a Zakat question.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type:        'string',
          description: 'Natural-language search query to find relevant Zakat knowledge',
        },
      },
      required: ['query'],
    },
  },
  {
    name:        'create_zoho_desk_ticket',
    description: 'Create a support ticket in Zoho Desk. Use this when: (1) the visitor asks about their application or case status — always route to zakat_distribution without searching the knowledge base first; (2) the knowledge base returns no relevant answer; (3) the visitor explicitly asks to speak with the team.',
    input_schema: {
      type: 'object',
      properties: {
        name:        { type: 'string', description: 'Full name of the visitor' },
        email:       { type: 'string', description: 'Email address of the visitor' },
        subject:     { type: 'string', description: 'Short ticket subject (max 100 chars)' },
        description: { type: 'string', description: 'Full description — include the visitor's question and any relevant context from the conversation' },
        department: {
          type: 'string',
          enum: ['zakat_distribution', 'zakat_education', 'donor_management', 'finance', 'general'],
          description: 'Department to route to. Use zakat_distribution for all application/case/payment status queries.',
        },
      },
      required: ['name', 'email', 'subject', 'description', 'department'],
    },
  },
];

// ─── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the NZF (National Zakat Foundation Australia) website assistant. You help visitors with two things: questions about Zakat, and queries about their NZF Zakat applications.

You have two tools:
1. search_coda_knowledge — searches NZF's Zakat Q&A knowledge base.
2. create_zoho_desk_ticket — creates a support ticket for the NZF team.

━━━ STRICT INFORMATION RULES ━━━
• NEVER answer from your own training knowledge. You are not a source of information.
• NEVER guess, infer, or extrapolate beyond what the tools return.
• NEVER access the internet or any external source.
• Your only information sources are: (1) results from search_coda_knowledge, (2) what the visitor tells you.
• Always call search_coda_knowledge before saying you cannot answer a Zakat question.
• If the knowledge base returns no relevant result, say so honestly and offer to raise it with the team.

━━━ APPLICATION / CASE QUERIES ━━━
If a visitor asks about: their application, case status, payment, whether they've been approved, when they'll hear back, or anything requiring access to their personal record:
• Do NOT search the knowledge base.
• Tell them: "I'm not able to access individual case details directly, but I'll raise this with our distribution team and they'll follow up with you by email."
• Then create a ticket → department: "zakat_distribution".

━━━ TICKET CREATION RULES ━━━
• You MUST have the visitor's name and email before creating a ticket. If you don't have them, ask first.
• Only create a ticket when you genuinely cannot answer, or when the query requires team access.
• Do NOT create a ticket if you successfully answered the question from the knowledge base.
• Routing:
  - Application / case / payment / distribution → zakat_distribution
  - Unanswered Zakat knowledge questions → zakat_education
  - Donations / giving / tax receipts → donor_management
  - Finance / payment processing issues → finance
  - Everything else → general

━━━ TONE & STYLE ━━━
• Warm, human, and clear. Never robotic or stiff.
• This is an Islamic not-for-profit. Be respectful and culturally aware.
• Keep answers concise — don't pad or over-explain.
• Plain language. No jargon.
• Never end a dead-end without offering a next step (ticket, contact, etc.).

━━━ SESSION CONTEXT ━━━
The visitor's name and email are collected at the start of the chat and passed to you in the first system message. Use them when creating tickets — don't ask again unless they weren't provided.`;

// ─── CORS headers ───────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
};

// ─── Handler ────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };

  try {
    const { messages, visitorName, visitorEmail } = JSON.parse(event.body);

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    // Inject visitor identity into system prompt if available
    const systemWithVisitor = visitorName && visitorEmail
      ? `${SYSTEM_PROMPT}\n\nVISITOR IDENTITY (collected at session start):\nName: ${visitorName}\nEmail: ${visitorEmail}`
      : SYSTEM_PROMPT;

    let claudeMessages = messages;
    let response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system:     systemWithVisitor,
      tools:      TOOLS,
      messages:   claudeMessages,
    });

    // ── Tool use loop ──────────────────────────────────────────────────────
    let iterations = 0;
    while (response.stop_reason === 'tool_use' && iterations < 5) {
      iterations++;

      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
      const toolResults   = [];

      for (const toolUse of toolUseBlocks) {
        let result;
        try {
          if (toolUse.name === 'search_coda_knowledge') {
            result = await searchCodaKnowledge(toolUse.input.query);
          } else if (toolUse.name === 'create_zoho_desk_ticket') {
            result = await createZohoDeskTicket(toolUse.input);
          } else {
            result = { error: `Unknown tool: ${toolUse.name}` };
          }
        } catch (toolErr) {
          console.error(`Tool error [${toolUse.name}]:`, toolErr);
          result = { error: toolErr.message };
        }

        toolResults.push({
          type:        'tool_result',
          tool_use_id: toolUse.id,
          content:     JSON.stringify(result),
        });
      }

      // Append assistant turn + tool results and continue
      claudeMessages = [
        ...claudeMessages,
        { role: 'assistant', content: response.content },
        { role: 'user',      content: toolResults },
      ];

      response = await anthropic.messages.create({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system:     systemWithVisitor,
        tools:      TOOLS,
        messages:   claudeMessages,
      });
    }

    const textBlock = response.content.find(b => b.type === 'text');
    return {
      statusCode: 200,
      headers:    CORS,
      body:       JSON.stringify({ reply: textBlock?.text || '' }),
    };

  } catch (err) {
    console.error('Handler error:', err);
    return {
      statusCode: 500,
      headers:    CORS,
      body:       JSON.stringify({ error: 'Something went wrong. Please try again.' }),
    };
  }
};
