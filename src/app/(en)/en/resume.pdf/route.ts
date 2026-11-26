import { resumeResponse } from "@/cv/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return resumeResponse("en", req);
}
