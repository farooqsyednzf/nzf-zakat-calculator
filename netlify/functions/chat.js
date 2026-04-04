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

// ─── Department IDs ──────────────────────────────────────────────────────────
const DEPT = {
  zakat_distribution: '1253395000000435085',
  zakat_education:    '1253395000000457123',
  donor_management:   '1253395000000445607',
  finance:            '1253395000000485377',
  general:            '1253395000000468725',
};

// ─── Agent IDs ───────────────────────────────────────────────────────────────
const AGENT = {
  shahnaz:  '1253395000000474001',   // Shahnaz Abdul-Latif  — Zakat Distribution
  ahmed:    '1253395000000428005',   // Ahmed Mostafa        — Zakat Education
  farooq:   '1253395000000472001',   // Farooq Syed          — Donor Management
  misturah: '1253395000000783001',   // Misturah X           — Finance
  munir:    '1253395000000470001',   // Munir Abdella        — General Enquiries
};

// ─── NZF Website page index ───────────────────────────────────────────────────
// Curated list of NZF pages with topic tags for keyword matching.
// ONLY these pages will ever be fetched — no external sites.
const NZF_PAGES = [
  { url: 'https://nzf.org.au/about/',                  topic: 'About NZF, who we are, mission, vision, team, history',                                     keywords: ['about','who','nzf','organisation','mission','vision','history','team','founded'] },
  { url: 'https://nzf.org.au/apply/',                  topic: 'Apply for Zakat assistance, get help, eligibility to receive Zakat',                         keywords: ['apply','application','help','assistance','eligible','eligibility','need','needy','receive','recipient','support','hardship','struggling'] },
  { url: 'https://nzf.org.au/programs/',               topic: 'NZF Programs overview — all programs we offer',                                              keywords: ['program','programs','services','what we do','offer','initiative'] },
  { url: 'https://nzf.org.au/program/emergency-relief/', topic: 'Emergency relief program',                                                                 keywords: ['emergency','relief','urgent','crisis','immediate'] },
  { url: 'https://nzf.org.au/program/crisis-accommodation/', topic: 'Crisis accommodation program',                                                         keywords: ['accommodation','housing','homeless','shelter','rent'] },
  { url: 'https://nzf.org.au/calculate/',              topic: 'Zakat calculator — calculate how much Zakat you owe',                                        keywords: ['calculate','calculator','how much','compute','work out','nisab','figure out'] },
  { url: 'https://nzf.org.au/pay/zakat/',              topic: 'How to pay your Zakat to NZF',                                                               keywords: ['pay zakat','give zakat','donate zakat','paying','make payment','contribute'] },
  { url: 'https://nzf.org.au/pay/sadaqah/',            topic: 'How to give Sadaqah (voluntary charity) to NZF',                                             keywords: ['sadaqah','sadaqa','voluntary','charity','give sadaqah','donate'] },
  { url: 'https://nzf.org.au/pay/fidyah/',             topic: 'How to pay Fidyah for missed fasts',                                                         keywords: ['fidyah','missed fast','fasting','unable to fast','elderly','ill'] },
  { url: 'https://nzf.org.au/pay/fitr/',               topic: 'How to pay Zakat al-Fitr (Fitrah)',                                                          keywords: ['fitr','zakat ul fitr','zakat al fitr','fitrah','ramadan zakat','eid','end of ramadan'] },
  { url: 'https://nzf.org.au/pay/tainted-wealth/',     topic: 'How to purify tainted wealth / interest money',                                              keywords: ['tainted','interest','riba','haram income','purify','cleanse','get rid of'] },
  { url: 'https://nzf.org.au/contact/',                topic: 'Contact NZF — phone, email, office address, how to reach us',                                keywords: ['contact','phone','email','reach','address','office','location','call','get in touch'] },
  { url: 'https://nzf.org.au/faq/',                    topic: 'General frequently asked questions about NZF',                                               keywords: ['faq','frequently asked','question','answer','common','general'] },
  { url: 'https://nzf.org.au/zakat-faq/',              topic: 'Zakat frequently asked questions',                                                            keywords: ['zakat faq','zakat question','zakat answer','zakat query'] },
  { url: 'https://nzf.org.au/learn/',                  topic: 'Learn about Zakat — basics, principles, education',                                          keywords: ['learn','education','understand','basics','introduction','what is zakat'] },
  { url: 'https://nzf.org.au/guides/',                 topic: 'Zakat guides — individuals, families, businesses, retirees',                                 keywords: ['guide','guides','how to','handbook','resource','individual','family','retiree'] },
  { url: 'https://nzf.org.au/zakat-resources/',        topic: 'Zakat resources, tools and materials',                                                       keywords: ['resource','resources','material','download','tools','reference'] },
  { url: 'https://nzf.org.au/zakat-impact/',           topic: 'Zakat impact — how much distributed, outcomes, statistics, who has been helped',             keywords: ['impact','outcomes','results','distributed','helped','statistics','transparency','report','data'] },
  { url: 'https://nzf.org.au/right-to-zakat/',        topic: 'Who has the right to receive Zakat — the eight categories (asnaf)',                          keywords: ['who can receive','who is eligible','right to zakat','recipients','eight categories','asnaf','deserving'] },
  { url: 'https://nzf.org.au/local-need/',             topic: 'Local need in Australia — why Zakat should be paid locally',                                 keywords: ['local','australia','local need','australian muslims','locally','why local','near'] },
  { url: 'https://nzf.org.au/business-zakat/',         topic: 'Zakat for businesses and companies',                                                         keywords: ['business','company','trade','commercial','business zakat','stocks','inventory','assets'] },
  { url: 'https://nzf.org.au/zakat-on-superannuation/', topic: 'Zakat on superannuation and retirement funds',                                              keywords: ['super','superannuation','retirement','pension','super fund','smsf'] },
  { url: 'https://nzf.org.au/zakat-crypto/',           topic: 'Zakat on cryptocurrency — Bitcoin, Ethereum etc.',                                            keywords: ['crypto','bitcoin','ethereum','cryptocurrency','digital asset','token','nft'] },
  { url: 'https://nzf.org.au/zakat-for-women/',        topic: 'Zakat for women — jewellery, gold, silver',                                                  keywords: ['women','woman','female','sister','jewellery','jewelry','gold','ornament'] },
  { url: 'https://nzf.org.au/missed-zakat/',           topic: 'Missed or unpaid Zakat from previous years',                                                 keywords: ['missed','past years','owe','back pay','previous years','makeup','unpaid','forgotten','old'] },
  { url: 'https://nzf.org.au/bank/',                   topic: 'Bank details, BSB, account number and PayID for payment',                                    keywords: ['bank','bsb','account number','bank transfer','direct deposit','eft','payid','bpay'] },
  { url: 'https://nzf.org.au/tax-receipt/',            topic: 'Tax receipts and deductible gift recipient (DGR) status',                                    keywords: ['tax','receipt','deductible','ato','tax return','deduction','dgr','tax deductible'] },
  { url: 'https://nzf.org.au/cases/',                  topic: 'Case stories — real stories of people NZF has helped',                                       keywords: ['cases','case stories','stories','who we help','beneficiaries','real stories','examples'] },
  { url: 'https://nzf.org.au/zakat-clinic/',           topic: 'Zakat Clinic — book a consultation to calculate your Zakat',                                 keywords: ['clinic','consultation','book','appointment','speak to','advisor','scholar','sheikh'] },
  { url: 'https://nzf.org.au/zakat-masterclass/',      topic: 'Zakat Masterclass — in-depth Zakat education event',                                         keywords: ['masterclass','class','event','webinar','seminar','workshop','learn in depth'] },
  { url: 'https://nzf.org.au/blog/how-to-calculate-zakat-australia-2025/', topic: 'How to calculate Zakat in Australia',                                    keywords: ['how to calculate','calculation guide','step by step','australia calculate'] },
  { url: 'https://nzf.org.au/blog/what-is-zakat-in-islam/',                topic: 'What is Zakat in Islam',                                                 keywords: ['what is zakat','define zakat','meaning of zakat','zakat definition'] },
  { url: 'https://nzf.org.au/blog/what-is-nisab/',                         topic: 'What is Nisab — the Zakat threshold',                                    keywords: ['nisab','threshold','minimum','gold nisab','silver nisab'] },
  { url: 'https://nzf.org.au/blog/who-has-the-right-to-receive-zakat/',   topic: 'Who has the right to receive Zakat',                                     keywords: ['who receives','recipient','entitled','deserve','eight','category'] },
  { url: 'https://nzf.org.au/blog/zakat-guide-superannuation/',            topic: 'Guide: Zakat on superannuation',                                         keywords: ['super guide','superannuation guide','retirement zakat'] },
  { url: 'https://nzf.org.au/blog/zakat-guide-for-businesses/',            topic: 'Guide: Zakat for businesses',                                            keywords: ['business guide','company zakat guide','trade assets'] },
  { url: 'https://nzf.org.au/blog/what-is-fidyah-and-how-to-calculate-fidyah/', topic: 'What is Fidyah and how to calculate it',                            keywords: ['fidyah guide','how much fidyah','calculate fidyah'] },
  { url: 'https://nzf.org.au/blog/what-is-kaffarah/',                      topic: 'What is Kaffarah',                                                       keywords: ['kaffarah','expiation','penance','oath','broken fast deliberately'] },
  { url: 'https://nzf.org.au/blog/sadaqah-vs-sadaqah-jariyah/',            topic: 'Sadaqah vs Sadaqah Jariyah',                                             keywords: ['sadaqah jariyah','ongoing charity','continuous reward','jariyah'] },
  { url: 'https://nzf.org.au/blog/how-to-get-rid-of-interest-money-in-islam/', topic: 'How to dispose of interest/riba money in Islam',                    keywords: ['interest money','riba','bank interest','how to get rid','dispose','purify income'] },
  { url: 'https://nzf.org.au/poor-and-needy/',         topic: 'The poor and needy — who qualifies, how NZF helps',                                          keywords: ['poor','needy','fuqara','masakin','below poverty','low income'] },
];

