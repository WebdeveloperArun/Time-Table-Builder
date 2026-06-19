import { useState, useEffect, useMemo } from "react";
import { DARK, LIGHT } from "./utils/theme.js";
import { TEMPLATES } from "./utils/constants.js";
import { buildDefaultGrid, buildBBSBECGrid, getConflicts, uid, makeCell } from "./utils/grid.js";
import { loadSaved, saveTables } from "./utils/storage.js";
import { exportToExcel } from "./utils/excel.js";
import Sidebar from "./components/Sidebar.jsx";
import HeaderEditor from "./components/HeaderEditor.jsx";
import HeaderBanner from "./components/HeaderBanner.jsx";
import TimetableGrid from "./components/TimetableGrid.jsx";
import TemplateSelector from "./components/TemplateSelector.jsx";
import GroupEditor from "./components/GroupEditor.jsx";
import AddRowModal from "./components/AddRowModal.jsx";
import TimeSlotEngine from "./components/TimeSlotEngine.jsx";
import DayBuilderModal from "./components/DayBuilderModal.jsx";
import TeacherView from "./components/TeacherView.jsx";
import PrintView from "./components/PrintView.jsx";

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const T = isDark ? DARK : LIGHT;

  const [saved, setSaved] = useState(() => loadSaved());
  const [currentId, setCurrentId] = useState(null);
  const [header, setHeader] = useState({ title: "MY TIMETABLE" });
  const [groups, setGroups] = useState([{ lab: "Room A", group: "GROUP 1" }]);
  const [rows, setRows] = useState(() => buildDefaultGrid([{ lab: "Room A", group: "GROUP 1" }]));

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const [showTemplate, setShowTemplate] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showTimeEngine, setShowTimeEngine] = useState(false);
  const [showDayBuilder, setShowDayBuilder] = useState(false);
  const [showTeachers, setShowTeachers] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState(null);

  const conflicts = useMemo(() => getConflicts(rows), [rows]);

  useEffect(() => {
    saveTables(saved);
  }, [saved]);

  const msg = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2600);
  };

  const saveState = () => {
    setPast(p => [...p, { rows, groups }].slice(-30));
    setFuture([]);
  };

  const handleUndo = () => {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setFuture(f => [{ rows, groups }, ...f]);
    setPast(p => p.slice(0, -1));
    setRows(previous.rows);
    setGroups(previous.groups);
  };

  const handleRedo = () => {
    if (!future.length) return;
    const next = future[0];
    setPast(p => [...p, { rows, groups }]);
    setFuture(f => f.slice(1));
    setRows(next.rows);
    setGroups(next.groups);
  };

  const handleSave = () => {
    const snapshot = { id: currentId || `tt-${Date.now()}`, header, groups, rows, savedAt: Date.now() };
    setSaved(p => [snapshot, ...p.filter(s => s.id !== snapshot.id)]);
    setCurrentId(snapshot.id);
    msg("Saved!");
  };

  const handleOpen = (id) => {
    const found = saved.find(x => x.id === id);
    if (!found) return;
    saveState();
    setCurrentId(found.id);
    setHeader(found.header);
    setGroups(found.groups);
    setRows(found.rows);
  };

  const handleDelete = (id) => {
    setSaved(p => p.filter(s => s.id !== id));
    if (currentId === id) setCurrentId(null);
  };

  const handleTemplate = (key) => {
    saveState();
    if (key === "blank") {
      const g = [{ lab: "Room A", group: "GROUP 1" }];
      setHeader({ title: "NEW TIMETABLE" });
      setGroups(g);
      setRows(buildDefaultGrid(g));
    } else if (key === "bbsbec") {
      const t = TEMPLATES[key];
      setHeader(t.header);
      setGroups(t.groups);
      setRows(buildBBSBECGrid(t.groups));
    } else {
      const t = TEMPLATES[key];
      setHeader(t.header);
      setGroups(t.groups);
      setRows(buildDefaultGrid(t.groups));
    }
    setCurrentId(null);
    msg("Template loaded!");
  };

  const handleGroupChange = (updatedGroups) => {
    saveState();
    setGroups(updatedGroups);
    setRows(p => p.map(r => ({ ...r, cells: updatedGroups.map((_, gi) => r.cells[gi] || makeCell()) })));
    msg("Groups updated!");
  };

  const handleCellEdit = (ri, ci, value) => {
    saveState();
    setRows(p => {
      const next = p.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
      next[ri].cells[ci] = { ...next[ri].cells[ci], ...value };
      return next;
    });
  };

  const handleRowEdit = (ri, { day, time, isRecess }) => {
    saveState();
    setRows(p => {
      const next = p.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
      next[ri] = { ...next[ri], day, time, isRecess };
      return next;
    });
  };

  const handleRowDelete = (ri) => {
    saveState();
    setRows(p => p.filter((_, i) => i !== ri));
    msg("Row deleted");
  };

  const handleRowMove = (ri, dir) => {
    saveState();
    setRows(p => {
      const next = [...p];
      const target = dir === "up" ? ri - 1 : ri + 1;
      if (target < 0 || target >= next.length) return next;
      [next[ri], next[target]] = [next[target], next[ri]];
      return next;
    });
  };

  const handleRowDuplicate = (ri) => {
    saveState();
    setRows(p => {
      const next = [...p];
      const copy = { ...next[ri], id: uid(), cells: next[ri].cells.map(c => ({ ...c })) };
      next.splice(ri + 1, 0, copy);
      return next;
    });
    msg("Row duplicated");
  };

  const handleInsertRowBelow = (ri) => {
    saveState();
    setRows(p => {
      const next = [...p];
      const ref = next[ri];
      next.splice(ri + 1, 0, { id: uid(), day: ref.day, time: "", isRecess: false, cells: ref.cells.map(() => makeCell()) });
      return next;
    });
    msg("Blank row inserted");
  };

  const handleToggleRecess = (ri) => {
    saveState();
    setRows(p => {
      const next = p.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
      next[ri] = { ...next[ri], isRecess: !next[ri].isRecess };
      return next;
    });
  };

  const handleAutoResolve = () => {
    saveState();
    setRows(p => {
      const next = p.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
      const grouping = {};
      next.forEach(row => {
        if (row.isRecess) return;
        row.cells.forEach((cell, ci) => {
          if (!cell.teacher?.trim() || cell.mode === "free" || cell.mergedWith?.length) return;
          const key = `${cell.teacher.trim().toUpperCase()}|${row.time}`;
          if (!grouping[key]) grouping[key] = [];
          grouping[key].push({ rowId: row.id, ci });
        });
      });
      Object.values(grouping).forEach(entries => {
        if (entries.length < 2) return;
        entries.slice(1).forEach(entry => {
          const row = next.find(r => r.id === entry.rowId);
          if (row) row.cells[entry.ci] = { ...row.cells[entry.ci], teacher: "" };
        });
      });
      return next;
    });
    msg("Conflicts resolved — duplicate teachers cleared");
  };

  const handleAddRow = ({ day, time, isRecess, pos }) => {
    saveState();
    const newRow = { id: uid(), day, time, isRecess, cells: groups.map(() => isRecess ? makeCell({ subject: "R" }) : makeCell()) };
    setRows(p => pos === "start" ? [newRow, ...p] : [...p, newRow]);
    msg("Row added!");
  };

  const handleMergeCells = (ri, ci, targets) => {
    saveState();
    setRows(p => {
      const next = p.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
      const source = next[ri].cells[ci];
      next[ri].cells[ci] = { ...source, mergedWith: [...new Set([...(source.mergedWith || []), ...targets])] };
      targets.forEach(ti => {
        if (ti >= 0 && ti < next[ri].cells.length) {
          next[ri].cells[ti] = { ...next[ri].cells[ti], mode: "merged", subject: source.subject, teacher: source.teacher, mergedWith: [ci] };
        }
      });
      return next;
    });
    msg("Classes merged — same teacher for selected groups");
  };

  const handleUnmergeCells = (ri, ci) => {
    saveState();
    setRows(p => {
      const next = p.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
      const source = next[ri].cells[ci];
      const targets = source.mergedWith || [];
      next[ri].cells[ci] = { ...source, mergedWith: [] };
      targets.forEach(ti => {
        if (ti >= 0 && ti < next[ri].cells.length) next[ri].cells[ti] = { ...next[ri].cells[ti], mode: "normal", mergedWith: [] };
      });
      return next;
    });
    msg("Un-merged");
  };

  const handleMarkFree = (ri, ci) => {
    saveState();
    setRows(p => {
      const next = p.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
      next[ri].cells[ci] = makeCell({ mode: "free" });
      return next;
    });
  };

  const handleUnmarkFree = (ri, ci) => {
    saveState();
    setRows(p => {
      const next = p.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
      next[ri].cells[ci] = makeCell();
      return next;
    });
  };

  const handleCopyToAll = (ri, ci) => {
    saveState();
    setRows(p => {
      const next = p.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
      const source = { ...next[ri].cells[ci] };
      next[ri].cells = next[ri].cells.map(() => ({ ...source }));
      return next;
    });
    msg("Copied to all groups");
  };

  const handleToggleIgnoreConflict = (ri, ci) => {
    saveState();
    setRows(p => {
      const next = p.map(r => ({ ...r, cells: r.cells.map(c => ({ ...c })) }));
      next[ri].cells[ci].ignoreConflict = !next[ri].cells[ci].ignoreConflict;
      return next;
    });
    msg("Conflict override updated");
  };

  const exportExcel = () => exportToExcel(header, rows, groups, msg);

  const bSec = { display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", background: "transparent", border: `1px solid ${T.border}`, color: T.textSecondary };
  const bPri = { ...bSec, background: T.accent, border: "none", color: "#fff", fontWeight: 600 };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif', color: T.textPrimary, overflow: "hidden" }}>
      {showTemplate && <TemplateSelector onSelect={handleTemplate} onClose={() => setShowTemplate(false)} T={T} />}
      {showGroups && <GroupEditor groups={groups} onChange={handleGroupChange} onClose={() => setShowGroups(false)} T={T} />}
      {showAddRow && <AddRowModal groups={groups} onAdd={handleAddRow} onClose={() => setShowAddRow(false)} T={T} />}
      {showPrint && <PrintView header={header} rows={rows} groups={groups} onClose={() => setShowPrint(false)} />}
      {showTimeEngine && <TimeSlotEngine groups={groups} onGenerate={r => { saveState(); setRows(r); setCurrentId(null); }} onClose={() => setShowTimeEngine(false)} T={T} />}
      {showDayBuilder && <DayBuilderModal rows={rows} groups={groups} onApply={r => { saveState(); setRows(r); msg("Day built successfully!"); }} onClose={() => setShowDayBuilder(false)} T={T} />}
      {showTeachers && <TeacherView rows={rows} groups={groups} conflicts={conflicts} onAutoResolve={handleAutoResolve} onClose={() => setShowTeachers(false)} T={T} />}

      {toast && <div style={{ position: "fixed", bottom: 20, right: 20, background: toast.type === "success" ? T.success : toast.type === "error" ? T.danger : T.accent, color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, zIndex: 9999, boxShadow: `0 6px 20px ${T.shadowColor}` }}>{toast.text}</div>}

      <Sidebar saved={saved} currentId={currentId} onOpen={handleOpen} onNew={() => setShowTemplate(true)} onDelete={handleDelete} collapsed={collapsed} T={T} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderBottom: `1px solid ${T.border}`, background: T.surface, flexShrink: 0, flexWrap: "wrap" }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "transparent", border: "none", color: T.textSecondary, cursor: "pointer", padding: "3px 4px", borderRadius: 5 }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
          <div style={{ flex: 1, minWidth: 80 }}>
            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{header.title || "Untitled"}{header.week && <span style={{ color: T.textSecondary, fontWeight: 400 }}> — {header.week}</span>}</div>
          </div>

          <span style={{ color: T.textMuted, fontSize: 10 }}>HISTORY</span>
          <button onClick={handleUndo} disabled={!past.length} style={{ ...bSec, opacity: !past.length ? 0.4 : 1 }}>Undo</button>
          <button onClick={handleRedo} disabled={!future.length} style={{ ...bSec, opacity: !future.length ? 0.4 : 1 }}>Redo</button>
          <div style={{ width: 1, height: 18, background: T.border }} />

          <span style={{ color: T.textMuted, fontSize: 10 }}>GRID</span>
          <button onClick={() => setShowTemplate(true)} style={bSec}>Templates</button>
          <button onClick={() => setShowGroups(true)} style={bSec}>Groups</button>
          <button onClick={() => setShowAddRow(true)} style={bSec}>Add Row</button>
          <div style={{ width: 1, height: 18, background: T.border }} />

          <span style={{ color: T.textMuted, fontSize: 10 }}>SMART</span>
          <button onClick={() => setShowTimeEngine(true)} style={{ ...bSec, color: T.teal, borderColor: `${T.teal}40` }}>Time Engine</button>
          <button onClick={() => setShowDayBuilder(true)} style={{ ...bSec, color: T.purple, borderColor: `${T.purple}40` }}>Day Builder</button>
          <button onClick={() => setShowTeachers(true)} style={bSec}>Teachers{conflicts.size > 0 && <span style={{ background: T.danger, color: "#fff", borderRadius: 3, fontSize: 9, padding: "0 3px", marginLeft: 2 }}>{Math.ceil(conflicts.size / 2)}</span>}</button>
          <div style={{ width: 1, height: 18, background: T.border }} />

          <button onClick={handleSave} style={bPri}>Save</button>
          <button onClick={exportExcel} style={{ ...bSec, color: T.success }}>Excel</button>
          <button onClick={() => setShowPrint(true)} style={{ ...bSec, color: T.warning }}>PDF</button>
          <button onClick={() => setIsDark(!isDark)} title={isDark ? "Light mode" : "Dark mode"} style={{ ...bSec, padding: "5px 7px" }}>{isDark ? "Light" : "Dark"}</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          <HeaderEditor header={header} onChange={setHeader} T={T} />
          <HeaderBanner header={header} T={T} />
          <TimetableGrid
            rows={rows}
            groups={groups}
            conflicts={conflicts}
            onCellEdit={handleCellEdit}
            onRowEdit={handleRowEdit}
            onRowDelete={handleRowDelete}
            onRowMove={handleRowMove}
            onRowDuplicate={handleRowDuplicate}
            onToggleRecess={handleToggleRecess}
            onMergeCells={handleMergeCells}
            onUnmergeCells={handleUnmergeCells}
            onMarkFree={handleMarkFree}
            onUnmarkFree={handleUnmarkFree}
            onCopyToAll={handleCopyToAll}
            onInsertRowBelow={handleInsertRowBelow}
            onToggleIgnoreConflict={handleToggleIgnoreConflict}
            T={T}
          />

          <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", background: `${T.accent}15`, border: `1px solid ${T.accent}40`, padding: "10px 14px", borderRadius: 8 }}>
            <div style={{ color: T.accent, fontSize: 18 }}>💡</div>
            <div style={{ color: T.textPrimary, fontSize: 12, lineHeight: 1.5 }}>
              <strong>Pro Tip:</strong> To <strong style={{ color: T.accentLight }}>Merge Classes</strong> across multiple groups, mark slots as free, or manually force class overrides, simply <strong>Right-Click any cell</strong> on the grid.
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media print{body *{visibility:hidden!important}#print-area,#print-area *{visibility:visible!important}#print-area{position:fixed;top:0;left:0;width:100%}}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
        input:focus,select:focus{border-color:${T.accent}!important;outline:none}*{box-sizing:border-box}
      `}</style>
    </div>
  );
}
