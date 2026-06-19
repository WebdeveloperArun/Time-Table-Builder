export const SUBJ_PALETTE = {
  "C++":"#3b82f6","WEB":"#8b5cf6","OFFICE AUTOMATION":"#14b8a6","PYTHON":"#f59e0b",
  "DBMS":"#ef4444","OS":"#ec4899","AI/ML":"#06b6d4","MATH":"#22c55e","CHEM":"#a78bfa",
  "ENG":"#fb923c","PHYSICS":"#34d399","PPS":"#818cf8","PDP":"#f472b6","MP":"#4ade80",
};

export function subjBg(s) {
  const c = SUBJ_PALETTE[s?.toUpperCase?.()?.trim?.()];
  return c ? `${c}22` : "transparent";
}

export function subjBd(s, T) {
  const c = SUBJ_PALETTE[s?.toUpperCase?.()?.trim?.()];
  return c ? `${c}55` : T.border;
}

export const PRESET_DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
export const DAY_FULL = {MON:"MONDAY",TUE:"TUESDAY",WED:"WEDNESDAY",THU:"THURSDAY",FRI:"FRIDAY",SAT:"SATURDAY",SUN:"SUNDAY"};
export const PRESET_TIMES = ["8:00-9:00","9:00-10:00","9:15-10:45","10:00-11:00","10:45-12:15","11:00-12:00","12:00-1:00","12:15-1:15","1:00-2:00","1:15-2:45","2:00-3:00","2:45-4:15","3:00-4:00","4:00-5:00"];
export const ALL_SUBJECTS = ["C++","WEB","OFFICE AUTOMATION","PYTHON","DBMS","OS","MATH","PHYSICS","ENGLISH","LAB","LECTURE","RECESS","BREAK","DSA","NETWORKS","CLOUD","AI/ML","PDP","ENG","CHEM","PPS","MP"];

export const TEMPLATES = {
  bbsbec:{name:"Departmental Training (BBSBEC)",desc:"5-day · 3 labs · C++/WEB/Office Automation",icon:"🏛️",
    header:{title:"SUMMER INSTITUTIONAL TRAINING TIME TABLE",college:"B.B.S.B.ENGG. COLLEGE FATEHGARH SAHIB",dept:"DEPTT. OF CSE",duration:"DURATION: 3 WEEKS",week:"WEEK-1st"},
    groups:[{lab:"Lab (N 238)",group:"GROUP 4"},{lab:"Lab (N 231)",group:"GROUP 5"},{lab:"Lab (N 228)",group:"GROUP 6"}]},
  standard:{name:"Standard Academic",desc:"Two sections · Period layout",icon:"📚",
    header:{title:"CLASS TIMETABLE",college:"UNIVERSITY NAME",dept:"DEPARTMENT",duration:"SEMESTER: JAN–MAY 2026",week:"WEEK 1"},
    groups:[{lab:"Room A",group:"SECTION A"},{lab:"Room B",group:"SECTION B"}]},
  exam:{name:"Exam Schedule",desc:"Halls · Invigilator layout",icon:"📝",
    header:{title:"EXAMINATION SCHEDULE",college:"UNIVERSITY NAME",dept:"EXAMINATION BRANCH",duration:"MAY 2026",week:"BATCH 2022-26"},
    groups:[{lab:"Hall 1",group:"INVIGILATOR"},{lab:"Hall 2",group:"INVIGILATOR"}]},
};
