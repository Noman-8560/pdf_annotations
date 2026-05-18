"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { PDF } from "@/lib/types";

export default function UserPanel() {
  const [user, setUser] = useState<any>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/");
          return;
        }

        setUser(session.user);

        // Check if not admin (i.e., user)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "admin") {
          router.push("/admin");
          return;
        }

        fetchPdfs();
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchPdfs = async () => {
    try {
      const response = await fetch("/api/pdfs");
      const raw = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: raw };
      }

      if (!response.ok || (data as any)?.error) {
        console.error(
          "PDF API error:",
          data,
          response.status,
          response.statusText,
          "raw response:",
          raw,
        );
        setPdfs([]);
        return;
      }

      if (Array.isArray(data)) {
        setPdfs(data);
      } else {
        console.error("Unexpected PDF response:", data);
        setPdfs([]);
      }
    } catch (error) {
      console.error("Error fetching PDFs:", error);
      setPdfs([]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Available PDFs</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          {pdfs.length === 0 ? (
            <p>No PDFs available yet</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="border p-4 rounded flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold">{pdf.title}</h3>
                    <p className="text-sm text-gray-600">
                      Uploaded: {new Date(pdf.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/user/pdf/${pdf.id}`}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Annotate
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
