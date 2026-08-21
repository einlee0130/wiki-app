"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // 문서 불러오기
  async function loadDocument(slug) {
    setLoading(true);
    setError("");

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
      setError("문서를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    setDocument(data[0]);
    setLoading(false);
  }

  // 처음 실행
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("doc") || "main";

    loadDocument(slug);
  }, []);

  // ⭐ 수정 버튼
  function startEditing() {
    console.log("수정 버튼 클릭됨!");

    if (!document) {
      console.log("document가 없음");
      return;
    }

    setEditTitle(document.title || "");
    setEditContent(document.content || "");
    setEditing(true);
  }

  // 취소
  function cancelEditing() {
    setEditing(false);
  }

  // 저장
  async function saveDocument() {
    if (!document) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("documents")
      .update({
        title: editTitle,
        content: editContent,
      })
      .eq("id", document.id)
      .select("*");

    console.log("저장 결과:", data);
    console.log("저장 에러:", error);

    if (error) {
      alert("저장 실패: " + error.message);
      setSaving(false);
      return;
    }

    if (!data || data.length === 0) {
      alert(
        "저장되지 않았습니다.\nSupabase UPDATE policy를 확인해주세요."
      );

      setSaving(false);
      return;
    }

    setDocument(data[0]);
    setEditing(false);
    setSaving(false);

    alert("저장되었습니다!");
  }

  // [[문서명]] 처리
  function renderContent(content) {
    if (!content) return null;

    const parts = content.split(/(\[\[.*?\]\])/g);

    return parts.map((part, index) => {
      const match = part.match(/^\[\[(.*?)\]\]$/);

      if (!match) {
        return <span key={index}>{part}</span>;
      }

      const title = match[1].trim();

      return (
        <button
          key={index}
          type="button"
          className="wiki-link"
        >
          {title}
        </button>
      );
    });
  }

  if (loading) {
    return (
      <main className="loading-screen">
        <p>여름위키 불러오는 중...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="error-screen">
        <h1>오류</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <main className="wiki-app">

      {/* HEADER */}

      <header className="header">
        <div className="header-inner">

          <button
            type="button"
            className="logo"
            onClick={() => loadDocument("main")}
          >
            ✦ 여름위키
          </button>

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="무엇이든 검색해보세요"
            />
          </div>

        </div>
      </header>


      {/* PAGE */}

      <div className="page-container">

        <div className="content">

          <div className="breadcrumb">
            <button
              type="button"
              onClick={() => loadDocument("main")}
            >
              여름위키
            </button>

            <span>›</span>

            <span>{document.title}</span>
          </div>


          <article className="document">

            {/* 문서 제목 */}

            <div className="document-header">

              <div>
                <div className="document-label">
                  WIKI DOCUMENT
                </div>

                {editing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) =>
                      setEditTitle(e.target.value)
                    }
                    className="edit-title-input"
                  />
                ) : (
                  <h1>{document.title}</h1>
                )}
              </div>


              {/* ⭐ 여기 */}

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


            {/* 본문 */}

            {editing ? (
              <div className="editor-area">

                <textarea
                  className="document-editor"
                  value={editContent}
                  onChange={(e) =>
                    setEditContent(e.target.value)
                  }
                  placeholder="문서 내용을 입력하세요."
                />

              </div>
            ) : (
              <div className="document-content">
                {renderContent(document.content)}
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

            <button
              type="button"
              onClick={startEditing}
            >
              ✎ 문서 수정
            </button>

          </div>

        </aside>

      </div>

    </main>
  );
}