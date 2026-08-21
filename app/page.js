"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [document, setDocument] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getMainDocument() {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("slug", "main")
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setDocument(data);
    }

    getMainDocument();
  }, []);

  if (error) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>에러 발생</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!document) {
    return (
      <main style={{ padding: "40px" }}>
        <p>불러오는 중...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>{document.title}</h1>
      <p>{document.content}</p>
    </main>
  );
}