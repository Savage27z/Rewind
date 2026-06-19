import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "RewindEvents";

const isLocal = process.env.DYNAMODB_LOCAL === "true";

const client = new DynamoDBClient(
  isLocal
    ? { region: "local", endpoint: "http://localhost:8000", credentials: { accessKeyId: "local", secretAccessKey: "local" } }
    : { region: process.env.AWS_REGION || "us-east-1" }
);

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export { TABLE_NAME };

export async function putItem(item: Record<string, unknown>, condition?: string) {
  const params: Record<string, unknown> = {
    TableName: TABLE_NAME,
    Item: item,
  };
  if (condition) {
    (params as Record<string, unknown>).ConditionExpression = condition;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await docClient.send(new PutCommand(params as any));
}

export async function getItem(pk: string, sk: string) {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk, SK: sk } })
  );
  return result.Item;
}

export async function queryItems(params: {
  pk: string;
  skPrefix?: string;
  skBetween?: [string, string];
  skLessThan?: string;
  limit?: number;
  scanForward?: boolean;
  indexName?: string;
  pkField?: string;
  skField?: string;
}) {
  const pkField = params.pkField || "PK";
  const skField = params.skField || "SK";

  let keyCondition = `${pkField} = :pk`;
  const exprValues: Record<string, unknown> = { ":pk": params.pk };

  if (params.skPrefix) {
    keyCondition += ` AND begins_with(${skField}, :skPrefix)`;
    exprValues[":skPrefix"] = params.skPrefix;
  } else if (params.skBetween) {
    keyCondition += ` AND ${skField} BETWEEN :skStart AND :skEnd`;
    exprValues[":skStart"] = params.skBetween[0];
    exprValues[":skEnd"] = params.skBetween[1];
  } else if (params.skLessThan) {
    keyCondition += ` AND ${skField} < :skLt`;
    exprValues[":skLt"] = params.skLessThan;
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: params.indexName,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: exprValues,
      Limit: params.limit,
      ScanIndexForward: params.scanForward ?? true,
    })
  );

  return {
    items: result.Items || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function updateItem(
  pk: string,
  sk: string,
  updates: Record<string, unknown>
) {
  const entries = Object.entries(updates);
  const exprParts: string[] = [];
  const exprNames: Record<string, string> = {};
  const exprValues: Record<string, unknown> = {};

  entries.forEach(([key, val], i) => {
    exprParts.push(`#f${i} = :v${i}`);
    exprNames[`#f${i}`] = key;
    exprValues[`:v${i}`] = val;
  });

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `SET ${exprParts.join(", ")}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
    })
  );
}

export async function batchPutItems(items: Record<string, unknown>[]) {
  const chunks: Record<string, unknown>[][] = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: chunk.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      })
    );
  }
}
