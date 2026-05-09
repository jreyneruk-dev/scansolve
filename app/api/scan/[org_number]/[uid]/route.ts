import { NextRequest, NextResponse } from "next/server";
import { getLocationByOrgAndUID } from "@/lib/locations";
import type { PublicLocationData } from "@/types/schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ org_number: string; uid: string }> }
) {
  const { org_number, uid } = await params;
  const orgNum = parseInt(org_number, 10);

  if (isNaN(orgNum)) {
    return NextResponse.json({ error: "Invalid org number" }, { status: 400 });
  }

  const location = await getLocationByOrgAndUID(orgNum, uid);

  if (!location) {
    return NextResponse.json({ error: "QR code not yet activated" }, { status: 404 });
  }

  const publicData: PublicLocationData = {
    uid: location.uid,
    name: location.name,
    survey_config: location.survey_config,
  };

  return NextResponse.json(publicData);
}
