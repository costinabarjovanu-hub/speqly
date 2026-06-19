const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function parseJSON(text) {
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch {}
  }
  if (objectMatch) {
    try { return JSON.parse(objectMatch[0]); } catch {}
  }
  return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
}

// --- Prompts for ANALYZE (returns features list) ---

function buildMockupAnalysisPrompt(domainContext) {
  return `You are an expert UX analyst and product manager. Analyze the provided UI mockup/screenshot and identify all distinct features, components, and user interactions.

${domainContext ? `Domain context: ${domainContext}\n` : ''}

For each distinct UI feature or component you see, extract:
- A concise feature title (action-oriented, under 50 characters)
- A brief description of what it does and how it works
- The source — where in the UI you identified this (e.g., "top navigation bar", "login modal", "product grid")

Aim for 4–10 features depending on UI complexity.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "observations": "2-3 sentence summary of the UI and its purpose",
  "features": [
    {
      "id": "feature-1",
      "title": "Feature title",
      "description": "What this feature does and how users interact with it",
      "source": "Location/element in the UI mockup"
    }
  ]
}`;
}

function buildDocumentAnalysisPrompt(domainContext) {
  return `You are an expert product manager and business analyst. Analyze the provided specification document and extract all distinct functional requirements, user-facing features, and system capabilities described.

${domainContext ? `Domain context: ${domainContext}\n` : ''}

For each distinct feature or requirement you find:
- A concise feature title (action-oriented, under 50 characters)
- A brief description of what needs to be built
- The source — reference to where in the document this requirement appears (e.g., "Section 2.1", "page 4 — Authentication", "requirement FR-003")

Aim for 4–12 features depending on document scope.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "observations": "2-3 sentence summary of the document and its scope",
  "features": [
    {
      "id": "feature-1",
      "title": "Feature title",
      "description": "What needs to be built and why",
      "source": "Section/location reference in the document"
    }
  ]
}`;
}

// --- Prompt for GENERATE STORIES (features → full Jira tickets) ---

function buildGenerateStoriesPrompt(features, config) {
  const acExample = config.acFormat === 'given-when-then'
    ? 'Given [precondition], When [action], Then [expected outcome]'
    : 'User should be able to [action]';

  const featuresList = features.map(f =>
    `- ID: ${f.id}\n  Title: ${f.title}\n  Description: ${f.description}\n  Source: ${f.source}`
  ).join('\n\n');

  return `You are an expert product manager. Convert the following features into complete Jira-ready development tickets.

Features to convert:
${featuresList}

${config.domainContext ? `Domain context: ${config.domainContext}\n` : ''}

Instructions:
- One ticket per feature (keep the same id as the feature)
- Story points max: ${config.maxStoryPoints}
- Acceptance criteria format: "${acExample}"
- AC types: "shall" (positive requirement), "not" (restriction/should NOT), "edge" (edge case)
- Generate clarificationQuestions only if something is genuinely ambiguous

Return ONLY a JSON array of ticket objects (no markdown, no explanation):
[
  {
    "id": "feature-1",
    "title": "Short action-oriented title under 60 characters",
    "storyPoints": 3,
    "priority": "High|Medium|Low",
    "userStory": {
      "as": "specific user role",
      "iWantTo": "specific action",
      "soThat": "clear business benefit"
    },
    "acceptanceCriteria": [
      { "type": "shall", "text": "${acExample}" },
      { "type": "not", "text": "..." },
      { "type": "edge", "text": "..." }
    ],
    "clarificationQuestions": [],
    "labels": ["frontend", "ui"],
    "description": "1-2 sentence technical implementation description"
  }
]`;
}

// --- Prompt for REGENERATE (single ticket with clarification answers) ---

function buildRegeneratePrompt(ticket, answers, config) {
  const acExample = config.acFormat === 'given-when-then'
    ? 'Given [precondition], When [action], Then [expected outcome]'
    : 'User should be able to [action]';

  const answersText = (ticket.clarificationQuestions || [])
    .map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || '(not answered)'}`)
    .join('\n\n');

  return `You are an expert product manager. Revise the following development ticket by incorporating the answers to clarification questions into the acceptance criteria.

Original ticket:
${JSON.stringify(ticket, null, 2)}

Clarification Q&A:
${answersText}

Instructions:
- Incorporate the answers into specific, concrete acceptance criteria
- Use format: "${acExample}"
- Story points max: ${config.maxStoryPoints}
- Set clarificationQuestions to empty array [] since questions are now answered
- Keep the same ticket id

