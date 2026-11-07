/**
 * AEK CK & HRV Monitor - zadnji deo (Google Apps Script + Google Sheet)
 *
 * Potpuno odvojen od Player Hub-a: svoja tabela, svoj skript, svoj web app URL.
 *
 * Prvi put:
 *   1. Napravi praznu Google tabelu, iz adrese prepisi ID (deo izmedju /d/ i /edit) u SHEET_ID dole.
 *   2. U editoru pokreni funkciju setup(). Ona pravi listove i dva PIN-a (tvoj i saradnikov).
 *   3. Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.
 *   4. Kopiraj URL web app-a u config.js u repou aek-ck, pa push.
 *
 * Posle svake izmene ovog fajla: Deploy > Manage deployments > olovka > New version > Deploy
 * (URL ostaje isti).
 *
 * Verzija 1.0 (07.11.2026)
 */

var VERSION = "1.0";
var SHEET_ID = "";   // prazno = skript je vezan za tabelu (Extensions > Apps Script)

var SHEETS = {
  Staff: ["pin", "name", "active"],
  Days:  ["coll", "date", "json", "ts"],   // coll je "ck" ili "hrv", json su vrednosti svih igraca za taj dan
  Base:  ["pid", "json", "ts"],
  Squad: ["pid", "num", "name", "pos", "active", "ts"],
  Cfg:   ["key", "json", "ts"]
};

function book() { return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet(); }
function say(msg) { Logger.log(msg); try { SpreadsheetApp.getUi().alert(msg); } catch (e) {} }

/* ------------------------------------------------------------------ setup */

function setup() {
  var ss = book();
  try { ss.setSpreadsheetTimeZone("Europe/Athens"); } catch (e) {}
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(SHEETS[name]);
      sh.getRange(1, 1, 1, SHEETS[name].length).setFontWeight("bold");
      sh.setFrozenRows(1);
    }
    if (name === "Staff") sh.getRange("A:A").setNumberFormat("@");
    if (name === "Days") sh.getRange("B:B").setNumberFormat("@");
  });
  var st = ss.getSheetByName("Staff");
  var made = "";
  if (st.getLastRow() === 1) {
    var a = newPin(), b = newPin();
    st.appendRow([a, "Goran", 1]);
    st.appendRow([b, "Saradnik", 1]);
    made = "\n\nPIN-ovi (promeni imena u listu Staff kako treba):\nGoran: " + a + "\nSaradnik: " + b;
  }
  var first = ss.getSheets()[0];
  if (first.getName() !== "Staff" && first.getLastRow() === 0) ss.deleteSheet(first);
  say("AEK CK & HRV: listovi su spremni. Sledece je Deploy > New deployment > Web app." + made);
}

/* Web app je dostupan svakome ko zna URL, pa je PIN jedina brava: sest znakova,
   bez slova i cifara koje se mesaju (0/O, 1/I/l). Menjaj ih u listu Staff kad god hoces. */
