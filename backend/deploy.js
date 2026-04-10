import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, CreateBucketCommand, PutBucketWebsiteCommand, PutBucketPolicyCommand, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand, GetFunctionCommand, AddPermissionCommand } from '@aws-sdk/client-lambda';
import { IAMClient, CreateRoleCommand, AttachRolePolicyCommand, GetRoleCommand } from '@aws-sdk/client-iam';
import { ApiGatewayV2Client, CreateApiCommand, CreateStageCommand, CreateIntegrationCommand, CreateRouteCommand, GetApisCommand } from '@aws-sdk/client-apigatewayv2';
import { CloudFrontClient, CreateDistributionCommand } from '@aws-sdk/client-cloudfront';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = 'NutriTrackData';
const FUNCTION_NAME = 'nutritrack-api';
const ROLE_NAME = 'nutritrack-lambda-role';
const API_NAME = 'nutritrack-api';
const BUCKET_PREFIX = 'nutritrack-ai-frontend';

const ddb = new DynamoDBClient({ region: REGION });
const s3 = new S3Client({ region: REGION });
const lambda = new LambdaClient({ region: REGION });
const iam = new IAMClient({ region: REGION });
const apigw = new ApiGatewayV2Client({ region: REGION });

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---- 1. DynamoDB Table ----
async function createTable() {
  console.log('📦 Creating DynamoDB table...');
  try {
    await ddb.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log('   Table already exists.');
    return;
  } catch (e) {
    if (e.name !== 'ResourceNotFoundException') throw e;
  }

  await ddb.send(new CreateTableCommand({
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  }));
  console.log('   Table created. Waiting for active...');
  await sleep(5000);
}

// ---- 2. IAM Role ----
async function createRole() {
  console.log('🔐 Creating IAM role...');
  let roleArn;
  try {
    const existing = await iam.send(new GetRoleCommand({ RoleName: ROLE_NAME }));
    roleArn = existing.Role.Arn;
    console.log('   Role already exists.');
  } catch (e) {
    const result = await iam.send(new CreateRoleCommand({
      RoleName: ROLE_NAME,
      AssumeRolePolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
    }));
    roleArn = result.Role.Arn;

    await iam.send(new AttachRolePolicyCommand({
      RoleName: ROLE_NAME,
      PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }));
    await iam.send(new AttachRolePolicyCommand({
      RoleName: ROLE_NAME,
      PolicyArn: 'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
    }));
    console.log('   Role created. Waiting for propagation...');
    await sleep(10000);
  }
  return roleArn;
}

// ---- 3. Lambda Function ----
async function createZip() {
  return new Promise((resolve, reject) => {
    const output = createWriteStream('/tmp/nutritrack-lambda.zip');
    const archive = archiver('zip');
    archive.pipe(output);
    archive.file(join(import.meta.dirname, 'lambda/index.mjs'), { name: 'index.mjs' });
    archive.finalize();
    output.on('close', () => resolve(readFileSync('/tmp/nutritrack-lambda.zip')));
    output.on('error', reject);
  });
}

async function deployLambda(roleArn) {
  console.log('⚡ Deploying Lambda function...');
  const zipBuffer = await createZip();

  try {
    await lambda.send(new GetFunctionCommand({ FunctionName: FUNCTION_NAME }));
    await lambda.send(new UpdateFunctionCodeCommand({
      FunctionName: FUNCTION_NAME,
      ZipFile: zipBuffer,
    }));
    console.log('   Lambda updated.');
  } catch (e) {
    await lambda.send(new CreateFunctionCommand({
      FunctionName: FUNCTION_NAME,
      Runtime: 'nodejs20.x',
      Handler: 'index.handler',
      Role: roleArn,
      Code: { ZipFile: zipBuffer },
      Environment: { Variables: { TABLE_NAME } },
      Timeout: 30,
      MemorySize: 256,
    }));
    console.log('   Lambda created.');
  }
  await sleep(3000);
}

