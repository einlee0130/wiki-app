"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [theme, setTheme] = useState("pink");

  // 수정
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // 검색
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchTimer = useRef(null);

  // =========================
  // URL에서 slug 가져오기
  // =========================

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("doc") || "main";
  }

  // =========================
  // 문서 불러오기
  // =========================

  async function loadDocument(slug) {
    setLoading(true);
    setError("");
    setEditing(false);

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("slug", slug)
      .limit(1);

    if (error) {
      console.error(error);
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

    setSearchText("");
    setSearchResults([]);
    setShowSuggestions(false);

    setLoading(false);
  }

  // =========================
  // 최초 실행
  // =========================

  useEffect(() => {
    loadDocument(getSlugFromUrl());

    function handlePopState(event) {
      const slug =
        event.state?.slug || getSlugFromUrl();

      loadDocument(slug);
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

  // =========================
  // 검색
  // =========================

  function handleSearchChange(value) {
    setSearchText(value);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    setSearching(true);

    searchTimer.current = setTimeout(() => {
      searchDocuments(value.trim());
    }, 250);
  }

  async function searchDocuments(keyword) {
    const { data, error } = await supabase
      .from("documents")
      .select("id, title, slug")
      .ilike("title", `%${keyword}%`)
      .limit(8);

    if (error) {
      console.error("검색 오류:", error);

      setSearchResults([]);
      setSearching(false);

      return;
    }

    setSearchResults(data || []);
    setSearching(false);
  }

  // =========================
  // 검색 결과 클릭
  // =========================

  async function openSearchResult(result) {
    setSearchText("");
    setSearchResults([]);
    setShowSuggestions(false);

    await navigateToDocument(result.slug);
  }

  // =========================
  // 검색창 Enter
  // =========================

  async function handleSearchKeyDown(e) {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    if (!searchText.trim()) {
      return;
    }

    if (searchResults.length > 0) {
      await openSearchResult(searchResults[0]);
    }
  }

  // =========================
  // 문서 이동
  // =========================

  async function navigateToDocument(slug) {
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

    const target = data[0];

    const url =
      target.slug === "main"
        ? "/"
        : `/?doc=${encodeURIComponent(target.slug)}`;

    window.history.pushState(
      {
        slug: target.slug,
      },
      "",
      url
    );

    setDocument(target);
    setEditing(false);

    setSearchText("");
    setSearchResults([]);
    setShowSuggestions(false);

    setLoading(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================
  // [[문서명]] 링크 클릭
  // =========================

  async function openWikiDocument(title) {
    setLoading(true);
    setError("");

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

    const target = data[0];

    const url =
      target.slug === "main"
        ? "/"
        : `/?doc=${encodeURIComponent(target.slug)}`;

    window.history.pushState(
      {
        slug: target.slug,
      },
      "",
      url
    );

    setDocument(target);
    setEditing(false);

    setSearchText("");
    setSearchResults([]);
    setShowSuggestions(false);

    setLoading(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================
  // 메인으로
  // =========================

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

  // =========================
  // 수정 시작
  // =========================

  function startEditing() {
    if (!document) {
      return;
    }

    setEditTitle(document.title || "");
    setEditContent(document.content || "");

    setSaveMessage("");
    setEditing(true);
  }

  // =========================
  // 수정 취소
  // =========================

  function cancelEditing() {
    setEditing(false);
    setSaveMessage("");
  }

  // =========================
  // 저장
  // =========================

  async function saveDocument() {
    if (!document) {
      return;
    }

    if (!editTitle.trim()) {
      setSaveMessage(
        "문서 제목을 입력해주세요."
      );

      return;
    }

    setSaving(true);
    setSaveMessage("");

    const { data, error } = await supabase
      .from("documents")
      .update({
        title: editTitle.trim(),
        content: editContent,
      })
      .eq("id", document.id)
      .select("*");

    if (error) {
      console.error(error);

      setSaveMessage(
        `저장 실패: ${error.message}`
      );

      setSaving(false);

      return;
    }

    if (!data || data.length === 0) {
      setSaveMessage(
        "저장되지 않았습니다. RLS UPDATE 정책을 확인해주세요."
      );

      setSaving(false);

      return;
    }

    setDocument(data[0]);

    setEditing(false);
    setSaving(false);

    setSaveMessage("저장되었습니다.");

    setTimeout(() => {
      setSaveMessage("");
    }, 2000);
  }

  // =========================
  // 본문 렌더링
  // =========================

  function renderContent(content) {
    if (!content) {
      return null;
    }

    const parts =
      content.split(/(\[\[.*?\]\])/g);

    return parts.map((part, index) => {
      const match =
        part.match(/^\[\[(.*?)\]\]$/);

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

  // =========================
  // 로딩
  // =========================

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-dot" />

        <p>
          여름위키 불러오는 중...
        </p>
      </main>
    );
  }

  // =========================
  // 에러
  // =========================

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

          <p>
            {error}
          </p>

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

  if (!document) {
    return null;
  }

  // =========================
  // 화면
  // =========================

  return (
    <main className="wiki-app">

      {/* HEADER */}

      <header className="header">

        <div className="header-inner">

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


          {/* 검색 */}

          <div className="search-wrapper">

            <div className="search-box">

              <span className="search-icon">
                ⌕
              </span>

              <input
                type="text"
                value={searchText}
                placeholder="문서 검색"
                onChange={(e) =>
                  handleSearchChange(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleSearchKeyDown
                }
                onFocus={() => {
                  if (
                    searchText.trim()
                  ) {
                    setShowSuggestions(
                      true
                    );
                  }
                }}
              />

              {searching && (
                <span className="search-loading">
                  …
                </span>
              )}

              <span className="search-shortcut">
                /
              </span>

            </div>


            {/* 추천어 */}

            {showSuggestions &&
              searchText.trim() && (
                <div className="search-suggestions">

                  {searchResults.length > 0 ? (
                    <>
                      <div className="suggestion-label">
                        문서 검색 결과
                      </div>

                      {searchResults.map(
                        (result) => (
                          <button
                            key={result.id}
                            type="button"
                            className="suggestion-item"
                            onMouseDown={(e) =>
                              e.preventDefault()
                            }
                            onClick={() =>
                              openSearchResult(
                                result
                              )
                            }
                          >
                            <span className="suggestion-icon">
                              📄
                            </span>

                            <span className="suggestion-title">
                              {result.title}
                            </span>

                            <span className="suggestion-arrow">
                              ›
                            </span>
                          </button>
                        )
                      )}
                    </>
                  ) : !searching ? (
                    <div className="no-search-result">
                      <div>
                        🔎
                      </div>

                      <span>
                        검색 결과가 없습니다.
                      </span>
                    </div>
                  ) : null}

                </div>
              )}

          </div>


          {/* 테마 */}

          <button
            type="button"
            className="theme-toggle"
            onClick={() => {
              document.documentElement.dataset.theme =
                document.documentElement
                  .dataset.theme === "blue"
                  ? "pink"
                  : "blue";

              setTheme(
                document.documentElement
                  .dataset.theme
              );
            }}
          >
            {theme === "pink"
              ? "🌸"
              : "🩵"}
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

            <span>
              ›
            </span>

            <span>
              {document.title}
            </span>

          </div>


          {/* DOCUMENT */}

          <article className="document">

            <div className="document-header">

              <div className="document-title-area">

                <div className="document-label">
                  WIKI DOCUMENT
                </div>

                {editing ? (
                  <input
                    type="text"
                    className="edit-title-input"
                    value={editTitle}
                    onChange={(e) =>
                      setEditTitle(
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <h1>
                    {document.title}
                  </h1>
                )}

              </div>


              {!editing ? (
                <button
                  type="button"
                  className="edit-button"
                  onClick={startEditing}
                >
                  ✎ 수정
                </button>
              ) : (
                <div className="edit-actions">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    취소
                  </button>

                  <button
                    type="button"
                    className="save-button"
                    onClick={saveDocument}
                    disabled={saving}
                  >
                    {saving
                      ? "저장 중..."
                      : "저장"}
                  </button>

                </div>
              )}

            </div>


            <div className="document-divider" />


            {/* 본문 / 편집 */}

            {editing ? (
              <div className="editor-area">

                <div className="editor-help">
                  💡 다른 문서로 연결하려면{" "}
                  <strong>
                    [[문서명]]
                  </strong>{" "}
                  형식으로 입력하세요.
                </div>

                <textarea
                  className="document-editor"
                  value={editContent}
                  onChange={(e) =>
                    setEditContent(
                      e.target.value
                    )
                  }
                  placeholder="문서 내용을 입력하세요."
                />

                {saveMessage && (
                  <div className="save-message">
                    {saveMessage}
                  </div>
                )}

              </div>
            ) : (
              <div className="document-content">
                {renderContent(
                  document.content
                )}
              </div>
            )}

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

            {!editing && (
              <button
                type="button"
                onClick={startEditing}
              >
                ✎ 문서 수정
              </button>
            )}

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