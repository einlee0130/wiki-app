"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [document, setDocument] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("pink");

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
      <main className="loading-screen">
        <div className="loading-dot" />
        <p>여름위키 불러오는 중...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="error-screen">
        <div className="error-box">
          <span>⚠️</span>
          <h1>문서를 불러오지 못했어요</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`wiki-app theme-${theme}`}>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">여름위키</span>
          </Link>

          <div className="search-box">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              placeholder="무엇이든 검색해보세요"
            />

            <span className="search-shortcut">/</span>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={() =>
              setTheme(theme === "pink" ? "blue" : "pink")
            }
            aria-label="테마 변경"
          >
            {theme === "pink" ? "🌸" : "🔵"}
          </button>
        </div>
      </header>

      <div className="page-container">
        <div className="content">
          <div className="breadcrumb">
            <Link href="/">여름위키</Link>
            <span>›</span>
            <span>메인</span>
          </div>

          <article className="document">
            <div className="document-header">
              <div>
                <div className="document-label">
                  WIKI DOCUMENT
                </div>

                <h1>{document.title}</h1>
              </div>

              <button type="button" className="edit-button">
                ✎ 수정
              </button>
            </div>

            <div className="document-divider" />

            <div className="document-content">
              {document.content}
            </div>
          </article>
        </div>

        <aside className="sidebar">
          <div className="sidebar-card">
            <div className="sidebar-title">
              이 문서
            </div>

            <button type="button">
              📖 문서 읽기
            </button>

            <button type="button">
              ✎ 문서 수정
            </button>

            <button type="button">
              🔗 링크 복사
            </button>
          </div>

          <div className="sidebar-card">
            <div className="sidebar-title">
              여름위키
            </div>

            <Link href="/" className="sidebar-link">
              🏠 메인 페이지
            </Link>

            <button type="button">
              ＋ 새 문서
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}