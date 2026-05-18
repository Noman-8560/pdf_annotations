"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDF, Annotation } from "@/lib/types";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;
}

export default function UserPDFViewer() {
  const params = useParams();
  const pdfId = params.id as string;
  const [pdf, setPdf] = useState<PDF | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [tempBox, setTempBox] = useState<any>(null);
  const [label, setLabel] = useState("");
  const [boxToLabel, setBoxToLabel] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

        // Check if admin (should not access)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "admin") {
          router.push("/admin");
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
        if (!Array.isArray(annotationsData)) {
          console.error("Annotations response is not an array:", annotationsData);
          setAnnotations([]);
        } else {
          setAnnotations(annotationsData);
        }
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
    (a) => a.page_number === currentPage,
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!drawMode || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setStartPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !startPos || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setTempBox({
      x: Math.min(startPos.x, currentPos.x),
      y: Math.min(startPos.y, currentPos.y),
      width: Math.abs(currentPos.x - startPos.x),
      height: Math.abs(currentPos.y - startPos.y),
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawing || !tempBox) {
      setDrawing(false);
      return;
    }

    setDrawing(false);
    setBoxToLabel(tempBox);
    setTempBox(null);
  };

  const handleSaveAnnotation = async () => {
    if (!boxToLabel || !label || !user) return;

    try {
      const response = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdf_id: pdfId,
          user_id: user.id,
          label,
          x: boxToLabel.x,
          y: boxToLabel.y,
          width: boxToLabel.width,
          height: boxToLabel.height,
          page_number: currentPage,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Failed to save annotation", { status: response.status, result });
        throw new Error(result?.error || "Failed to save annotation");
      }
      if (result && result.error) {
        console.error("Annotation API returned error", result);
        throw new Error(result.error);
      }

      // Refetch annotations
      const response2 = await fetch(`/api/annotations?pdf_id=${pdfId}`);
      const annotationsData = await response2.json();
      if (!Array.isArray(annotationsData)) {
        console.error("Annotations response is not an array after save:", annotationsData);
        setAnnotations([]);
      } else {
        setAnnotations(annotationsData);
      }

      setBoxToLabel(null);
      setLabel("");
    } catch (error) {
      console.error("Error saving annotation:", error);
    }
  };

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push("/user")}
              className="text-blue-500 underline mb-2"
            >
              Back to PDFs
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
          <div className="col-span-2">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setDrawMode(!drawMode)}
                  className={`px-4 py-2 rounded ${
                    drawMode
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  {drawMode ? "Drawing Mode ON" : "Drawing Mode OFF"}
                </button>
              </div>

              <div
                ref={containerRef}
                className="relative inline-block w-full cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <Document
                  file={pdf.file_url}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading="Loading PDF..."
                >
                  <Page
                    pageNumber={currentPage}
                    width={500}
                    renderTextLayer={false}
                  />
                </Document>

                {/* Existing annotations */}
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

                {/* Temp box while drawing */}
                {tempBox && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30"
                    style={{
                      left: `${tempBox.x}px`,
                      top: `${tempBox.y}px`,
                      width: `${tempBox.width}px`,
                      height: `${tempBox.height}px`,
                    }}
                  />
                )}

                {/* Box waiting for label */}
                {boxToLabel && (
                  <div
                    className="absolute border-2 border-green-500 bg-green-100 bg-opacity-30"
                    style={{
                      left: `${boxToLabel.x}px`,
                      top: `${boxToLabel.y}px`,
                      width: `${boxToLabel.width}px`,
                      height: `${boxToLabel.height}px`,
                    }}
                  />
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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

          <div className="bg-white p-4 rounded-lg shadow max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Annotations</h2>

            {boxToLabel && (
              <div className="border p-4 rounded bg-green-50 mb-4">
                <h3 className="font-bold mb-2">Add Label to Box</h3>
                <input
                  type="text"
                  placeholder="Enter label (e.g., Name, Email)"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full border px-2 py-1 rounded mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAnnotation}
                    disabled={!label}
                    className="flex-1 bg-green-500 text-white px-2 py-1 rounded disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setBoxToLabel(null);
                      setLabel("");
                    }}
                    className="flex-1 bg-gray-500 text-white px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <h3 className="font-bold mb-2">Page {currentPage}</h3>
            {currentPageAnnotations.length === 0 ? (
              <p className="text-gray-600 text-sm">
                No annotations on this page
              </p>
            ) : (
              <div className="space-y-2">
                {currentPageAnnotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="border p-2 rounded bg-gray-50"
                  >
                    <p className="font-bold text-sm">{annotation.label}</p>
                    <p className="text-xs text-gray-600">
                      ({Math.round(annotation.x)}, {Math.round(annotation.y)})
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
