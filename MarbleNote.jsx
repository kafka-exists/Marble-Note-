"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ── Constants ── */
const FOLDER_COLORS = ["#FFE44D", "#C4B5FD", "#86EFAC", "#FCA5A5", "#93C5FD", "#FCD34D"];
const FOLDER_EMOJIS = ["💼", "✈️", "📋", "🎨", "📚", "🎯"];

const DEFAULT_FOLDERS = [
  { id: "f1", name: "My Work", color: "#FFE44D", emoji: "💼" },
  { id: "f2", name: "Travel Plans", color: "#C4B5FD", emoji: "✈️" },
  { id: "f3", name: "Plan", color: "#86EFAC", emoji: "📋" },
  { id: "f4", name: "Ideas", color: "#93C5FD", emoji: "🎨" },
];

const DEFAULT_NOTES = [
  {
    id: "n1", folderId: "f1", title: "Overview",
    content: "Project overview and goals for Q4.\n\n• Launch new dashboard\n• Improve onboarding\n• Reach 10k users",
    date: "2024-12-07", pinned: false, emoji: "📋",
  },
  {
    id: "n2", folderId: "f1", title: "Meeting Notes",
    content: "Key Points Discussed:\n• Redesign the onboarding flow to improve user retention.\n• Update color scheme for accessibility compliance.\n• Prioritize user testing for the new feature release.",
    date: "2024-12-07", pinned: true, emoji: "📝",
  },
  {
    id: "n3", folderId: "f1", title: "Feedback",
    content: "User feedback collected from interviews:\n\n• Navigation feels intuitive\n• Dark mode requested by 80% of users\n• Search needs improvement",
    date: "2024-12-06", pinned: false, emoji: "💬",
  },
  {
    id: "n4", folderId: "f1", title: "Creative Ideas",
    content: "Brainstorm dump:\n\n• Animated onboarding with illustrations\n• Gamification badges\n• Weekly digest email\n• AI-powered note suggestions",
    date: "2024-12-05", pinned: false, emoji: "💡",
  },
  {
    id: "n5", folderId: "f2", title: "Tokyo Trip",
    content: "Day 1: Shinjuku\nDay 2: Asakusa & Shibuya\nDay 3: Kyoto bullet train\n\nBookings:\n• Flight: Mar 22\n• Hotel: Park Hyatt",
    date: "2024-11-30", pinned: false, emoji: "🗺️",
  },
  {
    id: "n6", folderId: "f2", title: "Packing List",
    content: "Clothes:\n• 5x t-shirts\n• 2x jeans\n• Rain jacket\n\nTech:\n• Laptop + charger\n• Camera\n• Power bank",
    date: "2024-11-28", pinned: false, emoji: "🧳",
  },
  {
    id: "n7", folderId: "f3", title: "Design Tips",
    content: "• Keep it simple\n• Focus on usability\n• Consistent spacing\n• Always test with real users\n• Typography is 90% of design",
    date: "2024-12-01", pinned: true, emoji: "⭐",
  },
  {
    id: "n8", folderId: "f3", title: "Daily Goals",
    content: "• Update color palette\n• Review pull requests\n• 30 min reading\n• Exercise",
    date: "2024-12-07", pinned: false, emoji: "🎯",
  },
];