Return ONLY a JSON object (no markdown, no explanation):
{
  "id": "${ticket.id}",
  "title": "Short action-oriented title under 60 characters",
  "storyPoints": number,
  "priority": "High|Medium|Low",
  "userStory": { "as": "...", "iWantTo": "...", "soThat": "..." },
  "acceptanceCriteria": [{ "type": "shall|not|edge", "text": "..." }],
  "clarificationQuestions": [],
  "labels": ["label1"],
  "description": "1-2 sentence technical description"
}`;
}

// --- ADF builder for Jira ---

function buildJiraDescription(ticket) {
  const userStoryText = `As a ${ticket.userStory.as}, I want to ${ticket.userStory.iWantTo}, so that ${ticket.userStory.soThat}.`;

  const acItems = (ticket.acceptanceCriteria || []).map(ac => ({
    type: 'listItem',
    content: [{
      type: 'paragraph',
      content: [{ type: 'text', text: `[${ac.type.toUpperCase()}] ${ac.text}` }]
    }]
  }));

  return {
    type: 'doc',
    version: 1,
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: ticket.description || '' }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'User Story' }] },
      { type: 'paragraph', content: [{ type: 'text', text: userStoryText }] },
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Acceptance Criteria' }] },
      ...(acItems.length > 0 ? [{ type: 'bulletList', content: acItems }] : [])
    ]
  };
}

// ============================================================
// POST /api/analyze — returns {observations, features}
// ============================================================
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    const config = JSON.parse(req.body.config);
    const inputType = config.inputType || 'mockup';
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!config.anthropicKey) return res.status(400).json({ error: 'Anthropic API key required' });

    const client = new Anthropic({ apiKey: config.anthropicKey });

    let contentBlocks;

    if (inputType === 'mockup') {
      const base64Image = file.buffer.toString('base64');
      const mediaType = file.mimetype || 'image/png';
      contentBlocks = [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
        { type: 'text', text: buildMockupAnalysisPrompt(config.domainContext) }
      ];
    } else {
      // Document: PDF or text
      const isPdf = file.mimetype === 'application/pdf';
      if (isPdf) {
        const base64Doc = file.buffer.toString('base64');
        contentBlocks = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Doc } },
          { type: 'text', text: buildDocumentAnalysisPrompt(config.domainContext) }
        ];
      } else {
        // Plain text / markdown / spec
        const textContent = file.buffer.toString('utf-8');
        contentBlocks = [
          { type: 'text', text: `Document content:\n\n${textContent}\n\n---\n\n${buildDocumentAnalysisPrompt(config.domainContext)}` }
        ];
      }
    }

    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: contentBlocks }]
    });

    const response = await stream.finalMessage();
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    const parsed = parseJSON(textContent);
    res.json(parsed);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// ============================================================
// POST /api/generate-stories — features + acFormat → full tickets
// ============================================================
app.post('/api/generate-stories', async (req, res) => {
  try {
    const { features, config } = req.body;
    if (!config.anthropicKey) return res.status(400).json({ error: 'Anthropic API key required' });
    if (!features || features.length === 0) return res.status(400).json({ error: 'No features provided' });

    const client = new Anthropic({ apiKey: config.anthropicKey });

    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: buildGenerateStoriesPrompt(features, config) }]
    });

    const response = await stream.finalMessage();
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    const tickets = parseJSON(textContent);
    res.json({ tickets });
  } catch (err) {
    console.error('Generate stories error:', err);
    res.status(500).json({ error: err.message || 'Story generation failed' });
  }
});

// ============================================================
// POST /api/regenerate — single ticket with clarification answers
// ============================================================
app.post('/api/regenerate', async (req, res) => {
  try {
    const { ticket, answers, config } = req.body;
    if (!config.anthropicKey) return res.status(400).json({ error: 'Anthropic API key required' });

    const client = new Anthropic({ apiKey: config.anthropicKey });

    const stream = client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: buildRegeneratePrompt(ticket, answers, config) }]
    });

    const response = await stream.finalMessage();
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    const parsed = parseJSON(textContent);
    res.json(parsed);
  } catch (err) {
    console.error('Regenerate error:', err);
    res.status(500).json({ error: err.message || 'Regeneration failed' });
  }
});

// ============================================================
// POST /api/jira/push — unchanged
// ============================================================
app.post('/api/jira/push', async (req, res) => {
  try {
    const { tickets, jiraConfig } = req.body;
    const { domain, email, token, projectKey } = jiraConfig;

    if (!domain || !email || !token || !projectKey) {
      return res.status(400).json({ error: 'Missing Jira configuration' });
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const baseUrl = `https://${cleanDomain}`;
    const auth = Buffer.from(`${email}:${token}`).toString('base64');

    const results = [];

    for (const ticket of tickets) {
      try {
        const sanitizedLabels = (ticket.labels || []).map(l =>
          l.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
        );

        const issueBody = {
          fields: {
            project: { key: projectKey.toUpperCase() },
            summary: ticket.title,
            description: buildJiraDescription(ticket),
            issuetype: { name: 'Story' },
            priority: { name: ticket.priority },
            customfield_10016: ticket.storyPoints,
            labels: sanitizedLabels
          }
        };

        const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(issueBody)
        });

        const data = await response.json();

        if (response.ok) {
          results.push({ ticketId: ticket.id, success: true, key: data.key, url: `${baseUrl}/browse/${data.key}` });
        } else {
          results.push({
            ticketId: ticket.id,
            success: false,
            error: data.errorMessages?.join(', ') || JSON.stringify(data.errors) || 'Jira API error'
          });
        }
      } catch (ticketErr) {
        results.push({ ticketId: ticket.id, success: false, error: ticketErr.message });
      }
    }

    res.json({ results });
  } catch (err) {
    console.error('Jira push error:', err);
    res.status(500).json({ error: err.message || 'Jira push failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Speqly backend running on port ${PORT}`));