// ─── Tool: Search NZF website ──────────────────────────────────────────────────
async function searchNZFWebsite(query) {
  const q = query.toLowerCase();

  // Score each page by keyword match count
  const scored = NZF_PAGES.map(page => {
    const score = page.keywords.filter(kw => q.includes(kw)).length
      + (q.includes(page.topic.toLowerCase()) ? 2 : 0);
    return { ...page, score };
  }).filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2); // Fetch top 2 matching pages

  if (scored.length === 0) {
    return { found: false, message: 'No relevant NZF pages matched this query.' };
  }

  const results = [];

  for (const page of scored) {
    try {
      const res = await fetch(page.url, {
        headers: { 'User-Agent': 'NZFChatAgent/1.0' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        results.push({ url: page.url, topic: page.topic, error: `HTTP ${res.status}` });
        continue;
      }

      const html = await res.text();

      // Strip scripts, styles, SVG
      let text = html
        .replace(/<script[^>]*?>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[^>]*?>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<svg[^>]*?>[\s\S]*?<\/svg>/gi, ' ')
        .replace(/<nav[^>]*?>[\s\S]*?<\/nav>/gi, ' ')
        .replace(/<footer[^>]*?>[\s\S]*?<\/footer>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

      // Trim to 2500 chars to avoid huge context
      if (text.length > 1500) text = text.slice(0, 1500) + '…';

      results.push({ url: page.url, topic: page.topic, content: text });
    } catch (err) {
      results.push({ url: page.url, topic: page.topic, error: err.message });
    }
  }

  return { found: results.length > 0, results };
}

// ─── Tool: Search Coda knowledge base ─────────────────────────────────────────
// ─── Coda row cache ────────────────────────────────────────────────────────
// Fetching all rows is expensive — cache them in module scope so warm Lambda
// instances reuse the same data instead of re-fetching on every message.
let codaCache = null;
let codaCacheExpiry = 0;
const CODA_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getCodaRows() {
  const now = Date.now();
  if (codaCache && now < codaCacheExpiry) return codaCache;

  const url = `https://coda.io/apis/v1/docs/${CODA_DOC_ID}/tables/${CODA_TABLE_ID}/rows`
    + `?limit=500&valueFormat=simpleWithArrays&useColumnNames=true`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${CODA_API_KEY}` } });
  if (!res.ok) throw new Error(`Coda fetch failed: ${res.status}`);

  const data = await res.json();
  codaCache = data.items || [];
  codaCacheExpiry = now + CODA_CACHE_TTL;
  console.log(`[Coda] Cache refreshed — ${codaCache.length} rows`);
  return codaCache;
}

async function searchCodaKnowledge(query) {
  let rows;
  try {
    rows = await getCodaRows();
  } catch (err) {
    return { found: false, error: err.message };
  }

  if (!rows.length) return { found: false, results: [] };

  // Score each row by how many query words appear in the searchable fields
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const scored = data.items.map(row => {
    const v = row.values;
    const haystack = [
      v['Question'] || '',
      v['Answer']   || '',
      v['Tags']     || '',
      v['Category'] || '',
    ].join(' ').toLowerCase();

    const score = words.reduce((acc, word) => {
      if (haystack.includes(word)) acc += 1;
      // Bonus for match in Question or Tags (higher signal)
      if ((v['Question'] || '').toLowerCase().includes(word)) acc += 2;
      if ((v['Tags']     || '').toLowerCase().includes(word)) acc += 1;
      return acc;
    }, 0);

    return { score, v };
  })
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 4);

  if (scored.length === 0) return { found: false, results: [] };

  return {
    found: true,
    results: scored.map(r => ({
      category: r.v['Category'] || '',
      question: r.v['Question'] || '',
      answer:   r.v['Answer']   || '',
      tags:     r.v['Tags']     || '',
    })),
  };
}

// ─── Zoho OAuth token refresh ──────────────────────────────────────────────────
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

// ─── Tool: Create Zoho Desk ticket ────────────────────────────────────────────
async function createZohoDeskTicket({
  name, email, subject, description, department,
  caseNameOnFile, dateApplied, emailOnCase,
  donationDate, donationType, paymentMethod, emailUsedOnline, amountPaid,
  phone, preferredContact,
}) {
  const token  = await getZohoAccessToken();
  const deptId = DEPT[department] || DEPT.general;

  const agentMap = {
    zakat_distribution: AGENT.shahnaz,
    zakat_education:    AGENT.ahmed,
    donor_management:   AGENT.farooq,
    finance:            AGENT.misturah,
    general:            AGENT.munir,
  };
  const assigneeId = agentMap[department] || AGENT.munir;

  let enrichedDescription = description + '\n\n';

  if (department === 'zakat_distribution' && (caseNameOnFile || dateApplied || emailOnCase)) {
    enrichedDescription += '── Application Details ──\n';
    if (caseNameOnFile) enrichedDescription += `Name on case: ${caseNameOnFile}\n`;
    if (dateApplied)    enrichedDescription += `Date applied: ${dateApplied}\n`;
    if (emailOnCase)    enrichedDescription += `Email on case: ${emailOnCase}\n`;
  }

  if (department === 'donor_management' && (donationDate || donationType || paymentMethod || emailUsedOnline || amountPaid)) {
    enrichedDescription += '── Donation Details ──\n';
    if (donationDate)    enrichedDescription += `Date of payment: ${donationDate}\n`;
    if (donationType)    enrichedDescription += `Type of donation: ${donationType}\n`;
    if (paymentMethod)   enrichedDescription += `Payment method: ${paymentMethod}\n`;
    if (emailUsedOnline) enrichedDescription += `Email used online: ${emailUsedOnline}\n`;
    if (amountPaid)      enrichedDescription += `Amount paid: ${amountPaid}\n`;
  }

  if (preferredContact) enrichedDescription += `\n── Contact Preference ──\nPreferred contact method: ${preferredContact}\n`;
  if (phone)            enrichedDescription += `Mobile: ${phone}\n`;
  enrichedDescription += '\n── Raised via ──\nNZF Website Chat Agent';

  const parts    = (name || '').trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] || 'Visitor';

  const res = await fetch('https://desk.zoho.com/api/v1/tickets', {
    method:  'POST',
    headers: {
      Authorization:  `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      orgId:          ZOHO_ORG_ID,
    },
    body: JSON.stringify({
      subject,
      description: enrichedDescription.trim(),
      departmentId: deptId,
      assigneeId,
      status:  'Open',
      channel: 'Web',
      phone:   phone || undefined,
      contact: { lastName, email },
    }),
  });

  const data = await res.json();
  console.log('[ZohoDesk] Ticket API response:', JSON.stringify(data).slice(0, 500));
  if (data.id) return { success: true, ticketId: data.id, ticketNumber: data.ticketNumber };
  return { success: false, error: data.message || JSON.stringify(data) };
}

