import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createPilotSchema } from "@/domain/pilot-operations";
import { parseJson, unexpectedApiError } from "@/server/case-api";
import { requireOperationalActor } from "@/server/operations-auth";
import { createPilot, listPilotsFor } from "@/server/pilot-operations";

const roles = ["pilot_administrator"] as const;
export async function GET(request:NextRequest){const actor=await requireOperationalActor(request,roles);if(actor instanceof Response)return actor;return NextResponse.json({pilots:await listPilotsFor(actor)});}
export async function POST(request:NextRequest){const actor=await requireOperationalActor(request,roles,true);if(actor instanceof Response)return actor;const input=await parseJson(request,createPilotSchema);if(input instanceof Response)return input;try{return NextResponse.json(await createPilot(actor.userId,input),{status:201});}catch{return unexpectedApiError();}}
