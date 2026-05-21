"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDF, Annotation } from "@/lib/types";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PDFViewerProps {
  role: "admin" | "user";
  backRoute: string;
}

export default function PDFViewer({ role, backRoute }: PDFViewerProps) {
  const params = useParams();
  const pdfId = params.id as string;

  const [pdf, setPdf] = useState<PDF | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  const [user, setUser] = useState<any>(null);

  const [drawing, setDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);

  const [drawTool, setDrawTool] = useState<"rect" | "pen">("rect");

  const [startPos, setStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [tempBox, setTempBox] = useState<any>(null);

  const [penPoints, setPenPoints] = useState<Array<{ x: number; y: number }>>(
    [],
  );

  const [penToLabel, setPenToLabel] = useState<any>(null);

  const [boxToLabel, setBoxToLabel] = useState<any>(null);

  const [label, setLabel] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/");
          return;
        }

        setUser(session.user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (role === "admin" && profile?.role !== "admin") {
          router.push("/user");
          return;
        }

        if (role === "user" && profile?.role === "admin") {
          router.push("/admin");
          return;
        }

        const { data: pdfData } = await supabase
          .from("pdfs")
          .select("*")
          .eq("id", pdfId)
          .single();

        setPdf(pdfData);

        await fetchAnnotations();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [pdfId, role, router]);

  const fetchAnnotations = async () => {
    try {
      const response = await fetch(`/api/annotations?pdf_id=${pdfId}`);

      const data = await response.json();

      setAnnotations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!pdf?.file_url) return;

    const testPDF = async () => {
      try {
        const res = await fetch(pdf.file_url);

        if (!res.ok) {
          setPdfLoadError(`Failed to fetch PDF: ${res.status}`);
        } else {
          setPdfLoadError(null);
        }
      } catch (error) {
        setPdfLoadError(String(error));
      }
    };

    testPDF();
  }, [pdf]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const currentPageAnnotations = annotations.filter(
    (a) => a.page_number === currentPage,
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!drawMode || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setStartPos(pos);

    setDrawing(true);

    if (drawTool === "pen") {
      setPenPoints([pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !startPos || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (drawTool === "rect") {
      setTempBox({
        x: Math.min(startPos.x, currentPos.x),
        y: Math.min(startPos.y, currentPos.y),
        width: Math.abs(currentPos.x - startPos.x),
        height: Math.abs(currentPos.y - startPos.y),
      });
    } else {
      setPenPoints((prev) => [...prev, currentPos]);
    }
  };

  const handleMouseUp = () => {
    if (!drawing) return;

    if (drawTool === "pen") {
      setDrawing(false);

      if (penPoints.length > 0) {
        setPenToLabel({
          points: penPoints,
        });

        setPenPoints([]);
      }

      return;
    }

    if (!tempBox) {
      setDrawing(false);
      return;
    }

    setDrawing(false);

    setBoxToLabel(tempBox);

    setTempBox(null);
  };

  const handleSaveAnnotation = async () => {
    if (!user || !label) return;

    try {
      if (boxToLabel) {
        await saveRectAnnotation();
      }

      if (penToLabel) {
        await savePenAnnotation();
      }

      await fetchAnnotations();

      setLabel("");

      setBoxToLabel(null);

      setPenToLabel(null);
    } catch (error) {
      console.error(error);
    }
  };

  const saveRectAnnotation = async () => {
    const response = await fetch("/api/annotations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pdf_id: pdfId,
        user_id: user.id,
        label,
        x: boxToLabel.x,
        y: boxToLabel.y,
        width: boxToLabel.width,
        height: boxToLabel.height,
        page_number: currentPage,
        type: "rect",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save annotation");
    }
  };

  const savePenAnnotation = async () => {
    const points = penToLabel.points;

    const xs = points.map((p: any) => p.x);

    const ys = points.map((p: any) => p.y);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    const relPoints = points.map((p: any) => ({
      x: p.x - minX,
      y: p.y - minY,
    }));

    const response = await fetch("/api/annotations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pdf_id: pdfId,
        user_id: user.id,
        label,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        page_number: currentPage,
        type: "pen",
        path: JSON.stringify(relPoints),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save pen annotation");
    }
  };

  const renderPenPath = (
    points: Array<{
      x: number;
      y: number;
    }>,
    color: string,
    offsetX = 0,
    offsetY = 0,
  ) => {
    const xs = points.map((p) => p.x);

    const ys = points.map((p) => p.y);

    const minX = Math.min(...xs);

    const minY = Math.min(...ys);

    const maxX = Math.max(...xs);

    const maxY = Math.max(...ys);

    const w = Math.max(1, maxX - minX);

    const h = Math.max(1, maxY - minY);

    const d = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x - minX} ${p.y - minY}`)
      .join(" ");

    return (
      <svg
        className="absolute pointer-events-none"
        style={{
          left: `${minX + offsetX}px`,
          top: `${minY + offsetY}px`,
          width: `${w}px`,
          height: `${h}px`,
        }}
        viewBox={`0 0 ${w} ${h}`}
      >
        <path
          d={d}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push(backRoute)}
              className="text-blue-500 underline mb-2"
            >
              Back
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
              <div className="mb-4 flex gap-2 items-center">
                <button
                  onClick={() => setDrawMode(!drawMode)}
                  className={`px-4 py-2 rounded ${
                    drawMode ? "bg-green-500 text-white" : "bg-gray-300"
                  }`}
                >
                  {drawMode ? "Drawing ON" : "Drawing OFF"}
                </button>

                <div className="flex border rounded overflow-hidden">
                  <button
                    onClick={() => setDrawTool("rect")}
                    className={`px-4 py-2 ${
                      drawTool === "rect"
                        ? "bg-blue-500 text-white"
                        : "bg-white"
                    }`}
                  >
                    Rect
                  </button>

                  <button
                    onClick={() => setDrawTool("pen")}
                    className={`px-4 py-2 ${
                      drawTool === "pen" ? "bg-blue-500 text-white" : "bg-white"
                    }`}
                  >
                    Pen
                  </button>
                </div>
              </div>

              {pdfLoadError && (
                <div className="text-red-500 mb-2">{pdfLoadError}</div>
              )}

              <div
                ref={containerRef}
                className="relative inline-block"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <Document
                  file={pdf.file_url}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(err) => setPdfLoadError(String(err))}
                >
                  <Page
                    pageNumber={currentPage}
                    width={600}
                    renderTextLayer={false}
                  />
                </Document>

                {currentPageAnnotations.map((annotation) => {
                  if (annotation.type === "pen" && annotation.path) {
                    try {
                      const points = JSON.parse(annotation.path);

                      return (
                        <div key={annotation.id}>
                          {renderPenPath(
                            points,
                            "red",
                            annotation.x,
                            annotation.y,
                          )}
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  }

                  return (
                    <div
                      key={annotation.id}
                      className="absolute border-2 border-red-500 bg-red-100/30 flex items-center justify-center"
                      style={{
                        left: annotation.x,
                        top: annotation.y,
                        width: annotation.width,
                        height: annotation.height,
                      }}
                    >
                      <span className="text-xs bg-red-200 px-1 rounded">
                        {annotation.label}
                      </span>
                    </div>
                  );
                })}

                {tempBox && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-100/30"
                    style={{
                      left: tempBox.x,
                      top: tempBox.y,
                      width: tempBox.width,
                      height: tempBox.height,
                    }}
                  />
                )}

                {penPoints.length > 0 && renderPenPath(penPoints, "blue")}

                {boxToLabel && (
                  <div
                    className="absolute border-2 border-green-500 bg-green-100/30"
                    style={{
                      left: boxToLabel.x,
                      top: boxToLabel.y,
                      width: boxToLabel.width,
                      height: boxToLabel.height,
                    }}
                  />
                )}

                {penToLabel && renderPenPath(penToLabel.points, "green")}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {numPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(numPages, p + 1))
                  }
                  disabled={currentPage >= numPages}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Annotations</h2>

            {(boxToLabel || penToLabel) && (
              <div className="border p-4 rounded bg-green-50 mb-4">
                <input
                  type="text"
                  placeholder="Enter label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full border px-2 py-1 rounded mb-2"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAnnotation}
                    disabled={!label}
                    className="flex-1 bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setBoxToLabel(null);

                      setPenToLabel(null);

                      setLabel("");
                    }}
                    className="flex-1 bg-gray-500 text-white px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {currentPageAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="border p-2 rounded bg-gray-50"
                >
                  <p className="font-bold text-sm">{annotation.label}</p>

                  <p className="text-xs text-gray-500">
                    ({Math.round(annotation.x)}, {Math.round(annotation.y)})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