// ─── Tool definitions for Claude ──────────────────────────────────────────────
const TOOLS = [
  {
    name:        'search_coda_knowledge',
    description: 'Search the NZF Zakat knowledge base for detailed answers about Zakat rules, calculations, eligibility, nisab, superannuation, crypto, gold, business, timing, and all related Zakat topics. Always call this before saying you cannot answer a Zakat question.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural-language search query' },
      },
      required: ['query'],
    },
  },
  {
    name:        'search_nzf_website',
    description: 'Search the NZF website (nzf.org.au) for general information about NZF — how to apply, programs, how to pay Zakat or donate, contact details, impact, guides, calculators, and other organisational information. Use this for questions about NZF as an organisation, not for detailed Zakat jurisprudence (use search_coda_knowledge for that). ONLY returns content from nzf.org.au — never external sites.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What the visitor is looking for on the NZF website' },
      },
      required: ['query'],
    },
  },
  {
    name:        'create_zoho_desk_ticket',
    description: 'Create a support ticket in Zoho Desk once you have collected all required information from the visitor. Do not call this until you have gathered every required field for the ticket type.',
    input_schema: {
      type: 'object',
      properties: {
        name:        { type: 'string', description: 'Full name of the visitor' },
        email:       { type: 'string', description: 'Email address of the visitor' },
        subject:     { type: 'string', description: 'Short ticket subject (max 100 chars)' },
        description: { type: 'string', description: "Summary of the visitor's query in full" },
        department: {
          type: 'string',
          enum: ['zakat_distribution', 'zakat_education', 'donor_management', 'finance', 'general'],
          description: 'Department to route to based on query type',
        },
        caseNameOnFile: { type: 'string', description: 'Name on the application/case (application queries only)' },
        dateApplied:    { type: 'string', description: 'Date the visitor originally applied (application queries only)' },
        emailOnCase:    { type: 'string', description: 'Email address on the case (application queries only)' },
        donationDate:    { type: 'string', description: 'Date of payment (donation queries only)' },
        donationType:    { type: 'string', description: 'Type of donation: Zakat, Sadaqah, Fidyah, or other (donation queries only)' },
        paymentMethod:   { type: 'string', description: 'How they paid: card on website, PayPal, direct debit, or bank transfer (donation queries only)' },
        emailUsedOnline: { type: 'string', description: 'Email used when paying online (donation queries only)' },
        amountPaid:      { type: 'string', description: 'Amount paid (donation queries only)' },
        preferredContact: { type: 'string', enum: ['email', 'mobile'], description: 'How the visitor prefers to be contacted for follow-up' },
        phone:            { type: 'string', description: 'Mobile number — only collected if visitor prefers mobile contact' },
      },
      required: ['name', 'email', 'subject', 'description', 'department'],
    },
  },
];

