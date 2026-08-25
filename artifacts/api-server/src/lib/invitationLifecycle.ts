type QueryResult<Row = Record<string, unknown>> = {
  rows: Row[];
  rowCount: number | null;
};

type TransactionClient = {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>;
  release(): void;
};

export type InvitationPool = {
  connect(): Promise<TransactionClient>;
  query<Row = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<Row>>;
};

export class InvitationFinalizationError extends Error {}

export type FinalGroup = {
  id: string;
  status: string;
  meetupType: string;
  gender: string;
  city: string;
  area: string;
  venue: string | null;
  meetupAt: number | null;
  memberIds: string[];
  requestIds: string[];
};

type FinalizeGroupInput = {
  requestIds: string[];
  memberIds: string[];
  meetupType: string;
  gender: string;
  city: string;
  area: string;
  venue?: string;
  meetupAt?: number;
};

export async function respondToInvitation(
  pool: InvitationPool,
  invitationId: string,
  inviteeUserId: string,
  response: "accepted" | "declined",
) {
  const updated = await pool.query(
    `UPDATE request_invitations
     SET status = $2, invitee_user_id = $3, responded_at = now(), updated_at = now()
     WHERE id = $1 AND status = 'pending' AND expires_at > now()
     RETURNING id`,
    [invitationId, response, inviteeUserId],
  );
  return (updated.rowCount ?? 0) === 1;
}

export async function expirePendingInvitations(
  pool: InvitationPool,
  invitationIds?: string[],
) {
  const expired = await pool.query(
    `UPDATE request_invitations
     SET status = 'expired', updated_at = now()
     WHERE status = 'pending'
       AND expires_at <= now()
       AND ($1::uuid[] IS NULL OR id = ANY($1::uuid[]))
     RETURNING id`,
    [invitationIds ?? null],
  );
  return expired.rowCount ?? 0;
}

export async function cancelRequestAndExpireInvitations(
  pool: InvitationPool,
  requestId: string,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cancelled = await client.query(
      `UPDATE requests
       SET status = 'cancelled', updated_at = now()
       WHERE id = $1 AND status = 'pending'
       RETURNING id`,
      [requestId],
    );
    if ((cancelled.rowCount ?? 0) !== 1) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(
      `UPDATE request_invitations
       SET status = 'expired', updated_at = now()
       WHERE request_id = $1 AND status <> 'finalized'`,
      [requestId],
    );
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function finalizeGroupWithInvitations(
  pool: InvitationPool,
  input: FinalizeGroupInput,
): Promise<FinalGroup> {
  const requestIds = [...new Set(input.requestIds)];
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    if (requestIds.length > 0) {
      const openRequests = await client.query<{ id: string }>(
        `SELECT id
         FROM requests
         WHERE id = ANY($1::uuid[]) AND status = 'pending'`,
        [requestIds],
      );
      if (openRequests.rows.length !== requestIds.length) {
        throw new InvitationFinalizationError(
          "Every selected request must still be pending",
        );
      }
      await client.query(
        `UPDATE request_invitations
         SET status = 'expired', updated_at = now()
         WHERE request_id = ANY($1::uuid[]) AND status = 'pending'`,
        [requestIds],
      );
    }

    const acceptedInvites =
      requestIds.length > 0
        ? await client.query<{
            id: string;
            request_id: string;
            invitee_user_id: string | null;
          }>(
            `SELECT id, request_id, invitee_user_id
             FROM request_invitations
             WHERE request_id = ANY($1::uuid[]) AND status = 'accepted'`,
            [requestIds],
          )
        : { rows: [], rowCount: 0 };
    const acceptedInviteeIds = acceptedInvites.rows
      .map((invite) => invite.invitee_user_id)
      .filter((id): id is string => Boolean(id));
    const memberIds = [...new Set([...input.memberIds, ...acceptedInviteeIds])];

    if (acceptedInvites.rows.length > 0) {
      const requesters = await client.query<{ user_id: string }>(
        `SELECT user_id
         FROM requests
         WHERE id = ANY($1::uuid[])`,
        [acceptedInvites.rows.map((invite) => invite.request_id)],
      );
      if (requesters.rows.some((request) => !memberIds.includes(request.user_id))) {
        throw new InvitationFinalizationError(
          "The requester must be included with an accepted invited friend",
        );
      }
    }
    if (memberIds.length < 3 || memberIds.length > 5) {
      throw new InvitationFinalizationError("Groups must contain 3–5 members");
    }
    if (acceptedInviteeIds.length > 0 && memberIds.length < 4) {
      throw new InvitationFinalizationError(
        "A group with an invited friend must contain 4–5 members",
      );
    }

    const group = await client.query<FinalGroup>(
      `INSERT INTO groups
        (status, meetup_type, gender, city, area, venue, meetup_at, member_ids, request_ids)
       VALUES (
         'matched', $1, $2, $3, $4, $5, $6, $7::text[], $8::text[]
       )
       RETURNING
         id,
         status,
         meetup_type AS "meetupType",
         gender,
         city,
         area,
         venue,
         meetup_at AS "meetupAt",
         member_ids AS "memberIds",
         request_ids AS "requestIds"`,
      [
        input.meetupType,
        input.gender,
        input.city,
        input.area,
        input.venue ?? null,
        input.meetupAt ?? null,
        memberIds,
        requestIds,
      ],
    );

    for (const invite of acceptedInvites.rows) {
      const finalized = await client.query(
        `UPDATE request_invitations
         SET status = 'finalized', updated_at = now()
         WHERE id = $1 AND status = 'accepted'
         RETURNING id`,
        [invite.id],
      );
      if ((finalized.rowCount ?? 0) !== 1) {
        throw new InvitationFinalizationError(
          "An accepted invitation changed before finalization",
        );
      }
    }
    for (const requestId of requestIds) {
      const matched = await client.query(
        `UPDATE requests
         SET status = 'matched', updated_at = now()
         WHERE id = $1 AND status = 'pending'
         RETURNING id`,
        [requestId],
      );
      if ((matched.rowCount ?? 0) !== 1) {
        throw new InvitationFinalizationError(
          "A selected request is no longer pending",
        );
      }
    }

    await client.query("COMMIT");
    return group.rows[0]!;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}