function newPin() {
  var abc = "ACDEFGHJKLMNPQRTUVWXY34679";
  var s = "";
  for (var i = 0; i < 6; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
  return s;
}

/* ------------------------------------------------------------------ http */

function doGet(e) {
  return out({ ok: true, service: "aek-ck-hrv", version: VERSION, time: new Date().toISOString() });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    var body = {};
    try { body = JSON.parse(e.postData.contents || "{}"); } catch (err) { return out({ ok: false, error: "bad_json" }); }
    var who = whoIs(body.key);
    if (!who) return out({ ok: false, error: "pin" });
    var a = body.action;
    if (a === "auth") return out({ ok: true, name: who.name, version: VERSION });
    if (a === "pull") return out(pull(body));
    if (a === "push") return out(push(who, body));
    return out({ ok: false, error: "unknown_action" });
  } catch (err) {
    return out({ ok: false, error: String((err && err.message) || err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ helpers */

function sheet(name) {
  var ss = book();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(SHEETS[name]);
    sh.getRange(1, 1, 1, SHEETS[name].length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows(name) {
  var sh = sheet(name);
  var n = sh.getLastRow();
  if (n < 2) return [];
  var head = SHEETS[name];
  return sh.getRange(2, 1, n - 1, head.length).getValues().map(function (r, i) {
    var o = { _row: i + 2 };
    head.forEach(function (h, j) { o[h] = r[j]; });
    return o;
  });
}

function cellDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "Europe/Athens", "yyyy-MM-dd");
  return String(v || "").slice(0, 10);
}

function jsonOr(v, dflt) {
  if (!v) return dflt;
  try { return JSON.parse(v); } catch (e) { return dflt; }
}

function whoIs(key) {
  var k = String(key == null ? "" : key).trim();
  if (!k) return null;
  var r = rows("Staff").filter(function (x) {
    return String(x.pin).trim() === k && String(x.active) !== "0" && x.active !== false;
  })[0];
  return r ? { pin: k, name: String(r.name || "staff") } : null;
}

/* ------------------------------------------------------------------ pull */

/* Sve sto se promenilo od proslog poziva. App salje prethodni "now" umanjen za sekundu-dve,
   pa je preklapanje bezopasno: isti red upisan dvaput ne menja nista, propusten bi. */
function pull(body) {
  var since = Number(body.since) || 0;
  var fresh = function (r) { return (Number(r.ts) || 0) >= since; };
  var days = rows("Days").filter(fresh).map(function (r) {
    return { coll: String(r.coll), date: cellDate(r.date), v: jsonOr(r.json, {}), ts: Number(r.ts) || 0 };
  });
  var base = rows("Base").filter(fresh).map(function (r) {
    var b = jsonOr(r.json, {});
    return { pid: String(r.pid), s: b.s || [], manual: b.manual == null ? null : b.manual, ts: Number(r.ts) || 0, by: b.by || "" };
  });
  var squad = rows("Squad").filter(fresh).map(function (r) {
    return { id: String(r.pid), num: String(r.num == null ? "" : r.num), name: String(r.name || ""),
             pos: String(r.pos || "MID"), active: String(r.active) !== "0" && r.active !== false, ts: Number(r.ts) || 0 };
  });
  var cfgRow = rows("Cfg").filter(function (r) { return String(r.key) === "app"; })[0];
  var cfg = (cfgRow && fresh(cfgRow)) ? jsonOr(cfgRow.json, null) : null;
  return { ok: true, now: Date.now(), days: days, base: base, squad: squad, cfg: cfg };
}

/* ------------------------------------------------------------------ push */

/* Sadrzaj jedne vrednosti bez "by" i bez "ts": sluzi da se prepozna ponovo poslata ista vrednost. */
function valKey(v) {
  if (!v) return "";
  return [v.del ? 1 : 0, v.val == null ? "" : v.val, v.act || "", v.rmssd == null ? "" : v.rmssd,
          v.hr == null ? "" : v.hr, v.pos || "", v.note || ""].join("|");
}

/* Spajanje po igracu, ne po danu: dvoje mogu da kucaju isti dan u isto vreme.
   Unutar jednog dana pobedjuje noviji ts tog igraca. */
function push(who, body) {
  var now = Date.now();
  var nDays = 0, nBase = 0, nSquad = 0;

  (body.days || []).forEach(function (d) {
    var coll = String(d.coll), date = String(d.date), inc = d.v || {};
    var sh = sheet("Days");
    var found = rows("Days").filter(function (r) { return String(r.coll) === coll && cellDate(r.date) === date; })[0];
    var cur = found ? jsonOr(found.json, {}) : {};
    Object.keys(inc).forEach(function (pid) {
      var a = inc[pid];
      if (!a || typeof a !== "object") return;
      var b = cur[pid];
      if (b && (Number(b.ts) || 0) > (Number(a.ts) || 0)) return;
      /* Isti sadrzaj ponovo poslat nije izmena: ostaje ko je prvi uneo. */
      if (b && valKey(b) === valKey(a)) return;
      a.by = who.name;
      cur[pid] = a;
    });
    var line = [coll, date, JSON.stringify(cur), now];
    if (found) sh.getRange(found._row, 1, 1, SHEETS.Days.length).setValues([line]);
    else sh.appendRow(line);
    nDays++;
  });

  (body.base || []).forEach(function (b) {
    var sh = sheet("Base");
    var pid = String(b.pid);
    var found = rows("Base").filter(function (r) { return String(r.pid) === pid; })[0];
    var cur = found ? jsonOr(found.json, {}) : {};
    if (cur && (Number(cur.ts) || 0) > (Number(b.ts) || 0)) return;
    var line = [pid, JSON.stringify({ s: b.s || [], manual: b.manual == null ? null : b.manual, ts: Number(b.ts) || now, by: who.name }), now];
    if (found) sh.getRange(found._row, 1, 1, SHEETS.Base.length).setValues([line]);
    else sh.appendRow(line);
    nBase++;
  });

  (body.squad || []).forEach(function (p) {
    var sh = sheet("Squad");
    var pid = String(p.id);
    var found = rows("Squad").filter(function (r) { return String(r.pid) === pid; })[0];
    if (found && (Number(found.ts) || 0) > (Number(p.ts) || 0)) return;
    var line = [pid, String(p.num == null ? "" : p.num), String(p.name || ""), String(p.pos || "MID"), p.active === false ? 0 : 1, Number(p.ts) || now];
    if (found) sh.getRange(found._row, 1, 1, SHEETS.Squad.length).setValues([line]);
    else sh.appendRow(line);
    nSquad++;
  });

  if (body.cfg) {
    var sh = sheet("Cfg");
    var found = rows("Cfg").filter(function (r) { return String(r.key) === "app"; })[0];
    var line = ["app", JSON.stringify(body.cfg), now];
    if (found) sh.getRange(found._row, 1, 1, SHEETS.Cfg.length).setValues([line]);
    else sh.appendRow(line);
  }

  return { ok: true, now: now, days: nDays, base: nBase, squad: nSquad, by: who.name };
}
