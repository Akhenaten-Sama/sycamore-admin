"use client";
import { useEffect, useState } from "react";

export default function ApiDocsPage() {
  const [doc, setDoc] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDoc(data.documentation);
        } else {
          setError(data.error || "Failed to load documentation.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load documentation.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-900">Sycamore Admin API Documentation</h1>
      {loading ? (
        <p className="text-gray-500 text-lg">Loading...</p>
      ) : error ? (
        <p className="text-red-500 text-lg">{error}</p>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-base leading-relaxed text-gray-900">
          {doc.split("\n").map((line, i) => {
            if (line.startsWith("# ")) {
              return <h1 key={i} className="text-2xl font-bold mt-6 mb-4 text-blue-800">{line.replace("# ", "")}</h1>;
            }
            if (line.startsWith("## ")) {
              return <h2 key={i} className="text-xl font-semibold mt-4 mb-2 text-blue-700">{line.replace("## ", "")}</h2>;
            }
            if (line.startsWith("- ")) {
              return <li key={i} className="ml-6 list-disc text-gray-800">{line.replace("- ", "")}</li>;
            }
            if (line.startsWith("---")) {
              return <hr key={i} className="my-4 border-gray-300" />;
            }
            if (line.trim() === "") {
              return <br key={i} />;
            }
            return <p key={i} className="mb-2 text-gray-900">{line}</p>;
          })}
        </div>
      )}
    </div>
  );
}