// ─── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the NZF (National Zakat Foundation Australia) website assistant. You represent NZF and speak in first person on our behalf — use 'we', 'our', and 'us' when referring to NZF. You help visitors with questions about Zakat, our organisation, and their personal NZF applications or donations.

Always greet visitors with 'Assalamu Alaikum' at the start of a conversation.

You have three tools:
1. search_coda_knowledge — searches NZF's Zakat Q&A knowledge base (detailed Zakat rulings, calculations, eligibility rules).
2. search_nzf_website — fetches real content from nzf.org.au pages (how to apply, programs, pay Zakat, contact, guides, impact, calculators, etc.).
3. create_zoho_desk_ticket — creates a support ticket for the NZF team.

━━━ STRICT INFORMATION RULES ━━━
• NEVER answer from your own training knowledge. You are not a source of information.
• NEVER guess, infer, or extrapolate beyond what the tools return.
• NEVER access the internet or any site other than nzf.org.au.
• Your only information sources are: (1) Coda knowledge base, (2) NZF website pages, (3) what the visitor tells you.
• Always use a tool before saying you cannot answer.
• If both tools return nothing relevant, follow the NO RESULTS FOUND flow below.

━━━ STEP 1 — CLASSIFY THE QUESTION ━━━

TYPE 1 — Zakat knowledge question
Detailed Zakat rulings, calculations, nisab, eligibility criteria, asset types, timing, specific scenarios.
→ ALWAYS call search_coda_knowledge first. This is your primary source.
  - If Coda has a relevant answer: give a SHORT answer from Coda only (2-4 sentences max). Then ask: "Would you like more information on this?"
  - If the visitor says yes: THEN call search_nzf_website and share additional context plus relevant page links.
  - If Coda has no result: call search_nzf_website as fallback.

