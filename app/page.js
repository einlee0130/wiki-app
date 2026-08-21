"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [document, setDocument] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("pink");

  // 현재 URL에서 문서 slug 가져오기
  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("doc") || "main";
  }

  // slug로 문서 불러오기
  async function loadDocument(slug, addHistory = false) {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("slug", slug)
      .limit(1);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setError(`"${slug}" 문서를 찾을 수 없습니다.`);
      setLoading(false);
      return;
    }

    setDocument(data[0]);

    // 브라우저 기록 추가
    if (addHistory) {
      const url =
        slug === "main"
          ? "/"
          : `/?doc=${encodeURIComponent(slug)}`;

      window.history.pushState(
        { slug },
        "",
        url
      );
    }

    setLoading(false);
  }

  // 처음 페이지가 열렸을 때
  useEffect(() => {
    const slug = getSlugFromUrl();

    loadDocument(slug);

    // 브라우저 뒤로가기 / 앞으로가기
    function handlePopState(event) {
      const slugFromState =
        event.state?.slug || getSlugFromUrl();

      loadDocument(slugFromState);
    }

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  // [[문서명]] 찾기
  function renderContent(content) {
    if (!content) {
      return null;
    }

    const parts = content.split(
      /(\[\[.*?\]\])/g
    );

    return parts.map((part, index) => {
      const match = part.match(
        /^\[\[(.*?)\]\]$/
      );

      // 일반 텍스트
      if (!match) {
        return (
          <span key={index}>
            {part}
          </span>
        );
      }

      const title = match[1].trim();

      return (
        <button
          key={index}
          type="button"
          className="wiki-link"
          onClick={() =>
            openWikiDocument(title)
          }
        >
          {title}
        </button>
      );
    });
  }

  // 위키 링크 클릭
  async function openWikiDocument(title) {
    setLoading(true);
    setError("");

    // 제목으로 문서 찾기
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("title", title)
      .limit(1);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setError(
        `"${title}" 문서를 찾을 수 없습니다.`
      );
      setLoading(false);
      return;
    }

    const targetDocument = data[0];

    // URL 변경 + 브라우저 기록 저장
    const url =
      targetDocument.slug === "main"
        ? "/"
        : `/?doc=${encodeURIComponent(
            targetDocument.slug
          )}`;

    window.history.pushState(
      {
        slug: targetDocument.slug,
      },
      "",
      url
    );

    // 화면 변경
    setDocument(targetDocument);

    setLoading(false);

    // 화면 맨 위로
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // 메인으로 이동
  function goHome() {
    if (document?.slug === "main") {
      return;
    }

    window.history.pushState(
      {
        slug: "main",
      },
      "",
      "/"
    );

    loadDocument("main");
  }

  // 로딩
  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-dot" />
        <p>여름위키 불러오는 중...</p>
      </main>
    );
  }

  // 에러
  if (error) {
    return (
      <main className="error-screen">
        <div className="error-box">
          <div className="error-icon">
            ⚠️
          </div>

          <h1>
            문서를 불러오지 못했어요
          </h1>

          <p>{error}</p>

          <button
            type="button"
            className="back-button"
            onClick={goHome}
          >
            메인으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`wiki-app theme-${theme}`}
    >
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">

          {/* 로고 */}
          <button
            type="button"
            className="logo"
            onClick={goHome}
          >
            <span className="logo-icon">
              ✦
            </span>

            <span className="logo-text">
              여름위키
            </span>
          </button>

          {/* 검색창 */}
          <div className="search-box">
            <span className="search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="무엇이든 검색해보세요"
            />

            <span className="search-shortcut">
              /
            </span>
          </div>

          {/* 테마 */}
          <button
            type="button"
            className="theme-toggle"
            onClick={() =>
              setTheme(
                theme === "pink"
                  ? "blue"
                  : "pink"
              )
            }
            aria-label="테마 변경"
          >
            {theme === "pink"
              ? "🌸"
              : "🔵"}
          </button>

        </div>
      </header>

      {/* PAGE */}
      <div className="page-container">

        <div className="content">

          {/* breadcrumb */}
          <div className="breadcrumb">

            <button
              type="button"
              onClick={goHome}
            >
              여름위키
            </button>

            <span>›</span>

            <span>
              {document.title}
            </span>

          </div>

          {/* DOCUMENT */}
          <article className="document">

            <div className="document-header">

              <div>
                <div className="document-label">
                  WIKI DOCUMENT
                </div>

                <h1>
                  {document.title}
                </h1>
              </div>

              <button
                type="button"
                className="edit-button"
              >
                ✎ 수정
              </button>

            </div>

            <div className="document-divider" />

            <div className="document-content">
              {renderContent(
                document.content
              )}
            </div>

          </article>

        </div>

        {/* SIDEBAR */}
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

            <button
              type="button"
              onClick={goHome}
            >
              🏠 메인 페이지
            </button>

            <button type="button">
              ＋ 새 문서
            </button>

          </div>

        </aside>

      </div>
    </main>
  );
}