/* ── Helpers ── */
const genId = () => Math.random().toString(36).slice(2, 9);

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored));
    } catch {}
  }, [key]);

  const set = useCallback(
    (updater) => {
      setValue((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [key]
  );

  return [value, set];
}

/* ══════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════ */
export default function MarbleNote() {
  const [folders, setFolders] = useLocalStorage("mn_folders", DEFAULT_FOLDERS);
  const [notes, setNotes] = useLocalStorage("mn_notes", DEFAULT_NOTES);
  const [activeFolderId, setActiveFolderId] = useLocalStorage("mn_activeFolder", "f1");
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [view, setView] = useState("home");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  /* ── CRUD ── */
  const createNote = (folderId) => {
    const note = {
      id: genId(), folderId, title: "Untitled", content: "",
      date: new Date().toISOString().slice(0, 10), pinned: false, emoji: "📝",
    };
    setNotes((n) => [note, ...n]);
    setActiveNoteId(note.id);
    setView("editor");
  };

  const updateNote = (id, patch) =>
    setNotes((n) => n.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const deleteNote = (id) => {
    setNotes((n) => n.filter((x) => x.id !== id));
    setView("home");
    showToast("Note deleted");
  };

  const createFolder = (name, color, emoji) => {
    setFolders((f) => [...f, { id: genId(), name, color, emoji }]);
    showToast("Folder created!");
  };

  const deleteFolder = (id) => {
    setFolders((f) => f.filter((x) => x.id !== id));
    setNotes((n) => n.filter((x) => x.folderId !== id));
    if (activeFolderId === id) setActiveFolderId(folders[0]?.id);
    showToast("Folder deleted");
  };

  /* ── Export / Import ── */
  const exportJSON = () => {
    const data = JSON.stringify({ folders, notes }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marble-note-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported successfully ✓");
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.folders && data.notes) {
          setFolders(data.folders);
          setNotes(data.notes);
          setActiveFolderId(data.folders[0]?.id);
          showToast("Import successful ✓");
        } else throw new Error();
      } catch {
        showToast("Invalid file ✗");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const activeNote = notes.find((n) => n.id === activeNoteId);
  const folderNotes = notes.filter((n) => n.folderId === activeFolderId);
  const searchResults = searchQ
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQ.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQ.toLowerCase())
      )
    : [];

  return (
    <div
      style={{
        fontFamily: "'Nunito', sans-serif",
        background: "#F0EFF8",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "24px 16px",
      }}
    >
      {/* Phone shell */}
      <div
        style={{
          width: 390,
          minHeight: 720,
          background: "#FAFAF9",
          borderRadius: 36,
          overflow: "hidden",
          boxShadow:
            "0 32px 80px rgba(80,50,140,0.22), 0 4px 12px rgba(0,0,0,0.08)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {view === "home" && (
          <HomeView
            folders={folders}
            notes={notes}
            activeFolderId={activeFolderId}
            setActiveFolderId={setActiveFolderId}
            folderNotes={folderNotes}
            onOpenNote={(id) => {
              setActiveNoteId(id);
              setView("editor");
            }}
            onNewNote={() => createNote(activeFolderId)}
            onExport={exportJSON}
            onImportClick={() => fileRef.current.click()}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            searchQ={searchQ}
            setSearchQ={setSearchQ}
            searchResults={searchResults}
            onNewFolder={createFolder}
            onDeleteFolder={deleteFolder}
          />
        )}

        {view === "editor" && activeNote && (
          <EditorView
            note={activeNote}
            folder={folders.find((f) => f.id === activeNote.folderId)}
            onBack={() => setView("home")}
            onUpdate={(patch) => updateNote(activeNote.id, patch)}
            onDelete={() => deleteNote(activeNote.id)}
          />
        )}

        {toast && (
          <div
            style={{
              position: "absolute",
              bottom: 90,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#1a1a2e",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              zIndex: 999,
              animation: "fadeup 0.3s ease",
            }}
          >
            {toast}
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={importJSON}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOME VIEW
══════════════════════════════════════════════ */
function HomeView({
  folders, notes, activeFolderId, setActiveFolderId, folderNotes,
  onOpenNote, onNewNote, onExport, onImportClick,
  showSearch, setShowSearch, searchQ, setSearchQ, searchResults,
  onNewFolder, onDeleteFolder,
}) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const recentNotes = [...notes]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Status bar mock */}
      <div
        style={{
          display: "flex", justifyContent: "space-between",
          padding: "14px 24px 0", fontSize: 12, fontWeight: 800, color: "#1a1a2e",
        }}
      >
        <span>9:41</span>
        <span>◼◼ ≋ ▮</span>
      </div>

      {/* Header */}
      <div
        style={{
          padding: "12px 24px 0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>✏️</span>
            <span
              style={{
                fontFamily: "'Caveat', cursive", fontSize: 26,
                fontWeight: 700, color: "#1a1a2e",
              }}
            >
              Marble note
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 2, fontWeight: 500 }}>
            Hello! What will you capture today?
          </div>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 4, color: "#444" }}
        >
          🔍
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: "10px 24px 0", animation: "slidein 0.2s ease" }}>
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search notes..."
            style={{
              width: "100%", padding: "10px 16px", borderRadius: 14,
              border: "2px solid #E5E0F8", background: "#fff",
              fontSize: 14, fontFamily: "'Nunito', sans-serif", fontWeight: 600,
            }}
            autoFocus
          />
        </div>
      )}

      {/* Search Results */}
      {searchQ && (
        <div style={{ padding: "12px 24px", flex: 1, overflowY: "auto" }}>
          <div
            style={{
              fontSize: 12, fontWeight: 800, color: "#999",
              letterSpacing: 1, marginBottom: 8,
            }}
          >
            RESULTS ({searchResults.length})
          </div>
          {searchResults.length === 0 ? (
            <div style={{ textAlign: "center", color: "#bbb", fontSize: 14, marginTop: 32 }}>
              Nothing found 🔍
            </div>
          ) : (
            searchResults.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                folder={folders.find((f) => f.id === n.folderId)}
                onClick={() => onOpenNote(n.id)}
                compact
              />
            ))
          )}
        </div>
      )}

      {!searchQ && (
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
          {/* Export/Import strip */}
          <div style={{ padding: "10px 24px 0", display: "flex", gap: 8 }}>
            <button
              onClick={onExport}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 12,
                border: "2px solid #E5E0F8", background: "#fff",
                fontSize: 12, fontWeight: 800, color: "#7B5EA7",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 5,
              }}
            >
              ⬆️ Export JSON
            </button>
            <button
              onClick={onImportClick}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 12,
                border: "2px solid #E5E0F8", background: "#fff",
                fontSize: 12, fontWeight: 800, color: "#7B5EA7",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 5,
              }}
            >
              ⬇️ Import JSON
            </button>
          </div>

          {/* Folder tabs */}
          <div style={{ padding: "16px 24px 0" }}>
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>
                My folders
              </span>
              <button
                onClick={() => setShowFolderModal(true)}
                style={{
                  background: "#1a1a2e", color: "#fff", border: "none",
                  borderRadius: 20, padding: "4px 12px",
                  fontSize: 11, fontWeight: 800, cursor: "pointer",
                }}
              >
                + New
              </button>
            </div>
            <div
              style={{
                display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
              }}
            >
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFolderId(f.id)}
                  style={{
                    flexShrink: 0, padding: "6px 14px", borderRadius: 20,
                    border: "none",
                    background: activeFolderId === f.id ? "#1a1a2e" : "#EEEAF8",
                    color: activeFolderId === f.id ? "#fff" : "#555",
                    fontSize: 13, fontWeight: 800, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "all 0.2s",
                  }}
                >
                  <span>{f.emoji}</span>
                  {f.name} ({notes.filter((n) => n.folderId === f.id).length})
                </button>
              ))}
            </div>
          </div>

          {/* Active folder card */}
          {activeFolder && (
            <div style={{ margin: "14px 24px 0" }}>
              <div
                style={{
                  background: "#fff", borderRadius: 20, boxShadow:
                    "0 2px 16px rgba(120,80,200,0.08)", overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute", top: -4, left: 8, right: 8,
                    height: 14, background: activeFolder.color,
                    borderRadius: "12px 12px 0 0", opacity: 0.5,
                  }}
                />
                <div
                  style={{
                    position: "absolute", top: -8, left: 16, right: 16,
                    height: 14, background: activeFolder.color,
                    borderRadius: "12px 12px 0 0", opacity: 0.3,
                  }}
                />
                <div
                  style={{
                    background: activeFolder.color,
                    padding: "18px 18px 12px",
                    borderRadius: "20px 20px 0 0",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>
                      {activeFolder.emoji} {activeFolder.name}
                    </span>
                    <button
                      onClick={() => onDeleteFolder(activeFolder.id)}
                      style={{
                        background: "rgba(0,0,0,0.1)", border: "none",
                        borderRadius: 8, padding: "3px 8px",
                        fontSize: 11, cursor: "pointer", fontWeight: 700,
                      }}
                    >
                      🗑
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                    {folderNotes.length} notes
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px 18px 18px",
                    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
                  }}
                >
                  {folderNotes.length === 0 ? (
                    <div
                      style={{
                        gridColumn: "1/-1", textAlign: "center",
                        color: "#bbb", fontSize: 13, padding: "16px 0",
                      }}
                    >
                      No notes yet. Create one! ✏️
                    </div>
                  ) : (
                    folderNotes.slice(0, 4).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => onOpenNote(n.id)}
                        style={{
                          background: "#F8F7FF", border: "2px solid #EEE",
                          borderRadius: 14, padding: "10px 12px",
                          textAlign: "left", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 8,
                          transition: "transform 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <span style={{ fontSize: 16 }}>{n.emoji}</span>
                        <span
                          style={{
                            fontSize: 13, fontWeight: 700, color: "#1a1a2e",
                            overflow: "hidden", textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {n.title}
                        </span>
                      </button>
                    ))
                  )}
                  {folderNotes.length > 4 && (
                    <div
                      style={{
                        gridColumn: "1/-1", textAlign: "center",
                        fontSize: 12, color: "#999", fontWeight: 700,
                      }}
                    >
                      +{folderNotes.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Notes */}
          <div style={{ padding: "20px 24px 0" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e", marginBottom: 12 }}>
              Recent notes
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentNotes.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  folder={folders.find((f) => f.id === n.folderId)}
                  onClick={() => onOpenNote(n.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "#1a1a2e", borderRadius: "0 0 36px 36px",
          padding: "12px 0 20px",
          display: "flex", justifyContent: "space-around", alignItems: "center",
        }}
      >
        <NavBtn icon="🏠" label="Home" active />
        <NavBtn icon="🔖" label="Saved" />
        <button
          onClick={onNewNote}
          style={{
            background: "#FFE44D", border: "none", borderRadius: "50%",
            width: 52, height: 52, fontSize: 22, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(255,228,77,0.5)",
            marginTop: -24, transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ✏️
        </button>
        <NavBtn icon="📅" label="Calendar" />
        <NavBtn icon="👤" label="Profile" />
      </div>

      {showFolderModal && (
        <NewFolderModal
          onClose={() => setShowFolderModal(false)}
          onCreate={onNewFolder}
        />
      )}
    </div>
  );
}

function NavBtn({ icon, label, active }) {
  return (
    <button
      style={{
        background: "none", border: "none", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        color: active ? "#FFE44D" : "#888",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span
        style={{
          fontSize: 10, fontWeight: 700, fontFamily: "'Nunito', sans-serif",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function NoteCard({ note, folder, onClick, compact }) {
  const lines = note.content.split("\n").filter(Boolean).slice(0, 3);
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", background: "#fff", border: "2px solid #F0EDF8",
        borderRadius: 18, padding: compact ? "10px 14px" : "14px 16px",
        textAlign: "left", cursor: "pointer",
        display: "flex", gap: 12, alignItems: "flex-start",
        transition: "all 0.15s", boxShadow: "0 2px 8px rgba(120,80,200,0.05)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#C4B5FD";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#F0EDF8";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <span style={{ fontSize: compact ? 20 : 24, flexShrink: 0 }}>
        {note.pinned ? "⭐" : note.emoji}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontSize: 14, fontWeight: 800, color: "#1a1a2e",
              overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", maxWidth: 180,
            }}
          >
            {note.title}
          </span>
          <span style={{ fontSize: 11, color: "#bbb", fontWeight: 600, flexShrink: 0 }}>
            {fmt(note.date)}
          </span>
        </div>
        {!compact &&
          lines.map((l, i) => (
            <div
              key={i}
              style={{
                fontSize: 12, color: "#888", fontWeight: 600,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                marginTop: i === 0 ? 4 : 0,
              }}
            >
              {l}
            </div>
          ))}
        {folder && (
          <span
            style={{
              display: "inline-block", marginTop: 5,
              fontSize: 11, fontWeight: 800, color: "#7B5EA7",
              background: "#F0EDF8", borderRadius: 10, padding: "2px 8px",
            }}
          >
            {folder.emoji} {folder.name}
          </span>
        )}
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════
   EDITOR VIEW
══════════════════════════════════════════════ */
function EditorView({ note, folder, onBack, onUpdate, onDelete }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [emoji, setEmoji] = useState(note.emoji);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const contentRef = useRef();

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setEmoji(note.emoji);
  }, [note.id]);

  const save = useCallback(() => {
    onUpdate({
      title: title || "Untitled",
      content,
      emoji,
      date: new Date().toISOString().slice(0, 10),
    });
  }, [title, content, emoji, onUpdate]);

  useEffect(() => {
    const t = setTimeout(save, 600);
    return () => clearTimeout(t);
  }, [title, content, emoji, save]);

  const insertFormat = (prefix, suffix = "") => {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);
    const newContent =
      content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = end + prefix.length;
      ta.focus();
    }, 10);
  };

  const EMOJIS = [
    "📝", "💡", "⭐", "📋", "💬", "🎨",
    "🗺️", "🧳", "🎯", "📚", "💼", "🔖",
    "😊", "🚀", "💜",
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Status */}
      <div
        style={{
          display: "flex", justifyContent: "space-between",
          padding: "14px 24px 0", fontSize: 12, fontWeight: 800, color: "#1a1a2e",
        }}
      >
        <span>9:41</span>
        <span>◼◼ ≋ ▮</span>
      </div>

      {/* Top bar */}
      <div
        style={{
          padding: "10px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "#EEEAF8", border: "none", borderRadius: 12,
            padding: "7px 12px", cursor: "pointer",
            fontSize: 14, fontWeight: 800, color: "#555",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          ‹ Back
        </button>
        <div
          style={{
            background: "#EEEAF8", borderRadius: 20,
            padding: "5px 14px", fontSize: 13,
            fontWeight: 700, color: "#7B5EA7",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          {folder ? (
            <>
              <span>{folder.emoji}</span>
              {folder.name}
            </>
          ) : (
            "No folder"
          )}
        </div>
        <button
          onClick={onDelete}
          style={{
            background: "#FFE4E4", border: "none", borderRadius: 12,
            padding: "7px 12px", cursor: "pointer", fontSize: 14, color: "#e05",
          }}
        >
          🗑
        </button>
      </div>

      {/* Title area */}
      <div style={{ padding: "0 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            background: "#F5F3FF", border: "2px solid #E5E0F8", borderRadius: 14,
            width: 44, height: 44, fontSize: 22, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {emoji}
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          style={{
            flex: 1, border: "none", background: "transparent",
            fontSize: 22, fontWeight: 900, color: "#1a1a2e",
            fontFamily: "'Nunito', sans-serif",
          }}
        />
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div
          style={{
            margin: "8px 24px", background: "#fff", borderRadius: 16,
            border: "2px solid #E5E0F8", padding: "10px",
            display: "flex", flexWrap: "wrap", gap: 6,
            animation: "slidein 0.2s ease",
          }}
        >
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => {
                setEmoji(e);
                setShowEmojiPicker(false);
              }}
              style={{
                background: emoji === e ? "#E5E0F8" : "none",
                border: "none", borderRadius: 8, padding: 5,
                fontSize: 20, cursor: "pointer",
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: "2px 24px 8px", fontSize: 12, color: "#bbb", fontWeight: 600 }}>
        {fmt(note.date)} · Auto-saved
      </div>

      <div style={{ height: 1, background: "#F0EDF8", margin: "0 24px" }} />

      {/* Content area */}
      <textarea
        ref={contentRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={"Start writing your note...\n\nTip: Use • for bullet points"}
        style={{
          flex: 1, padding: "16px 24px", border: "none",
          background: "transparent", resize: "none",
          fontSize: 15, lineHeight: 1.75, color: "#333",
          fontFamily: "'Nunito', sans-serif", fontWeight: 500,
          overflowY: "auto",
        }}
      />

      {/* Formatting toolbar */}
      <div
        style={{
          background: "#1a1a2e", borderRadius: "0 0 36px 36px",
          padding: "14px 20px 24px",
          display: "flex", alignItems: "center", gap: 4,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[
            { label: "B", title: "Bold", fn: () => insertFormat("**", "**"), style: { fontWeight: 900 } },
            { label: "I", title: "Italic", fn: () => insertFormat("_", "_"), style: { fontStyle: "italic" } },
            { label: "U̲", title: "Underline", fn: () => insertFormat("<u>", "</u>") },
            { label: "•", title: "Bullet", fn: () => insertFormat("\n• ") },
            { label: "1.", title: "Numbered", fn: () => insertFormat("\n1. ") },
            { label: "—", title: "Divider", fn: () => insertFormat("\n\n—————\n\n") },
            { label: "☐", title: "Checkbox", fn: () => insertFormat("\n☐ "), style: { fontSize: 10 } },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.fn}
              title={btn.title}
              style={{
                background: "rgba(255,255,255,0.1)", border: "none",
                borderRadius: 10, width: 36, height: 36,
                color: "#fff", cursor: "pointer",
                fontSize: 13, fontWeight: 800,
                fontFamily: "'Nunito', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
                ...btn.style,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => onUpdate({ pinned: !note.pinned })}
          style={{
            background: note.pinned ? "#FFE44D" : "rgba(255,255,255,0.1)",
            border: "none", borderRadius: 10,
            width: 36, height: 36, cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ⭐
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   NEW FOLDER MODAL
══════════════════════════════════════════════ */
function NewFolderModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [emoji, setEmoji] = useState(FOLDER_EMOJIS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), color, emoji);
    onClose();
  };

  return (
    <div
      style={{
        position: "absolute", inset: 0,
        background: "rgba(20,15,40,0.55)",
        display: "flex", alignItems: "flex-end",
        borderRadius: 36, zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: "28px 28px 36px 36px",
          padding: "28px 24px 32px", width: "100%",
          animation: "slidein 0.25s ease",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 900, color: "#1a1a2e", marginBottom: 20 }}>
          New Folder
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name..."
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 14,
            border: "2px solid #E5E0F8", fontSize: 15,
            fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginBottom: 16,
          }}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#999", marginBottom: 8 }}>
            PICK AN EMOJI
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FOLDER_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  background: emoji === e ? "#E5E0F8" : "#F8F7FF",
                  border: emoji === e ? "2px solid #9B7FD4" : "2px solid transparent",
                  borderRadius: 12, width: 40, height: 40,
                  fontSize: 20, cursor: "pointer",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#999", marginBottom: 8 }}>
            PICK A COLOR
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  background: c,
                  border: color === c ? "3px solid #1a1a2e" : "3px solid transparent",
                  borderRadius: 12, width: 36, height: 36, cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 16,
              border: "2px solid #E5E0F8", background: "#fff",
              fontSize: 14, fontWeight: 800, cursor: "pointer", color: "#888",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            style={{
              flex: 2, padding: "12px 0", borderRadius: 16,
              border: "none", background: "#1a1a2e",
              color: "#FFE44D", fontSize: 14, fontWeight: 900, cursor: "pointer",
            }}
          >
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
}
