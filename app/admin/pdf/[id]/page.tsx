"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDF, Annotation } from "@/lib/types";

// ✅ FIX: Stable worker (BEST for your setup)
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function AdminPDFViewer() {
  const params = useParams();
  const pdfId = params.id as string;

  const [pdf, setPdf] = useState<PDF | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

        // Check admin role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role !== "admin") {
          router.push("/user");
          return;
        }

        // Fetch PDF
        const { data: pdfData } = await supabase
          .from("pdfs")
          .select("*")
          .eq("id", pdfId)
          .single();

        setPdf(pdfData);

        // Fetch annotations
        const response = await fetch(`/api/annotations?pdf_id=${pdfId}`);
        const annotationsData = await response.json();

        setAnnotations(Array.isArray(annotationsData) ? annotationsData : []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pdfId, router]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const currentPageAnnotations = annotations.filter(
    (a) => a.page_number === currentPage
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        PDF not found
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push("/admin")}
              className="text-blue-500 underline mb-2"
            >
              Back to Admin
            </button>
            <h1 className="text-4xl font-bold">{pdf.title}</h1>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* PDF Viewer */}
          <div className="col-span-2">
            <div className="bg-white p-4 rounded-lg shadow">
              <Document
                file={pdf.file_url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading="Loading PDF..."
              >
                <div className="relative inline-block w-full">
                  <Page
                    pageNumber={currentPage}
                    width={500}
                    renderTextLayer={false}
                  />

                  {/* Annotations overlay */}
                  <div
                    className="absolute top-0 left-0"
                    style={{
                      width: "500px",
                      height: "100%",
                    }}
                  >
                    {currentPageAnnotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className="absolute border-2 border-red-500 bg-red-100 bg-opacity-20 flex items-center justify-center"
                        style={{
                          left: `${annotation.x}px`,
                          top: `${annotation.y}px`,
                          width: `${annotation.width}px`,
                          height: `${annotation.height}px`,
                        }}
                      >
                        <span className="text-xs font-bold text-red-700 bg-red-200 px-1 rounded">
                          {annotation.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Document>

              {/* Pagination */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() =>
                    setCurrentPage(Math.max(1, currentPage - 1))
                  }
                  disabled={currentPage <= 1}
                  className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {numPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(numPages, currentPage + 1))
                  }
                  disabled={currentPage >= numPages}
                  className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Annotations panel */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">
              Annotations (Page {currentPage})
            </h2>

            {currentPageAnnotations.length === 0 ? (
              <p className="text-gray-600">No annotations on this page</p>
            ) : (
              <div className="space-y-2">
                {currentPageAnnotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="border p-2 rounded bg-gray-50"
                  >
                    <p className="font-bold text-sm">{annotation.label}</p>
                    <p className="text-xs text-gray-600">
                      Position: ({Math.round(annotation.x)},{" "}
                      {Math.round(annotation.y)})
                    </p>
                    <p className="text-xs text-gray-600">
                      Size: {Math.round(annotation.width)} ×{" "}
                      {Math.round(annotation.height)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}