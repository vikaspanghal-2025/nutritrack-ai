import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.TABLE_NAME || 'NutriTrackData';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Id',
};

function respond(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
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
      body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body);
    }
  } catch (e) {
    return respond(400, { error: 'Invalid JSON body' });
  }

  try {
    // ---- PROFILE ----
    if (path === '/api/profile' && method === 'GET') {
      const result = await ddb.send(new GetCommand({
        TableName: TABLE,
        Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
      }));
      return respond(200, result.Item?.data || null);
    }

    if (path === '/api/profile' && method === 'PUT') {
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
          data: body,
          updatedAt: new Date().toISOString(),
        },
      }));
      return respond(200, { ok: true });
    }

    // ---- FOOD LOG ----
    if (path === '/api/food' && method === 'POST') {
      const date = body.date || new Date().toISOString().split('T')[0];
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: `FOOD#${date}#${body.id}`,
          data: body,
          date,
          updatedAt: new Date().toISOString(),
        },
      }));
      return respond(201, { ok: true, id: body.id });
    }

    if (path === '/api/food' && method === 'GET') {
      const date = event.queryStringParameters?.date || new Date().toISOString().split('T')[0];
      const result = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': `FOOD#${date}`,
        },
      }));
      return respond(200, (result.Items || []).map(i => i.data));
    }

    if (path.startsWith('/api/food/') && method === 'DELETE') {
      const foodId = path.split('/api/food/')[1];
      const date = event.queryStringParameters?.date || new Date().toISOString().split('T')[0];
      await ddb.send(new DeleteCommand({
        TableName: TABLE,
        Key: { PK: `USER#${userId}`, SK: `FOOD#${date}#${foodId}` },
      }));
      return respond(200, { ok: true });
    }

    // ---- ACTIVITY LOG ----
    if (path === '/api/activity' && method === 'POST') {
      const date = body.date || new Date().toISOString().split('T')[0];
      await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: `ACTIVITY#${date}#${body.id}`,
          data: body,
          date,
          updatedAt: new Date().toISOString(),
        },
      }));
      return respond(201, { ok: true, id: body.id });
    }

    if (path === '/api/activity' && method === 'GET') {
      const date = event.queryStringParameters?.date || new Date().toISOString().split('T')[0];
      const result = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': `ACTIVITY#${date}`,
        },
      }));
      return respond(200, (result.Items || []).map(i => i.data));
    }

    if (path.startsWith('/api/activity/') && method === 'DELETE') {
      const actId = path.split('/api/activity/')[1];
      const date = event.queryStringParameters?.date || new Date().toISOString().split('T')[0];
      await ddb.send(new DeleteCommand({
        TableName: TABLE,
        Key: { PK: `USER#${userId}`, SK: `ACTIVITY#${date}#${actId}` },
      }));
      return respond(200, { ok: true });
    }

    // ---- DAILY SUMMARY (for weekly trends) ----
    if (path === '/api/logs' && method === 'GET') {
      const days = parseInt(event.queryStringParameters?.days || '7');
      const items = [];
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date = d.toISOString().split('T')[0];
        
        const [foods, activities] = await Promise.all([
          ddb.send(new QueryCommand({
            TableName: TABLE,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': `FOOD#${date}` },
          })),
          ddb.send(new QueryCommand({
            TableName: TABLE,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': `ACTIVITY#${date}` },
          })),
        ]);

        items.push({
          date,
          foods: (foods.Items || []).map(i => i.data),
          activities: (activities.Items || []).map(i => i.data),
        });
      }
      return respond(200, items);
    }

    return respond(404, { error: 'Not found' });
  } catch (err) {
    console.error('Error:', err);
    return respond(500, { error: err.message });
  }
}
