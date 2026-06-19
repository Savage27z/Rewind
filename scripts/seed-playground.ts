import { ulid } from "ulid";
import { batchPutItems } from "../lib/dynamo";

const TENANT = "playground";

function ts(daysAgo: number, hoursAgo = 0, minutesAgo = 0, secondsAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo, d.getMinutes() - minutesAgo, d.getSeconds() - secondsAgo);
  return d.toISOString();
}

function makeEvent(
  entityType: string,
  entityId: string,
  eventType: "CREATE" | "UPDATE" | "DELETE",
  timestamp: string,
  seq: number,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
) {
  const eventId = ulid();
  return {
    PK: `ENTITY#${entityId}`,
    SK: `EVENT#${timestamp}#${eventId}`,
    GSI1PK: `TENANT#${TENANT}`,
    GSI1SK: `EVENT#${timestamp}`,
    GSI2PK: `TYPE#${entityType}`,
    GSI2SK: timestamp,
    eventId,
    tenantId: TENANT,
    entityType,
    entityId,
    eventType,
    payload: {
      before: before || undefined,
      after: after || undefined,
    },
    sequenceNumber: seq,
    timestamp,
    metadata: {},
  };
}

function makeEntityRecord(entityType: string, entityId: string, createdAt: string, lastEventAt: string) {
  return {
    PK: `TENANT#${TENANT}`,
    SK: `ENTITY#${entityId}`,
    entityId,
    entityType,
    createdAt,
    lastEventAt,
  };
}

function makeCurrentState(entityId: string, entityType: string, state: Record<string, unknown> | null, lastEventAt: string) {
  return {
    PK: `TENANT#${TENANT}`,
    SK: `CURRENT#${entityId}`,
    entityId,
    entityType,
    currentState: state,
    lastEventAt,
    lastEventType: state ? "UPDATE" : "DELETE",
  };
}

