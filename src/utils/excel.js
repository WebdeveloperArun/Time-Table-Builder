import * as XLSX from "xlsx";

export function exportToExcel(header, rows, groups, msg) {
  const d = [];

  d.push([header.title]);
  if (header.college) d.push([header.college]);
  if (header.dept) d.push([header.dept]);
  if (header.duration) d.push([header.duration]);
  if (header.week) d.push([header.week]);
  d.push([]);

  const headerRowIdx = d.length;
  const h = ["Day","Time"];
  groups.forEach(g => { h.push(`${g.lab} (${g.group})`); h.push("Teacher"); });
  d.push(h);

  const merges = [];
  let currentRowIdx = headerRowIdx + 1;

  merges.push({s: {r:0, c:0}, e: {r:0, c: h.length - 1}});

  const dayStart = {};
  const daySpans = {};

  rows.forEach((r) => {
    const rowData = [r.day, r.time];

    if (dayStart[r.day] === undefined) {
      dayStart[r.day] = currentRowIdx;
      daySpans[r.day] = 1;
    } else {
      daySpans[r.day]++;
    }

    if (r.isRecess) {
      rowData.push("RECESS / BREAK");
      for (let i = 0; i < groups.length * 2 - 1; i++) rowData.push("");
      merges.push({s: {r: currentRowIdx, c: 2}, e: {r: currentRowIdx, c: 2 + groups.length * 2 - 1}});
    } else {
      const skipCols = new Set();
      r.cells.forEach((c, ci) => {
        if (skipCols.has(ci)) {
          rowData.push("");
          rowData.push("");
          return;
        }

        if (c.mode === "free") {
          rowData.push("FREE");
          rowData.push("");
        } else {
          rowData.push(c.subject || "");
          rowData.push(c.teacher || "");
        }

        if (c.mergedWith && c.mergedWith.length > 0) {
          const allMergedIndices = [ci, ...c.mergedWith].sort((a, b) => a - b);
          const minC = allMergedIndices[0];
          const maxC = allMergedIndices[allMergedIndices.length - 1];

          if (minC === ci) {
            merges.push({
              s: {r: currentRowIdx, c: 2 + minC * 2},
              e: {r: currentRowIdx, c: 2 + maxC * 2 + 1}
            });
            c.mergedWith.forEach(mi => skipCols.add(mi));
          }
        }
      });
    }

    d.push(rowData);
    currentRowIdx++;
  });

  Object.keys(dayStart).forEach(day => {
    if (daySpans[day] > 1) {
      merges.push({
        s: {r: dayStart[day], c: 0},
        e: {r: dayStart[day] + daySpans[day] - 1, c: 0}
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(d);
  ws["!merges"] = merges;
  ws["!cols"] = [{wch: 12}, {wch: 15}, ...groups.flatMap(() => [{wch: 22}, {wch: 12}])];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timetable");
  XLSX.writeFile(wb, `${(header.title || "timetable").replace(/\s+/g, "_")}.xlsx`);
  msg("Excel downloaded with formatting!");
}
