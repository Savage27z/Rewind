import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ulid } from "ulid";
import { batchPutItems, queryItems } from "@/lib/dynamo";

function ts(daysAgo: number, hoursAgo = 0, minutesAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo, d.getMinutes() - minutesAgo);
  return d.toISOString();
}

function makeEvent(
  tenantId: string, entityType: string, entityId: string,
  eventType: "CREATE" | "UPDATE" | "DELETE", timestamp: string, seq: number,
  before: Record<string, unknown> | null, after: Record<string, unknown> | null
) {
  const eventId = ulid();
  return {
    PK: `ENTITY#${entityId}`, SK: `EVENT#${timestamp}#${eventId}`,
    GSI1PK: `TENANT#${tenantId}`, GSI1SK: `EVENT#${timestamp}`,
    GSI2PK: `TYPE#${entityType}`, GSI2SK: timestamp,
    eventId, tenantId, entityType, entityId, eventType,
    payload: { before: before || undefined, after: after || undefined },
    sequenceNumber: seq, timestamp, metadata: {},
  };
}

function makeEntity(tenantId: string, entityType: string, entityId: string, createdAt: string, lastEventAt: string) {
  return { PK: `TENANT#${tenantId}`, SK: `ENTITY#${entityId}`, entityId, entityType, createdAt, lastEventAt };
}