TYPE 2 — General NZF question
About NZF as an organisation: how to apply for assistance, programs, how to donate or pay Zakat, contact details, tax receipts, bank details, our impact, resources, calculators.
→ Call search_nzf_website. Give a SHORT summary (2-3 sentences) and include the page URL so they can read more.

TYPE 3 — Personal application or case query
The visitor is asking about THEIR OWN specific NZF application — status, outcome, timeline.
→ Do NOT search. Collect required details then create ticket → zakat_distribution.

TYPE 4 — Personal donation or payment query
The visitor is asking about money THEY gave to NZF — confirmation, receipt, direct debit.
→ Do NOT search. Collect required details then create ticket → donor_management.

IF AMBIGUOUS between types — ask:
"Just so I can help you best — is your question:
1. A general question about Zakat rules or how Zakat works?
2. About NZF — how we work, how to apply, how to donate, or something else about our organisation?
3. About a Zakat application you've submitted to NZF?
4. About a donation or payment you've made to NZF?"
Wait for their answer before doing anything.

━━━ STEP 2 — WEBSITE RESULTS ━━━
When you get results from search_nzf_website:
• Summarise the relevant information clearly and warmly, in first person as NZF — say "Our website shows...", "We offer...", "Here's what we have on that..." Never say "based on what I found", "according to my search", or refer to NZF in the third person.
• Always include the page URL at the end as a plain URL so the visitor can visit it directly (the chat will make it clickable automatically).
• Only share what is actually on the page — do not add anything from your own knowledge.
• If two pages are returned, reference both if both are relevant.

