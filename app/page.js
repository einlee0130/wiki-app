"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // THEME
  // =====================================================

  const [theme, setTheme] = useState("pink");

  // 저장된 테마 불러오기
  useEffect(() => {
    const savedTheme = localStorage.getItem("wiki-theme");

    if (savedTheme === "pink" || savedTheme === "blue") {
      setTheme(savedTheme);
    }
  }, []);

  // 테마 저장
  useEffect(() => {
    localStorage.setItem("wiki-theme", theme);
  }, [theme]);

  // =====================================================
  // EDIT
  // =====================================================

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // =====================================================
  // SEARCH
  // =====================================================

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchTimer = useRef(null);

  // =====================================================
  // NEW DOCUMENT
  // =====================================================

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newContent, setNewContent] = useState("");
  const [creatingDocument, setCreatingDocument] = useState(false);

  // =====================================================
  // URL
  // =====================================================

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return params.get("doc") || "main";
  }

  // =====================================================
  // LOAD DOCUMENT
  // =====================================================

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

  // =====================================================
  // INITIAL LOAD / BACK BUTTON
  // =====================================================

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

  // =====================================================
  // DOCUMENT TOC
  // =====================================================

  const headings = useMemo(() => {
    if (!document?.content) return [];

    const lines = document.content.split("\n");

    const result = [];

    lines.forEach((line, index) => {
      const match = line.match(
        /^(#{2,3})\s+(.+)$/
      );

      if (!match) return;

      const level = match[1].length;
      const title = match[2].trim();

      result.push({
        id: `heading-${index}`,
        level,
        title,
      });
    });

    return result;
  }, [document]);

  function scrollToHeading(id) {
    setTimeout(() => {
      const element =
        document.getElementById(id);

      if (!element) return;

      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  // =====================================================
  // SEARCH
  // =====================================================

  function handleSearchChange(value) {
    setSearchText(value);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      setSearching(false);

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
      console.error(error);

      setSearchResults([]);
      setSearching(false);

      return;
    }

    setSearchResults(data || []);
    setSearching(false);
  }

  async function openSearchResult(result) {
    setSearchText("");
    setSearchResults([]);
    setShowSuggestions(false);

    await navigateToDocument(result.slug);
  }

  async function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;

    e.preventDefault();

    if (!searchText.trim()) return;

    if (searchResults.length > 0) {
      await openSearchResult(
        searchResults[0]
      );
    }
  }

  // =====================================================
  // NAVIGATE DOCUMENT
  // =====================================================

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
        : `/?doc=${encodeURIComponent(
            target.slug
          )}`;

    window.history.pushState(
      { slug: target.slug },
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

  // =====================================================
  // WIKI LINK
  // =====================================================

  async function openWikiDocument(title) {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("title", title)
      .limit(1);

    if (error) {
      setError(error.message);

      return;
    }

    if (!data || data.length === 0) {
      alert(
        `"${title}" 문서를 찾을 수 없습니다.`
      );

      return;
    }

    const target = data[0];

    const url =
      target.slug === "main"
        ? "/"
        : `/?doc=${encodeURIComponent(
            target.slug
          )}`;

    window.history.pushState(
      { slug: target.slug },
      "",
      url
    );

    setDocument(target);
    setEditing(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================================
  // HOME
  // =====================================================

  function goHome() {
    if (document?.slug === "main") return;

    window.history.pushState(
      { slug: "main" },
      "",
      "/"
    );

    loadDocument("main");
  }

  // =====================================================
  // EDIT
  // =====================================================

  function startEditing() {
    if (!document) return;

    setEditTitle(document.title || "");
    setEditContent(document.content || "");

    setSaveMessage("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setSaveMessage("");
  }

  async function saveDocument() {
    if (!document) return;

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
        "저장되지 않았습니다. UPDATE 정책을 확인해주세요."
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

  // =====================================================
  // NEW DOCUMENT
  // =====================================================

  function openCreateDocument() {
    setNewTitle("");
    setNewSlug("");
    setNewContent("");

    setCreating(true);
  }

  function closeCreateDocument() {
    if (creatingDocument) return;

    setCreating(false);
  }

  async function createDocument() {
    const title = newTitle.trim();
    const slug = newSlug.trim().toLowerCase();
    const content = newContent;

    if (!title) {
      alert("문서 제목을 입력해주세요.");

      return;
    }

    if (!slug) {
      alert("slug를 입력해주세요.");

      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      alert(
        "slug는 영문 소문자, 숫자, -만 사용할 수 있습니다."
      );

      return;
    }

    setCreatingDocument(true);

    const {
      data: existing,
      error: checkError,
    } = await supabase
      .from("documents")
      .select("id")
      .eq("slug", slug)
      .limit(1);

    if (checkError) {
      console.error(checkError);

      alert(
        "문서 확인 실패: " +
          checkError.message
      );

      setCreatingDocument(false);

      return;
    }

    if (existing && existing.length > 0) {
      alert("이미 존재하는 slug입니다.");

      setCreatingDocument(false);

      return;
    }

    const { data, error } = await supabase
      .from("documents")
      .insert({
        title,
        slug,
        content,
      })
      .select("*");

    if (error) {
      console.error(error);

      alert(
        "문서 생성 실패: " +
          error.message
      );

      setCreatingDocument(false);

      return;
    }

    if (!data || data.length === 0) {
      alert("문서가 생성되지 않았습니다.");

      setCreatingDocument(false);

      return;
    }

    const created = data[0];

    setCreating(false);
    setCreatingDocument(false);

    setNewTitle("");
    setNewSlug("");
    setNewContent("");

    const url =
      `/?doc=${encodeURIComponent(
        created.slug
      )}`;

    window.history.pushState(
      { slug: created.slug },
      "",
      url
    );

    setDocument(created);
    setEditing(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =====================================================
  // CONTENT RENDER
  // =====================================================

  function renderContent(content) {
    if (!content) {
      return (
        <p className="empty-document">
          아직 작성된 내용이 없습니다.
        </p>
      );
    }

    const lines = content.split("\n");

    return lines.map((line, index) => {
      // -------------------------------
      // ## 제목
      // -------------------------------

      const headingMatch =
        line.match(
          /^(#{2,3})\s+(.+)$/
        );

      if (headingMatch) {
        const level =
          headingMatch[1].length;

        const title =
          headingMatch[2].trim();

        const id = `heading-${index}`;

        if (level === 2) {
          return (
            <h2
              key={index}
              id={id}
              className="wiki-heading wiki-heading-2"
            >
              {title}
            </h2>
          );
        }

        return (
          <h3
            key={index}
            id={id}
            className="wiki-heading wiki-heading-3"
          >
            {title}
          </h3>
        );
      }

      // -------------------------------
      // 빈 줄
      // -------------------------------

      if (line === "") {
        return (
          <div
            key={index}
            className="wiki-empty-line"
          />
        );
      }

      // -------------------------------
      // [[문서명]]
      // -------------------------------

      const parts =
        line.split(
          /(\[\[.*?\]\])/
        );

      return (
        <div
          key={index}
          className="wiki-line"
        >
          {parts.map(
            (part, partIndex) => {
              const match =
                part.match(
                  /^\[\[(.*?)\]\]$/
                );

              if (!match) {
                return (
                  <span
                    key={partIndex}
                  >
                    {part}
                  </span>
                );
              }

              const title =
                match[1].trim();

              return (
                <button
                  key={partIndex}
                  type="button"
                  className="wiki-link"
                  onClick={() =>
                    openWikiDocument(
                      title
                    )
                  }
                >
                  {title}
                </button>
              );
            }
          )}
        </div>
      );
    });
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main
        className={`wiki-app theme-${theme}`}
      >
        <div className="loading-screen">
          <div className="loading-dot" />

          <p>
            여름위키 불러오는 중...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main
        className={`wiki-app theme-${theme}`}
      >
        <div className="error-screen">
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
        </div>
      </main>
    );
  }

  if (!document) return null;

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main
      className={`wiki-app theme-${theme}`}
    >

      {/* =================================================
          HEADER
      ================================================= */}

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


          {/* SEARCH */}

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


            {/* SEARCH SUGGESTIONS */}

            {showSuggestions &&
              searchText.trim() && (
                <div className="search-suggestions">

                  {searchResults.length >
                  0 ? (
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
                            onMouseDown={(
                              e
                            ) =>
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
                              {
                                result.title
                              }
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


          {/* NEW DOCUMENT */}

          <button
            type="button"
            className="new-document-top-button"
            onClick={
              openCreateDocument
            }
          >
            ＋ 새 문서
          </button>


          {/* THEME */}

          <button
            type="button"
            className="theme-toggle"
            title={
              theme === "pink"
                ? "소라색 테마로 변경"
                : "연핑크 테마로 변경"
            }
            onClick={() => {
              setTheme(
                theme === "pink"
                  ? "blue"
                  : "pink"
              );
            }}
          >
            {theme === "pink"
              ? "🌸"
              : "🩵"}
          </button>

        </div>

      </header>


      {/* =================================================
          NEW DOCUMENT MODAL
      ================================================= */}

      {creating && (
        <div className="new-document-overlay">

          <div className="new-document-box">

            <div className="new-document-header">

              <div>

                <div className="document-label">
                  NEW WIKI DOCUMENT
                </div>

                <h2>
                  새 문서 만들기
                </h2>

              </div>

              <button
                type="button"
                className="new-document-close"
                onClick={
                  closeCreateDocument
                }
              >
                ×
              </button>

            </div>


            <div className="new-document-form">

              <label>
                문서 제목
              </label>

              <input
                type="text"
                value={newTitle}
                onChange={(e) =>
                  setNewTitle(
                    e.target.value
                  )
                }
                placeholder="예: 괴산오성중학교"
              />


              <label>
                slug
              </label>

              <input
                type="text"
                value={newSlug}
                onChange={(e) =>
                  setNewSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(
                        /[^a-z0-9-]/g,
                        ""
                      )
                  )
                }
                placeholder="예: gsos"
              />

              <div className="slug-help">
                문서 주소에 사용됩니다.
                <br />
                영문 소문자, 숫자, -만 사용할 수 있습니다.
              </div>


              <label>
                문서 내용
              </label>

              <textarea
                value={newContent}
                onChange={(e) =>
                  setNewContent(
                    e.target.value
                  )
                }
                placeholder={
                  "문서 내용을 입력하세요.\n\n## 개요\n내용\n\n### 특징\n내용"
                }
              />

            </div>


            <div className="new-document-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={
                  closeCreateDocument
                }
                disabled={
                  creatingDocument
                }
              >
                취소
              </button>

              <button
                type="button"
                className="save-button"
                onClick={createDocument}
                disabled={
                  creatingDocument
                }
              >
                {creatingDocument
                  ? "생성 중..."
                  : "문서 만들기"}
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =================================================
          PAGE
      ================================================= */}

      <div className="page-container">

        <div className="content">

          {/* BREADCRUMB */}

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
                  onClick={
                    startEditing
                  }
                >
                  ✎ 수정
                </button>
              ) : (
                <div className="edit-actions">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={
                      cancelEditing
                    }
                    disabled={saving}
                  >
                    취소
                  </button>

                  <button
                    type="button"
                    className="save-button"
                    onClick={
                      saveDocument
                    }
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


            {/* EDITOR */}

            {editing ? (
              <div className="editor-area">

                <div className="editor-help">
                  💡 문서 연결:{" "}
                  <strong>
                    [[문서명]]
                  </strong>
                  <br />
                  💡 목차:{" "}
                  <strong>
                    ## 제목
                  </strong>{" "}
                  또는{" "}
                  <strong>
                    ### 소제목
                  </strong>
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


        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="sidebar">

          {/* TOC */}

          {headings.length > 0 && (
            <div className="sidebar-card toc-card">

              <div className="sidebar-title">
                목차
              </div>

              <div className="toc-list">

                {headings.map(
                  (heading) => (
                    <button
                      key={heading.id}
                      type="button"
                      className={`toc-item toc-level-${heading.level}`}
                      onClick={() =>
                        scrollToHeading(
                          heading.id
                        )
                      }
                    >
                      {heading.title}
                    </button>
                  )
                )}

              </div>

            </div>
          )}


          {/* THIS DOCUMENT */}

          <div className="sidebar-card">

            <div className="sidebar-title">
              이 문서
            </div>

            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior:
                    "smooth",
                })
              }
            >
              📖 문서 읽기
            </button>

            {!editing && (
              <button
                type="button"
                onClick={
                  startEditing
                }
              >
                ✎ 문서 수정
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(
                  window.location.href
                );

                alert(
                  "문서 링크를 복사했습니다."
                );
              }}
            >
              🔗 링크 복사
            </button>

          </div>


          {/* WIKI */}

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

            <button
              type="button"
              onClick={
                openCreateDocument
              }
            >
              ＋ 새 문서
            </button>

          </div>

        </aside>

      </div>

    </main>
  );
}