function makeCurrent(tenantId: string, entityId: string, entityType: string, state: Record<string, unknown> | null, lastEventAt: string) {
  return { PK: `TENANT#${tenantId}`, SK: `CURRENT#${entityId}`, entityId, entityType, currentState: state, lastEventAt, lastEventType: state ? "UPDATE" : "DELETE" };
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await queryItems({ pk: `TENANT#${userId}`, skPrefix: "ENTITY#", limit: 1 });
  if (existing.items.length > 0) {
    return NextResponse.json({ message: "Demo data already exists", seeded: false });
  }

  const items: Record<string, unknown>[] = [];
  const T = userId;

  // Users
  const u1c = ts(6, 10);
  items.push(makeEvent(T, "User", "user_001", "CREATE", u1c, 1, null, { id: "user_001", name: "Alice Chen", email: "alice@example.com", role: "admin", status: "active" }));
  const u1u1 = ts(5, 8);
  items.push(makeEvent(T, "User", "user_001", "UPDATE", u1u1, 2, { name: "Alice Chen", email: "alice@example.com" }, { name: "Alice Chen-Wang", email: "alice.wang@example.com" }));
  const u1u2 = ts(4, 3);
  items.push(makeEvent(T, "User", "user_001", "UPDATE", u1u2, 3, { role: "admin" }, { role: "superadmin", permissions: ["read", "write", "delete", "manage_users"] }));
  const u1u3 = ts(2, 5);
  items.push(makeEvent(T, "User", "user_001", "UPDATE", u1u3, 4, { status: "active" }, { status: "suspended", suspendedReason: "policy_violation" }));
  const u1d = ts(1, 2);
  items.push(makeEvent(T, "User", "user_001", "DELETE", u1d, 5, { id: "user_001", name: "Alice Chen-Wang", status: "suspended" }, null));
  items.push(makeEntity(T, "User", "user_001", u1c, u1d));
  items.push(makeCurrent(T, "user_001", "User", null, u1d));

  const u2c = ts(6, 5);
  items.push(makeEvent(T, "User", "user_002", "CREATE", u2c, 1, null, { id: "user_002", name: "Bob Martinez", email: "bob@example.com", role: "developer", status: "active" }));
  const u2u = ts(3, 2);
  items.push(makeEvent(T, "User", "user_002", "UPDATE", u2u, 2, { email: "bob@example.com" }, { email: "bob.m@example.com", lastLogin: u2u }));
  items.push(makeEntity(T, "User", "user_002", u2c, u2u));
  items.push(makeCurrent(T, "user_002", "User", { id: "user_002", name: "Bob Martinez", email: "bob.m@example.com", role: "developer", status: "active" }, u2u));

  const u3c = ts(5, 1);
  items.push(makeEvent(T, "User", "user_003", "CREATE", u3c, 1, null, { id: "user_003", name: "Carol Kim", email: "carol@example.com", role: "viewer", status: "active" }));
  items.push(makeEntity(T, "User", "user_003", u3c, u3c));
  items.push(makeCurrent(T, "user_003", "User", { id: "user_003", name: "Carol Kim", email: "carol@example.com", role: "viewer", status: "active" }, u3c));

  // Order lifecycle
  const oc = ts(5, 14);
  items.push(makeEvent(T, "Order", "order_501", "CREATE", oc, 1, null, { id: "order_501", userId: "user_002", items: [{ productId: "prod_101", qty: 2, price: 29.99 }], total: 59.98, status: "created" }));
  const op = ts(5, 13, 50);
  items.push(makeEvent(T, "Order", "order_501", "UPDATE", op, 2, { status: "created" }, { status: "payment_pending", paymentIntentId: "pi_abc123" }));
  const opd = ts(5, 13, 45);
  items.push(makeEvent(T, "Order", "order_501", "UPDATE", opd, 3, { status: "payment_pending" }, { status: "paid", paidAt: opd, paymentMethod: "card_visa_4242" }));
  const os = ts(4, 8);
  items.push(makeEvent(T, "Order", "order_501", "UPDATE", os, 4, { status: "paid" }, { status: "shipped", trackingNumber: "1Z999AA10123456784", carrier: "UPS" }));
  const od = ts(2, 16);
  items.push(makeEvent(T, "Order", "order_501", "UPDATE", od, 5, { status: "shipped" }, { status: "delivered", deliveredAt: od }));
  items.push(makeEntity(T, "Order", "order_501", oc, od));
  items.push(makeCurrent(T, "order_501", "Order", { id: "order_501", userId: "user_002", total: 59.98, status: "delivered", trackingNumber: "1Z999AA10123456784" }, od));

  for (let i = 502; i <= 506; i++) {
    const oid = `order_${i}`;
    const ct = ts(7 - (i - 502), Math.floor(Math.random() * 12));
    items.push(makeEvent(T, "Order", oid, "CREATE", ct, 1, null, { id: oid, userId: `user_00${(i % 3) + 1}`, total: Math.round(Math.random() * 200 * 100) / 100, status: "created" }));
    items.push(makeEntity(T, "Order", oid, ct, ct));
  }

  // Product with $0 price anomaly
  const pc = ts(7);
  items.push(makeEvent(T, "Product", "prod_101", "CREATE", pc, 1, null, { id: "prod_101", name: "Mechanical Keyboard", price: 149.99, currency: "USD", stock: 500, sku: "KB-MECH-001" }));
  const pz = ts(3, 4);
  items.push(makeEvent(T, "Product", "prod_101", "UPDATE", pz, 2, { price: 149.99 }, { price: 0, updatedBy: "batch_script_v2" }));
  const pf = ts(3, 3, 58);
  items.push(makeEvent(T, "Product", "prod_101", "UPDATE", pf, 3, { price: 0 }, { price: 149.99, updatedBy: "admin_manual_fix" }));
  items.push(makeEntity(T, "Product", "prod_101", pc, pf));
  items.push(makeCurrent(T, "prod_101", "Product", { id: "prod_101", name: "Mechanical Keyboard", price: 149.99, currency: "USD", stock: 500 }, pf));

  // Inventory negative anomaly
  const ic = ts(7);
  items.push(makeEvent(T, "Inventory", "inv_101", "CREATE", ic, 1, null, { id: "inv_101", productId: "prod_101", warehouse: "US-EAST-1", quantity: 50, reserved: 0 }));
  for (let i = 2; i <= 5; i++) {
    const t = ts(7 - i, i * 2);
    items.push(makeEvent(T, "Inventory", "inv_101", "UPDATE", t, i, { quantity: 50 - (i - 2) * 12 }, { quantity: 50 - (i - 1) * 12 }));
  }
  const ineg = ts(1, 3);
  items.push(makeEvent(T, "Inventory", "inv_101", "UPDATE", ineg, 6, { quantity: 14 }, { quantity: -3 }));
  items.push(makeEntity(T, "Inventory", "inv_101", ic, ineg));
  items.push(makeCurrent(T, "inv_101", "Inventory", { id: "inv_101", productId: "prod_101", warehouse: "US-EAST-1", quantity: -3, reserved: 0 }, ineg));

  // Anomaly records
  items.push({
    PK: `TENANT#${T}`, SK: `ANOMALY#${pz}#${ulid()}`,
    GSI1PK: `TENANT#${T}`, GSI1SK: `ANOMALY#${pz}`,
    anomalyId: ulid(), tenantId: T, timestamp: pz, type: "velocity", severity: "warning",
    entityType: "Product", entityId: "prod_101",
    message: "Product price set to $0 — possible batch script error",
    details: { field: "price", oldValue: 149.99, newValue: 0 },
  });
  items.push({
    PK: `TENANT#${T}`, SK: `ANOMALY#${ineg}#${ulid()}`,
    GSI1PK: `TENANT#${T}`, GSI1SK: `ANOMALY#${ineg}`,
    anomalyId: ulid(), tenantId: T, timestamp: ineg, type: "velocity", severity: "critical",
    entityType: "Inventory", entityId: "inv_101",
    message: "Inventory quantity went negative (-3) — possible oversell bug",
    details: { quantity: -3, productId: "prod_101" },
  });

  // Filler events
  const entityTypes = ["User", "Order", "Product", "Inventory"];
  for (let i = 0; i < 80; i++) {
    const et = entityTypes[i % 4];
    const eid = `${et.toLowerCase()}_fill_${i.toString().padStart(3, "0")}`;
    const t = ts(Math.random() * 7, Math.random() * 24);
    items.push(makeEvent(T, et, eid, i % 5 === 0 ? "CREATE" : "UPDATE", t, 1, i % 5 === 0 ? null : { value: i - 1 }, { value: i, updatedAt: t }));
  }

  await batchPutItems(items);

  return NextResponse.json({ message: `Seeded ${items.length} items`, seeded: true, count: items.length });
}