━━━ STEP 3 — COLLECT INFO BEFORE CREATING A TICKET ━━━

For TYPE 3 (Application/Case) — collect before creating ticket:
• Name the case is registered under
• Date they originally applied
• Email address on the case

For TYPE 4 (Donation) — collect before creating ticket:
• Date of payment
• Type of donation (Zakat, Sadaqah, Fidyah, or other)
• How they paid: card on website, PayPal, direct debit through website, or bank transfer
• If paid online: email address they used
• Amount paid

Ask conversationally — 2 questions at a time. Once you have everything, create the ticket.

━━━ TICKET ROUTING ━━━
• zakat_distribution — application/case queries → Shahnaz
• zakat_education    — unanswered Zakat knowledge questions → Ahmed
• donor_management   — donation/payment queries → Farooq
• finance            — payment confirmation, receipts → Misturah
• general            — everything else → Munir

━━━ NO RESULTS FOUND — UNANSWERED QUERIES ━━━
If you have searched both search_coda_knowledge AND search_nzf_website and neither returned anything relevant to the visitor's question:

1. Apologise warmly. Example:
   "I'm sorry, I wasn't able to find information on that in our knowledge base or website. I don't want to guess or give you incorrect information."

2. Offer to escalate:
   "Would you like me to raise this with one of our team members who can follow up with you directly?"