async function seed() {
  console.log("🌱 Seeding playground data...\n");

  const items: Record<string, unknown>[] = [];

  // === USERS ===
  const userIds = ["user_001", "user_002", "user_003"];

  // User 1: Created, updated 3 times, then soft-deleted
  const u1Create = ts(6, 10);
  items.push(makeEvent("User", "user_001", "CREATE", u1Create, 1, null, {
    id: "user_001", name: "Alice Chen", email: "alice@example.com", role: "admin", status: "active", createdAt: u1Create,
  }));

  const u1Update1 = ts(5, 8);
  items.push(makeEvent("User", "user_001", "UPDATE", u1Update1, 2,
    { name: "Alice Chen", email: "alice@example.com" },
    { name: "Alice Chen-Wang", email: "alice.wang@example.com" }
  ));

  const u1Update2 = ts(4, 3);
  items.push(makeEvent("User", "user_001", "UPDATE", u1Update2, 3,
    { role: "admin" },
    { role: "superadmin", permissions: ["read", "write", "delete", "manage_users"] }
  ));

  const u1Update3 = ts(2, 5);
  items.push(makeEvent("User", "user_001", "UPDATE", u1Update3, 4,
    { status: "active" },
    { status: "suspended", suspendedReason: "policy_violation" }
  ));

  const u1Delete = ts(1, 2);
  items.push(makeEvent("User", "user_001", "DELETE", u1Delete, 5,
    { id: "user_001", name: "Alice Chen-Wang", status: "suspended" },
    null
  ));
  items.push(makeEntityRecord("User", "user_001", u1Create, u1Delete));
  items.push(makeCurrentState("user_001", "User", null, u1Delete));

  // User 2: Normal user
  const u2Create = ts(6, 5);
  items.push(makeEvent("User", "user_002", "CREATE", u2Create, 1, null, {
    id: "user_002", name: "Bob Martinez", email: "bob@example.com", role: "developer", status: "active",
  }));
  const u2Update = ts(3, 2);
  items.push(makeEvent("User", "user_002", "UPDATE", u2Update, 2,
    { email: "bob@example.com" },
    { email: "bob.m@example.com", lastLogin: ts(3, 2) }
  ));
  items.push(makeEntityRecord("User", "user_002", u2Create, u2Update));
  items.push(makeCurrentState("user_002", "User", {
    id: "user_002", name: "Bob Martinez", email: "bob.m@example.com", role: "developer", status: "active",
  }, u2Update));

  // User 3
  const u3Create = ts(5, 1);
  items.push(makeEvent("User", "user_003", "CREATE", u3Create, 1, null, {
    id: "user_003", name: "Carol Kim", email: "carol@example.com", role: "viewer", status: "active",
  }));
  items.push(makeEntityRecord("User", "user_003", u3Create, u3Create));
  items.push(makeCurrentState("user_003", "User", {
    id: "user_003", name: "Carol Kim", email: "carol@example.com", role: "viewer", status: "active",
  }, u3Create));

  // === ORDERS ===
  // Order lifecycle: created → payment_pending → paid → shipped → delivered
  const orderId = "order_501";
  const oCreate = ts(5, 14);
  items.push(makeEvent("Order", orderId, "CREATE", oCreate, 1, null, {
    id: orderId, userId: "user_002", items: [{ productId: "prod_101", qty: 2, price: 29.99 }],
    total: 59.98, status: "created", shippingAddress: "123 Main St",
  }));

  const oPending = ts(5, 13, 50);
  items.push(makeEvent("Order", orderId, "UPDATE", oPending, 2,
    { status: "created" },
    { status: "payment_pending", paymentIntentId: "pi_abc123" }
  ));

  const oPaid = ts(5, 13, 45);
  items.push(makeEvent("Order", orderId, "UPDATE", oPaid, 3,
    { status: "payment_pending" },
    { status: "paid", paidAt: oPaid, paymentMethod: "card_visa_4242" }
  ));

  const oShipped = ts(4, 8);
  items.push(makeEvent("Order", orderId, "UPDATE", oShipped, 4,
    { status: "paid" },
    { status: "shipped", trackingNumber: "1Z999AA10123456784", carrier: "UPS" }
  ));

  const oDelivered = ts(2, 16);
  items.push(makeEvent("Order", orderId, "UPDATE", oDelivered, 5,
    { status: "shipped" },
    { status: "delivered", deliveredAt: oDelivered }
  ));
  items.push(makeEntityRecord("Order", orderId, oCreate, oDelivered));
  items.push(makeCurrentState(orderId, "Order", {
    id: orderId, userId: "user_002", items: [{ productId: "prod_101", qty: 2, price: 29.99 }],
    total: 59.98, status: "delivered", trackingNumber: "1Z999AA10123456784",
  }, oDelivered));

  // More orders
  for (let i = 502; i <= 508; i++) {
    const oid = `order_${i}`;
    const ct = ts(7 - (i - 502), Math.floor(Math.random() * 12));
    items.push(makeEvent("Order", oid, "CREATE", ct, 1, null, {
      id: oid, userId: userIds[i % 3], total: Math.round(Math.random() * 200 * 100) / 100,
      status: "created", items: [{ productId: `prod_${100 + (i % 5)}`, qty: 1 + (i % 3) }],
    }));
    items.push(makeEntityRecord("Order", oid, ct, ct));
  }

  // === PRODUCTS ===
  // Product with $0 price anomaly
  const prodId = "prod_101";
  const pCreate = ts(7);
  items.push(makeEvent("Product", prodId, "CREATE", pCreate, 1, null, {
    id: prodId, name: "Mechanical Keyboard", price: 149.99, currency: "USD",
    category: "electronics", stock: 500, sku: "KB-MECH-001",
  }));

  // ANOMALY: Price set to $0
  const pZero = ts(3, 4);
  items.push(makeEvent("Product", prodId, "UPDATE", pZero, 2,
    { price: 149.99 },
    { price: 0, updatedBy: "batch_script_v2" }
  ));

  // Fix: Price corrected 2 minutes later
  const pFix = ts(3, 3, 58);
  items.push(makeEvent("Product", prodId, "UPDATE", pFix, 3,
    { price: 0 },
    { price: 149.99, updatedBy: "admin_manual_fix" }
  ));
  items.push(makeEntityRecord("Product", prodId, pCreate, pFix));
  items.push(makeCurrentState(prodId, "Product", {
    id: prodId, name: "Mechanical Keyboard", price: 149.99, currency: "USD", stock: 500,
  }, pFix));

  // Product with SCHEMA DRIFT: price changes from string to number
  const prodDrift = "prod_102";
  const pdCreate = ts(6, 12);
  items.push(makeEvent("Product", prodDrift, "CREATE", pdCreate, 1, null, {
    id: prodDrift, name: "USB-C Hub", price: "79.99", category: "accessories",
  }));
  const pdDrift = ts(2, 6);
  items.push(makeEvent("Product", prodDrift, "UPDATE", pdDrift, 2,
    { price: "79.99" },
    { price: 79.99 } // string → number drift!
  ));
  items.push(makeEntityRecord("Product", prodDrift, pdCreate, pdDrift));
  items.push(makeCurrentState(prodDrift, "Product", {
    id: prodDrift, name: "USB-C Hub", price: 79.99, category: "accessories",
  }, pdDrift));

  // Store schema for Product (with string type for price initially)
  items.push({
    PK: `TENANT#${TENANT}`,
    SK: `META#SCHEMA#Product`,
    entityType: "Product",
    fields: { id: "string", name: "string", price: "string", category: "string", currency: "string", stock: "number", sku: "string" },
    lastUpdated: pdCreate,
  });

  // === INVENTORY ===
  // Negative inventory anomaly (oversell bug)
  const invId = "inv_101";
  const iCreate = ts(7);
  items.push(makeEvent("Inventory", invId, "CREATE", iCreate, 1, null, {
    id: invId, productId: "prod_101", warehouse: "US-EAST-1", quantity: 50, reserved: 0,
  }));

  // Gradual decrease
  for (let i = 2; i <= 6; i++) {
    const t = ts(7 - i, i * 2);
    items.push(makeEvent("Inventory", invId, "UPDATE", t, i,
      { quantity: 50 - (i - 2) * 12 },
      { quantity: 50 - (i - 1) * 12 }
    ));
  }

  // ANOMALY: Goes negative
  const iNeg = ts(1, 3);
  items.push(makeEvent("Inventory", invId, "UPDATE", iNeg, 7,
    { quantity: 2 },
    { quantity: -3 } // Oversell!
  ));
  items.push(makeEntityRecord("Inventory", invId, iCreate, iNeg));
  items.push(makeCurrentState(invId, "Inventory", {
    id: invId, productId: "prod_101", warehouse: "US-EAST-1", quantity: -3, reserved: 0,
  }, iNeg));

  // === BURST DELETE ANOMALY ===
  // 50 DELETE events in 10 seconds (runaway script)
  const burstStart = ts(1, 8);
  for (let i = 0; i < 50; i++) {
    const bId = `temp_entity_${i.toString().padStart(3, "0")}`;
    const bTime = new Date(new Date(burstStart).getTime() + i * 200).toISOString();
    items.push(makeEvent("TempData", bId, "DELETE", bTime, 1,
      { id: bId, data: `temporary_record_${i}` },
      null
    ));
  }

  // Store anomaly records for the baked-in scenarios
  items.push({
    PK: `TENANT#${TENANT}`,
    SK: `ANOMALY#${pZero}#${ulid()}`,
    GSI1PK: `TENANT#${TENANT}`,
    GSI1SK: `ANOMALY#${pZero}`,
    anomalyId: ulid(),
    tenantId: TENANT,
    timestamp: pZero,
    type: "velocity",
    severity: "warning",
    entityType: "Product",
    entityId: prodId,
    message: "Product price set to $0 — possible batch script error",
    details: { field: "price", oldValue: 149.99, newValue: 0 },
  });

  items.push({
    PK: `TENANT#${TENANT}`,
    SK: `ANOMALY#${pdDrift}#${ulid()}`,
    GSI1PK: `TENANT#${TENANT}`,
    GSI1SK: `ANOMALY#${pdDrift}`,
    anomalyId: ulid(),
    tenantId: TENANT,
    timestamp: pdDrift,
    type: "schema_drift",
    severity: "warning",
    entityType: "Product",
    entityId: prodDrift,
    message: "Field 'price' in entity type 'Product' changed from string to number",
    details: { field: "price", was: "string", now: "number" },
  });

  items.push({
    PK: `TENANT#${TENANT}`,
    SK: `ANOMALY#${iNeg}#${ulid()}`,
    GSI1PK: `TENANT#${TENANT}`,
    GSI1SK: `ANOMALY#${iNeg}`,
    anomalyId: ulid(),
    tenantId: TENANT,
    timestamp: iNeg,
    type: "velocity",
    severity: "critical",
    entityType: "Inventory",
    entityId: invId,
    message: "Inventory quantity went negative (-3) — possible oversell bug",
    details: { quantity: -3, productId: "prod_101" },
  });

  items.push({
    PK: `TENANT#${TENANT}`,
    SK: `ANOMALY#${burstStart}#${ulid()}`,
    GSI1PK: `TENANT#${TENANT}`,
    GSI1SK: `ANOMALY#${burstStart}`,
    anomalyId: ulid(),
    tenantId: TENANT,
    timestamp: burstStart,
    type: "velocity",
    severity: "critical",
    entityType: "TempData",
    message: "DELETE events for 'TempData' spiked to 300/min (baseline: 0/min) — runaway script detected",
    details: { rate: 300, threshold: 50 },
  });

  // Add more filler events for variety
  const entityTypes = ["User", "Order", "Product", "Inventory"];
  for (let i = 0; i < 200; i++) {
    const et = entityTypes[i % 4];
    const eid = `${et.toLowerCase()}_fill_${i.toString().padStart(3, "0")}`;
    const t = ts(Math.random() * 7, Math.random() * 24);
    items.push(makeEvent(et, eid, i % 5 === 0 ? "CREATE" : "UPDATE", t, 1,
      i % 5 === 0 ? null : { value: i - 1 },
      { value: i, updatedAt: t }
    ));
  }

  console.log(`📦 Writing ${items.length} items to DynamoDB...`);

  await batchPutItems(items);

  console.log(`✅ Seeded ${items.length} items successfully!`);
  console.log("\nScenarios included:");
  console.log("  • User lifecycle: create → 3 updates → soft-delete");
  console.log("  • Order lifecycle: created → payment_pending → paid → shipped → delivered");
  console.log("  • Product $0 price anomaly + correction");
  console.log("  • Schema drift: price string → number");
  console.log("  • Inventory negative quantity (oversell bug)");
  console.log("  • 50 DELETE burst in 10 seconds (runaway script)");
  console.log("  • 200+ filler events across all entity types");
}

seed().catch(console.error);
