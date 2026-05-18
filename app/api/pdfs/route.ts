import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "pdfs";

const extractErrorMessage = (error: unknown) => {
  if (!error) return "Unknown error";

  const rawMessage = (() => {
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    if (typeof error === "object") {
      const e = error as Record<string, unknown>;
      return (
        (e.message as string) ||
        (e.error as string) ||
        (e.msg as string) ||
        String(error) ||
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
    }
    return String(error);
  })();

  if (
    rawMessage.includes("Could not find the table") ||
    rawMessage.includes("schema cache") ||
    (rawMessage.includes("table") && rawMessage.includes("not found"))
  ) {
    return "Supabase table 'pdfs' is missing in this project. Run the local `database.sql` schema in your Supabase SQL editor and verify that the env vars point to the same project.";
  }

  return rawMessage;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const userId = formData.get("userId") as string;

    if (!file || !title || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL from Supabase storage");
    }

    const { data: pdfData, error: dbError } = await supabaseAdmin
      .from("pdfs")
      .insert([
        {
          title,
          file_url: urlData.publicUrl,
          uploaded_by: userId,
        },
      ])
      .select();

    if (dbError) throw dbError;

    return NextResponse.json(pdfData?.[0] ?? null);
  } catch (error: unknown) {
    const message = extractErrorMessage(error);
    console.error("PDF POST error:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("pdfs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error: unknown) {
    const message = extractErrorMessage(error);
    console.error("PDF GET error:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
