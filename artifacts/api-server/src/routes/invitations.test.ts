import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import {
  cancelRequestAndExpireInvitations,
  expirePendingInvitations,
  InvitationFinalizationError,
  finalizeGroupWithInvitations,
  respondToInvitation,
} from "../lib/invitationLifecycle.ts";

const requireDbPackage = createRequire(
  new URL("../../../../lib/db/package.json", import.meta.url),
);
const { Pool } = requireDbPackage("pg");
const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });

type Fixture = {
  marker: string;
  requesterId: string;
  inviteeId: string;
  otherIds: string[];
  requestId: string;
  invitationId: string;
};

async function query(text: string, values: unknown[] = []) {
  return pool.query(text, values);
}

async function createFixture(
  expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000),
): Promise<Fixture> {
  const marker = `invitation-test-${crypto.randomUUID()}`;
  const users = await query(
    `INSERT INTO users (phone, email, nickname, gender, city)
     SELECT phone, email, nickname, 'woman', 'Riyadh'
     FROM unnest($1::text[], $2::text[], $3::text[]) AS rows(phone, email, nickname)
     RETURNING id`,
    [
      [1, 2, 3, 4, 5].map((number) => `${marker}-${number}`),
      [1, 2, 3, 4, 5].map((number) => `${marker}-${number}@example.test`),
      ["Requester", "Friend", "Member 1", "Member 2", "Member 3"],
    ],
  );
  const userIds = users.rows.map((row) => row.id as string);
  const [request] = (
    await query(
      `INSERT INTO requests
        (user_id, meetup_type, preferred_date, preferred_time, area)
       VALUES ($1, 'coffee', '2026-09-01', 'evening', 'Riyadh')
       RETURNING id`,
      [userIds[0]],
    )
  ).rows;
  const [invitation] = (
    await query(
      `INSERT INTO request_invitations
        (request_id, requester_id, invited_email, invitee_user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        request.id,
        userIds[0],
        `${marker}-2@example.test`,
        userIds[1],
        marker,
        expiresAt,
      ],
    )
  ).rows;

  return {
    marker,
    requesterId: userIds[0],
    inviteeId: userIds[1],
    otherIds: userIds.slice(2),
    requestId: request.id,
    invitationId: invitation.id,
  };
}

async function cleanupFixture(fixture: Fixture) {
  await query("DELETE FROM groups WHERE area = $1", [fixture.marker]);
  await query("DELETE FROM requests WHERE id = $1", [fixture.requestId]);
  await query("DELETE FROM users WHERE phone LIKE $1", [`${fixture.marker}-%`]);
}

async function invitationStatus(fixture: Fixture) {
  const result = await query(
    "SELECT status FROM request_invitations WHERE id = $1",
    [fixture.invitationId],
  );
  return result.rows[0]?.status as string | undefined;
}

function groupInput(fixture: Fixture, memberIds = fixture.otherIds.slice(0, 2)) {
  return {
    requestIds: [fixture.requestId],
    memberIds: [fixture.requesterId, ...memberIds],
    meetupType: "coffee",
    gender: "woman",
    city: "Riyadh",
    area: fixture.marker,
  };
}

test.after(async () => {
  await pool.end();
});

test("accepted invitations transition through the shared response service", async () => {
  const fixture = await createFixture();
  try {
    assert.equal(
      await respondToInvitation(pool, fixture.invitationId, fixture.inviteeId, "accepted"),
      true,
    );
    assert.equal(await invitationStatus(fixture), "accepted");
  } finally {
    await cleanupFixture(fixture);
  }
});

test("declined invitations transition through the shared response service", async () => {
  const fixture = await createFixture();
  try {
    assert.equal(
      await respondToInvitation(pool, fixture.invitationId, fixture.inviteeId, "declined"),
      true,
    );
    assert.equal(await invitationStatus(fixture), "declined");
  } finally {
    await cleanupFixture(fixture);
  }
});

test("expired invitations reject a late response through the shared response service", async () => {
  const fixture = await createFixture(new Date(Date.now() - 1));
  try {
    assert.equal(await expirePendingInvitations(pool, [fixture.invitationId]), 1);
    assert.equal(
      await respondToInvitation(pool, fixture.invitationId, fixture.inviteeId, "accepted"),
      false,
    );
    assert.equal(await invitationStatus(fixture), "expired");
  } finally {
    await cleanupFixture(fixture);
  }
});

test("cancelling a request expires its outstanding invitation atomically", async () => {
  const fixture = await createFixture();
  try {
    assert.equal(await cancelRequestAndExpireInvitations(pool, fixture.requestId), true);
    const request = await query("SELECT status FROM requests WHERE id = $1", [
      fixture.requestId,
    ]);
    assert.equal(request.rows[0]?.status, "cancelled");
    assert.equal(await invitationStatus(fixture), "expired");
  } finally {
    await cleanupFixture(fixture);
  }
});

test("accepted friends are included and finalized in four- and five-person groups", async () => {
  for (const additionalMembers of [2, 3]) {
    const fixture = await createFixture();
    try {
      assert.equal(
        await respondToInvitation(pool, fixture.invitationId, fixture.inviteeId, "accepted"),
        true,
      );
      const group = await finalizeGroupWithInvitations(
        pool,
        groupInput(fixture, fixture.otherIds.slice(0, additionalMembers)),
      );
      assert.equal(group.memberIds.length, additionalMembers + 2);
      assert.ok(group.memberIds.includes(fixture.inviteeId));
      assert.equal(await invitationStatus(fixture), "finalized");
    } finally {
      await cleanupFixture(fixture);
    }
  }
});

test("an accepted friend cannot make a three-person final group", async () => {
  const fixture = await createFixture();
  try {
    await respondToInvitation(pool, fixture.invitationId, fixture.inviteeId, "accepted");
    await assert.rejects(
      finalizeGroupWithInvitations(pool, groupInput(fixture, fixture.otherIds.slice(0, 1))),
      InvitationFinalizationError,
    );
    const request = await query("SELECT status FROM requests WHERE id = $1", [
      fixture.requestId,
    ]);
    assert.equal(request.rows[0]?.status, "pending");
    assert.equal(await invitationStatus(fixture), "accepted");
  } finally {
    await cleanupFixture(fixture);
  }
});

test("concurrent response and finalization never leave an accepted friend outside the group", async () => {
  const fixture = await createFixture();
  try {
    const [wasAccepted, group] = await Promise.all([
      respondToInvitation(pool, fixture.invitationId, fixture.inviteeId, "accepted"),
      finalizeGroupWithInvitations(pool, groupInput(fixture)),
    ]);

    if (wasAccepted) {
      assert.ok(group.memberIds.includes(fixture.inviteeId));
      assert.equal(await invitationStatus(fixture), "finalized");
    } else {
      assert.ok(!group.memberIds.includes(fixture.inviteeId));
      assert.equal(await invitationStatus(fixture), "expired");
    }
  } finally {
    await cleanupFixture(fixture);
  }
});

test("a stale response after finalization cannot create an orphaned acceptance", async () => {
  const fixture = await createFixture();
  try {
    const group = await finalizeGroupWithInvitations(pool, groupInput(fixture));
    assert.equal(
      await respondToInvitation(pool, fixture.invitationId, fixture.inviteeId, "accepted"),
      false,
    );
    assert.ok(!group.memberIds.includes(fixture.inviteeId));
    assert.equal(await invitationStatus(fixture), "expired");
  } finally {
    await cleanupFixture(fixture);
  }
});