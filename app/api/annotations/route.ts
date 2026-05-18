import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

const extractErrorMessage = (error: unknown) => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error)
    return error.message || error.name || String(error);
  if (typeof error === "object") {
    const e = error as Record<string, unknown>;
    const extracted =
      (e.message as string) ||
      (e.error as string) ||
      (e.msg as string) ||
      (e.code as string) ||
      (e.details as string);
    if (extracted) return extracted;
    const text = JSON.stringify(error, Object.getOwnPropertyNames(error));
    if (text && text !== "{}") return text;
    return String(error);
  }
  return String(error);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdf_id, user_id, label, x, y, width, height, page_number } = body;

    if (
      !pdf_id ||
      !user_id ||
      !label ||
      typeof x !== "number" ||
      typeof y !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("annotations")
      .insert([
        {
          pdf_id,
          user_id,
          label,
          x,
          y,
          width,
          height,
          page_number,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(data?.[0] ?? null);
  } catch (error: unknown) {
    const message = extractErrorMessage(error);
    console.error("Annotation POST error:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const pdf_id = req.nextUrl.searchParams.get("pdf_id");

    if (!pdf_id) {
      return NextResponse.json(
        { error: "pdf_id query parameter required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("annotations")
      .select("*")
      .eq("pdf_id", pdf_id);

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error: unknown) {
    const message = extractErrorMessage(error);
    console.error("Annotation GET error:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
