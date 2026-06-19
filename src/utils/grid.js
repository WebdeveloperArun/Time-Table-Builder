import { PRESET_DAYS } from "./constants.js";

export function uid() {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function makeCell(o = {}) {
  return {subject:"",teacher:"",mode:"normal",mergedWith:[],ignoreConflict:false,...o};
}

export function getConflicts(rows) {
  const c = new Set();
  rows.forEach(row => {
    if (row.isRecess) return;
    const tm = {};
    row.cells.forEach((cell, ci) => {
      if (cell.mode === "free" || cell.mode === "merged" || !cell.teacher?.trim()) return;
      if (cell.mergedWith?.length > 0) return;
      const t = cell.teacher.trim().toUpperCase();
      if (!tm[t]) tm[t] = [];
      tm[t].push({ci,mw:cell.mergedWith||[], cell});
    });
    Object.values(tm).forEach(entries => {
      if (entries.length < 2) return;
      for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i], b = entries[j];
        if (!a.mw.includes(b.ci) && !b.mw.includes(a.ci) && !a.cell.ignoreConflict && !b.cell.ignoreConflict) {
          c.add(`${row.id}|${a.ci}`);
          c.add(`${row.id}|${b.ci}`);
        }
      }
    });
  });
  return c;
}

export function buildDefaultGrid(groups) {
  const times = ["9:15-10:45","10:45-12:15","12:15-1:15","1:15-2:45","2:45-4:15"];
  const rows = [];
  PRESET_DAYS.slice(0,5).forEach(day => {
    times.forEach(time => {
      const isRecess = time === "12:15-1:15";
      rows.push({id:uid(),day,time,isRecess,cells:groups.map(() => isRecess ? makeCell({subject:"R"}) : makeCell())});
    });
  });
  return rows;
}

export function buildBBSBECGrid(groups) {
  const sc = ["C++","WEB","OFFICE AUTOMATION"];
  const tc = {"C++":["JLK","SK","GPK"],WEB:["APK","MJK","KJK"],"OFFICE AUTOMATION":["JLK","SK","GPK"]};
  const times = ["9:15-10:45","10:45-12:15","12:15-1:15","1:15-2:45","2:45-4:15"];
  const rows = [];
  PRESET_DAYS.slice(0,5).forEach(day => {
    times.forEach((time, ti) => {
      const isRecess = time === "12:15-1:15";
      rows.push({
        id:uid(),
        day,
        time,
        isRecess,
        cells:groups.map((g, gi) =>
          isRecess
            ? makeCell({subject:"R"})
            : makeCell({
                subject: sc[(PRESET_DAYS.slice(0,5).indexOf(day) * 2 + (ti > 2 ? ti - 1 : ti) + gi) % 3],
                teacher: (tc[sc[(PRESET_DAYS.slice(0,5).indexOf(day) * 2 + (ti > 2 ? ti - 1 : ti) + gi) % 3]] || [])[gi] || ""
              })
        )
      });
    });
  });
  return rows;
}
