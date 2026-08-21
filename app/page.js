"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [document, setDocument] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getMainDocument() {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("slug", "main")
        .limit(1);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError("main 문서를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }

      setDocument(data[0]);
      setLoading(false);
    }

    getMainDocument();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <p>불러오는 중...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>에러 발생</h1>
        <p>{error}</p>
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