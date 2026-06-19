import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";

const isLocal = process.env.DYNAMODB_LOCAL === "true";
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "RewindEvents";

const client = new DynamoDBClient(
  isLocal
    ? {
        region: "local",
        endpoint: "http://localhost:8000",
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }
    : { region: process.env.AWS_REGION || "us-east-1" }
);

async function setup() {
  console.log(`Setting up DynamoDB table: ${TABLE_NAME}`);
  console.log(`Mode: ${isLocal ? "LOCAL" : "AWS"}`);

  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`Table '${TABLE_NAME}' already exists.`);
    return;
  } catch {
    // Table doesn't exist, create it
  }

  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
        { AttributeName: "GSI1PK", AttributeType: "S" },
        { AttributeName: "GSI1SK", AttributeType: "S" },
        { AttributeName: "GSI2PK", AttributeType: "S" },
        { AttributeName: "GSI2SK", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI1",
          KeySchema: [
            { AttributeName: "GSI1PK", KeyType: "HASH" },
            { AttributeName: "GSI1SK", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ...(isLocal
            ? {}
            : {
                ProvisionedThroughput: {
                  ReadCapacityUnits: 5,
                  WriteCapacityUnits: 5,
                },
              }),
        },
        {
          IndexName: "GSI2",
          KeySchema: [
            { AttributeName: "GSI2PK", KeyType: "HASH" },
            { AttributeName: "GSI2SK", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ...(isLocal
            ? {}
            : {
                ProvisionedThroughput: {
                  ReadCapacityUnits: 5,
                  WriteCapacityUnits: 5,
                },
              }),
        },
      ],
      ...(isLocal
        ? { BillingMode: "PAY_PER_REQUEST" }
        : {
            ProvisionedThroughput: {
              ReadCapacityUnits: 10,
              WriteCapacityUnits: 10,
            },
          }),
    })
  );

  console.log(`Table '${TABLE_NAME}' created successfully with GSI1 and GSI2.`);
}

setup().catch(console.error);
