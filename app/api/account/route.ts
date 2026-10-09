import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalUser, getOrgForUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { deleteAccount, DeletionAborted } from "@/lib/account-deletion";

// The user types their organisation name (or their email if they have none) to confirm.
const Schema = z.object({ confirm: z.string().trim().min(1).max(200) });

export async function DELETE(req: NextRequest) {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await checkRateLimit(`account_delete:${user.id}`, 5, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Confirmation required." }, { status: 422 });

  const org = (await getOrgForUser(user.id)) as
    | { id: string; name?: string; owner_id?: string | null; stripe_subscription_id?: string | null }
    | null;
  const expected = (org?.name ?? user.email ?? "").trim().toLowerCase();
  if (!expected || parsed.data.confirm.toLowerCase() !== expected) {
    return NextResponse.json({ error: "That doesn't match. Type it exactly as shown." }, { status: 422 });
  }

  try {
    await deleteAccount(user.id, org);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof DeletionAborted) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[account/delete]", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Something went wrong deleting your account. Email support@scansolve.co and we'll finish it." },
      { status: 500 }
    );
  }
}