3. If they say yes — ask for their contact preference:
   "Would you prefer to be contacted by email or mobile?"

4. If they choose EMAIL:
   • Confirm you'll use the email they provided at the start of the chat.
   • Create the ticket with preferredContact: "email". No phone needed.

5. If they choose MOBILE:
   • Ask: "What's the best mobile number to reach you on?"
   • Wait for their number, then create the ticket with preferredContact: "mobile" and phone: their number.

6. If they say no (don't want a ticket):
   • Acknowledge warmly and let them know they can always reach NZF directly at 1300 663 729 or via nzf.org.au/contact/

This flow ONLY applies when BOTH tools have returned no relevant results. If even one tool returned something useful, respond with that — do not apologise or offer escalation unnecessarily.

━━━ TONE & STYLE ━━━
• Warm, human, and clear. Never robotic.
• This is an Islamic not-for-profit. Be respectful, courteous, and culturally aware at all times.
• Always be polite — no matter how the conversation goes, maintain a respectful and helpful tone.
• Plain language. No jargon.
• Speak in first person as NZF — "we", "our", "us".
• Never end without offering a next step.
• KEEP RESPONSES SHORT — 2 to 4 sentences per reply. This is a chat, not an essay.
• Lead with the answer first, context second.
• If there is more to say, ask the visitor if they would like more detail — don't dump everything at once.
• One idea per message. Don't bundle multiple topics into a single response.
• Once a ticket is created: if the tool returns success:true, confirm warmly and tell them which team member will follow up and by which method (email or mobile). Include the ticket number if returned.
• If the tool returns success:false or an error: do NOT tell the visitor a ticket was created. Instead say: "I'm sorry, something went wrong on our end and I wasn't able to raise that ticket. Please contact us directly at 1300 663 729 or via nzf.org.au/contact/ and our team will be happy to help you." Never fabricate a ticket confirmation.`;

// ─── CORS headers ──────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
};

// ─── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };

  try {
    const { messages, visitorName, visitorEmail } = JSON.parse(event.body);

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const systemWithVisitor = visitorName && visitorEmail
      ? `${SYSTEM_PROMPT}\n\nVISITOR IDENTITY (collected at session start):\nName: ${visitorName}\nEmail: ${visitorEmail}`
      : SYSTEM_PROMPT;

    let claudeMessages = messages;
    let response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system:     systemWithVisitor,
      tools:      TOOLS,
      messages:   claudeMessages,
    });

    // ── Tool use loop ────────────────────────────────────────────────────────
    let iterations = 0;
    while (response.stop_reason === 'tool_use' && iterations < 6) {
      iterations++;
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

      // Run all tool calls in parallel for faster responses
      const toolResults = await Promise.all(toolUseBlocks.map(async (toolUse) => {
        let result;
        try {
          if      (toolUse.name === 'search_coda_knowledge')   result = await searchCodaKnowledge(toolUse.input.query);
          else if (toolUse.name === 'search_nzf_website')      result = await searchNZFWebsite(toolUse.input.query);
          else if (toolUse.name === 'create_zoho_desk_ticket') result = await createZohoDeskTicket(toolUse.input);
          else result = { error: `Unknown tool: ${toolUse.name}` };
        } catch (toolErr) {
          console.error(`Tool error [${toolUse.name}]:`, toolErr);
          result = { error: toolErr.message };
        }
        return { type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) };
      }));

      claudeMessages = [
        ...claudeMessages,
        { role: 'assistant', content: response.content },
        { role: 'user',      content: toolResults },
      ];

      response = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 700,
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
