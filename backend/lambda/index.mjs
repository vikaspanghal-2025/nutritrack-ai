import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.TABLE_NAME || 'NutriTrackData';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'anthropic.claude-sonnet-4-20250514-v1:0';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Id',
};

function respond(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

// Lazy-load Bedrock client only when needed (it's in the Lambda runtime)
let bedrockClient = null;
async function getBedrock() {
  if (!bedrockClient) {
    const { BedrockRuntimeClient } = await import('@aws-sdk/client-bedrock-runtime');
    bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
  }
  return bedrockClient;
}

export async function handler(event) {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return respond(200, { ok: true });
  }

  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.path;
  const userId = event.headers?.['x-user-id'] || event.headers?.['X-User-Id'] || 'anonymous';
  let body = {};

  try {
    if (event.body) {
      const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
      try {
        body = JSON.parse(raw);
      } catch (jsonErr) {
        // Try to extract numbers from messy Shortcuts output
        // Shortcuts might send something like: {"syncToken":"abc","steps":5,432 steps,"activeCalories":342.1 kcal}
        const cleaned = raw
          .replace(/(\d),(\d)/g, '$1$2')           // remove comma in numbers like 5,432
          .replace(/(\d+\.?\d*)\s*[a-zA-Z]+/g, '$1') // remove units like "steps", "kcal", "cal"
          .replace(/:\s*\./g, ': 0.')               // fix :.5 → 0.5
          .trim();
        try {
          body = JSON.parse(cleaned);
        } catch {
          // Last resort: try to extract syncToken and numbers
          const tokenMatch = raw.match(/"syncToken"\s*:\s*"([^"]+)"/);
          const stepsMatch = raw.match(/"steps"\s*:\s*"?(\d[\d,]*\.?\d*)/);
          const calMatch = raw.match(/"activeCalories"\s*:\s*"?(\d[\d,]*\.?\d*)/);
          body = {
            syncToken: tokenMatch?.[1] || '',
            steps: stepsMatch ? parseFloat(stepsMatch[1].replace(/,/g, '')) : 0,
            activeCalories: calMatch ? parseFloat(calMatch[1].replace(/,/g, '')) : 0,
          };
        }
      }
    }
  } catch (e) {
    return respond(400, { error: 'Could not parse request body', detail: e.message });
  }

  try {
    // ---- PROFILE ----
    if (path === '/api/profile' && method === 'GET') {
      const result = await ddb.send(new GetCommand({ TableName: TABLE, Key: { PK: `USER#${userId}`, SK: 'PROFILE' } }));
      return respond(200, result.Item?.data || null);
    }
    if (path === '/api/profile' && method === 'PUT') {
      await ddb.send(new PutCommand({ TableName: TABLE, Item: { PK: `USER#${userId}`, SK: 'PROFILE', data: body, updatedAt: new Date().toISOString() } }));
      return respond(200, { ok: true });
    }

    // ---- FOOD LOG ----
    if (path === '/api/food' && method === 'POST') {
      const date = body.date || new Date().toISOString().split('T')[0];
      await ddb.send(new PutCommand({ TableName: TABLE, Item: { PK: `USER#${userId}`, SK: `FOOD#${date}#${body.id}`, data: body, date, updatedAt: new Date().toISOString() } }));
      return respond(201, { ok: true, id: body.id });
    }
    if (path === '/api/food' && method === 'GET') {
      const date = event.queryStringParameters?.date || new Date().toISOString().split('T')[0];
      const result = await ddb.send(new QueryCommand({ TableName: TABLE, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)', ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': `FOOD#${date}` } }));
      return respond(200, (result.Items || []).map(i => i.data));
    }
    if (path.startsWith('/api/food/') && method === 'DELETE') {
      const foodId = path.split('/api/food/')[1];
      const date = event.queryStringParameters?.date || new Date().toISOString().split('T')[0];
      await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { PK: `USER#${userId}`, SK: `FOOD#${date}#${foodId}` } }));
      return respond(200, { ok: true });
    }

    // ---- ACTIVITY LOG ----
    if (path === '/api/activity' && method === 'POST') {
      const date = body.date || new Date().toISOString().split('T')[0];
      await ddb.send(new PutCommand({ TableName: TABLE, Item: { PK: `USER#${userId}`, SK: `ACTIVITY#${date}#${body.id}`, data: body, date, updatedAt: new Date().toISOString() } }));
      return respond(201, { ok: true, id: body.id });
    }
    if (path === '/api/activity' && method === 'GET') {
      const date = event.queryStringParameters?.date || new Date().toISOString().split('T')[0];
      const result = await ddb.send(new QueryCommand({ TableName: TABLE, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)', ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': `ACTIVITY#${date}` } }));
      return respond(200, (result.Items || []).map(i => i.data));
    }
    if (path.startsWith('/api/activity/') && method === 'DELETE') {
      const actId = path.split('/api/activity/')[1];
      const date = event.queryStringParameters?.date || new Date().toISOString().split('T')[0];
      await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { PK: `USER#${userId}`, SK: `ACTIVITY#${date}#${actId}` } }));
      return respond(200, { ok: true });
    }

    // ---- WEEKLY LOGS ----
    if (path === '/api/logs' && method === 'GET') {
      const days = parseInt(event.queryStringParameters?.days || '7');
      const items = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const date = d.toISOString().split('T')[0];
        const [foods, activities] = await Promise.all([
          ddb.send(new QueryCommand({ TableName: TABLE, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)', ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': `FOOD#${date}` } })),
          ddb.send(new QueryCommand({ TableName: TABLE, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)', ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': `ACTIVITY#${date}` } })),
        ]);
        items.push({ date, foods: (foods.Items || []).map(i => i.data), activities: (activities.Items || []).map(i => i.data) });
      }
      return respond(200, items);
    }

    // ---- AI FOOD ANALYSIS (Claude via Bedrock) ----
    if (path === '/api/analyze-food' && method === 'POST') {
      const { text, imageBase64 } = body;
      if (!text && !imageBase64) return respond(400, { error: 'Provide text or imageBase64' });

      const systemPrompt = `You are a nutrition analysis AI specializing in Indian and international cuisine. Given a food description or image, identify each food item and provide accurate nutritional estimates.

RESPOND WITH ONLY VALID JSON in this exact format:
{"items":[{"name":"Food Name","quantity":1,"unit":"piece","calories":150,"protein":5,"carbs":20,"fats":6}]}

Rules:
- Be specific with food names (e.g. "Aloo Paratha" not "paratha", "Masala Dosa" not "dosa")
- Use standard Indian home-cooked serving sizes
- All values are for the total quantity specified
- Protein, carbs, fats in grams
- List each food item separately
- unit must be one of: piece, bowl, cup, serving, plate, glass, tablespoon
- Return ONLY the JSON object, no markdown, no explanation`;

      const messages = [];
      if (imageBase64) {
        messages.push({
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: text || 'Identify all food items in this image and provide nutritional breakdown.' },
          ],
        });
      } else {
        messages.push({ role: 'user', content: `Analyze this food and provide nutritional breakdown: "${text}"` });
      }

      const bedrock = await getBedrock();
      const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');

      const bedrockResponse = await bedrock.send(new InvokeModelCommand({
        modelId: CLAUDE_MODEL,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        }),
      }));

      const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
      const content = responseBody.content?.[0]?.text || '{"items":[]}';

      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };
      } catch {
        console.error('Failed to parse Claude response:', content);
        parsed = { items: [] };
      }

      return respond(200, parsed);
    }

    // ---- APPLE HEALTH SYNC (receives data from iOS Shortcut) ----
    if (path === '/api/health-sync' && method === 'POST') {
      // Log the raw body for debugging
      const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
      console.log('Health sync raw body:', rawBody);
      console.log('Health sync parsed body:', JSON.stringify(body));

      const { activities: healthActivities, steps, activeCalories, syncToken } = body;
      const syncUserId = syncToken || userId;
      // Use PST for date key
      const date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
      const results = [];
      const debug = { rawSteps: steps, rawCalories: activeCalories, parsedSteps: 0, parsedCalories: 0 };

      // Parse numbers that might have units or commas
      const parsedSteps = typeof steps === 'number' ? steps : parseFloat(String(steps || '0').replace(/[^0-9.]/g, '')) || 0;
      const parsedCalories = typeof activeCalories === 'number' ? activeCalories : parseFloat(String(activeCalories || '0').replace(/[^0-9.]/g, '')) || 0;
      debug.parsedSteps = parsedSteps;
      debug.parsedCalories = parsedCalories;

      // Always import active calories if > 0
      if (parsedCalories > 0) {
        const id = `health-cal-${Date.now()}`;
        const entry = {
          id,
          type: 'Active Calories (Apple Health)',
          duration: 0,
          caloriesBurned: Math.round(parsedCalories),
          intensity: parsedCalories > 300 ? 'high' : parsedCalories > 150 ? 'moderate' : 'low',
          timestamp: new Date().toISOString(),
          source: 'healthkit',
        };
        await ddb.send(new PutCommand({
          TableName: TABLE,
          Item: { PK: `USER#${syncUserId}`, SK: `ACTIVITY#${date}#${id}`, data: entry, date, updatedAt: new Date().toISOString() },
        }));
        results.push(entry);
      }

      // Import individual workouts if provided
      if (healthActivities && Array.isArray(healthActivities)) {
        for (const act of healthActivities) {
          const id = `health-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const entry = {
            id,
            type: act.type || 'Workout',
            duration: act.duration || 0,
            caloriesBurned: act.calories || 0,
            intensity: act.calories > 300 ? 'high' : act.calories > 150 ? 'moderate' : 'low',
            timestamp: act.startDate || new Date().toISOString(),
            source: 'healthkit',
          };
          await ddb.send(new PutCommand({
            TableName: TABLE,
            Item: { PK: `USER#${syncUserId}`, SK: `ACTIVITY#${date}#${id}`, data: entry, date, updatedAt: new Date().toISOString() },
          }));
          results.push(entry);
        }
      }

      // Store steps
      if (parsedSteps > 0) {
        await ddb.send(new PutCommand({
          TableName: TABLE,
          Item: { PK: `USER#${syncUserId}`, SK: `STEPS#${date}`, data: { steps: parsedSteps, date }, updatedAt: new Date().toISOString() },
        }));
      }

      return respond(200, { ok: true, imported: results.length, activities: results, debug });
    }

    // ---- GET SYNC TOKEN (for Apple Shortcut setup) ----
    if (path === '/api/sync-token' && method === 'GET') {
      return respond(200, { syncToken: userId, apiUrl: `https://${event.requestContext?.domainName || 'jjt5po34g6.execute-api.us-east-1.amazonaws.com'}` });
    }

    return respond(404, { error: 'Not found' });
  } catch (err) {
    console.error('Error:', err);
    return respond(500, { error: err.message });
  }
}
