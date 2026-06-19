import crypto from "crypto";
import { putItem, getItem, queryItems, docClient, TABLE_NAME } from "./dynamo";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";

function generateApiKey(): string {
  const random = crypto.randomBytes(24).toString("base64url");
  return `rw_${random}`;
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function createApiKey(userId: string, label: string = "Default") {
  const raw = generateApiKey();
  const keyHash = hashKey(raw);
  const keyId = `key_${crypto.randomBytes(8).toString("hex")}`;
  const prefix = raw.slice(0, 7);

  await putItem({
    PK: `USER#${userId}`,
    SK: `APIKEY#${keyId}`,
    keyId,
    keyHash,
    prefix,
    label,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  });

  await putItem({
    PK: `APIKEY#${keyHash}`,
    SK: `APIKEY#${keyHash}`,
    userId,
    keyId,
    label,
  });

  return { keyId, raw, prefix, label };
}

export async function validateApiKey(raw: string): Promise<{ userId: string; keyId: string } | null> {
  const keyHash = hashKey(raw);
  const item = await getItem(`APIKEY#${keyHash}`, `APIKEY#${keyHash}`);
  if (!item) return null;
  return { userId: item.userId as string, keyId: item.keyId as string };
}

export async function listApiKeys(userId: string) {
  const result = await queryItems({
    pk: `USER#${userId}`,
    skPrefix: "APIKEY#",
  });
  return result.items.map((item) => ({
    keyId: item.keyId,
    prefix: item.prefix,
    label: item.label,
    createdAt: item.createdAt,
    lastUsedAt: item.lastUsedAt,
  }));
}

export async function deleteApiKey(userId: string, keyId: string) {
  const item = await getItem(`USER#${userId}`, `APIKEY#${keyId}`);
  if (!item) return false;

  await docClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: `USER#${userId}`, SK: `APIKEY#${keyId}` } })
  );
  await docClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: `APIKEY#${item.keyHash}`, SK: `APIKEY#${item.keyHash}` } })
  );

  return true;
}