// ---- 4. API Gateway ----
async function createApiGateway() {
  console.log('🌐 Creating API Gateway...');

  // Check if API already exists
  const apis = await apigw.send(new GetApisCommand({}));
  let api = apis.Items?.find(a => a.Name === API_NAME);

  if (!api) {
    const result = await apigw.send(new CreateApiCommand({
      Name: API_NAME,
      ProtocolType: 'HTTP',
      CorsConfiguration: {
        AllowOrigins: ['*'],
        AllowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        AllowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
      },
    }));
    api = result;

    // Get Lambda ARN
    const fn = await lambda.send(new GetFunctionCommand({ FunctionName: FUNCTION_NAME }));
    const lambdaArn = fn.Configuration.FunctionArn;

    // Create integration
    const integration = await apigw.send(new CreateIntegrationCommand({
      ApiId: api.ApiId,
      IntegrationType: 'AWS_PROXY',
      IntegrationUri: lambdaArn,
      PayloadFormatVersion: '2.0',
    }));

    // Create catch-all route
    await apigw.send(new CreateRouteCommand({
      ApiId: api.ApiId,
      RouteKey: '$default',
      Target: `integrations/${integration.IntegrationId}`,
    }));

    // Create stage
    await apigw.send(new CreateStageCommand({
      ApiId: api.ApiId,
      StageName: '$default',
      AutoDeploy: true,
    }));

    // Add Lambda permission
    try {
      await lambda.send(new AddPermissionCommand({
        FunctionName: FUNCTION_NAME,
        StatementId: 'apigateway-invoke',
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
        SourceArn: `arn:aws:execute-api:${REGION}:*:${api.ApiId}/*`,
      }));
    } catch (e) {
      // Permission may already exist
    }

    console.log('   API Gateway created.');
  } else {
    console.log('   API Gateway already exists.');
  }

  const apiUrl = api.ApiEndpoint || `https://${api.ApiId}.execute-api.${REGION}.amazonaws.com`;
  console.log(`   API URL: ${apiUrl}`);
  return apiUrl;
}

// ---- 5. S3 Static Hosting ----
async function deployFrontend(apiUrl) {
  console.log('🚀 Deploying frontend to S3...');
  const bucketName = `${BUCKET_PREFIX}-${Date.now()}`;
  const distDir = join(import.meta.dirname, '../dist');

  // Check if dist exists
  try {
    statSync(distDir);
  } catch (e) {
    console.log('   ⚠️  No dist/ folder found. Run `npm run build` in the frontend first.');
    console.log(`   Then re-run deploy. API URL for .env: ${apiUrl}`);
    return null;
  }

  await s3.send(new CreateBucketCommand({ Bucket: bucketName }));

  // Upload all files from dist (private bucket — served via CloudFront or direct S3 URL)
  function uploadDir(dir, prefix = '') {
    const entries = readdirSync(dir, { withFileTypes: true });
    const promises = [];
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const key = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        promises.push(...uploadDir(fullPath, key));
      } else {
        const ext = extname(entry.name);
        promises.push(s3.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: readFileSync(fullPath),
          ContentType: MIME_TYPES[ext] || 'application/octet-stream',
        })));
      }
    }
    return promises;
  }

  await Promise.all(uploadDir(distDir));

  // Enable static website hosting
  await s3.send(new PutBucketWebsiteCommand({
    Bucket: bucketName,
    WebsiteConfiguration: {
      IndexDocument: { Suffix: 'index.html' },
      ErrorDocument: { Key: 'index.html' },
    },
  }));

  console.log(`   Files uploaded to s3://${bucketName}`);
  console.log(`   Note: Bucket is private. For public access, set up CloudFront or use:`);
  const presignedHint = `   aws s3 presign s3://${bucketName}/index.html --expires-in 604800`;
  console.log(presignedHint);
  console.log(`   Or enable public access in your AWS account's S3 Block Public Access settings.`);
  return bucketName;
}

// ---- Main ----
async function main() {
  console.log('\n🏗️  NutriTrack AI — AWS Deployment\n');

  await createTable();
  const roleArn = await createRole();
  await deployLambda(roleArn);
  const apiUrl = await createApiGateway();
  const siteUrl = await deployFrontend(apiUrl);

  console.log('\n✅ Deployment complete!\n');
  console.log(`   API:      ${apiUrl}`);
  if (siteUrl) console.log(`   S3 Bucket: ${siteUrl}`);
  console.log(`   DynamoDB: ${TABLE_NAME}`);
  console.log(`\n   To connect frontend to backend, create nutritrack-ai/.env with:`);
  console.log(`   VITE_API_URL=${apiUrl}`);
  console.log(`   Then run: npm run build && node backend/deploy.js (to re-upload frontend)\n`);
}

main().catch(err => {
  console.error('❌ Deployment failed:', err.message);
  process.exit(1);
});
