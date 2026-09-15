// ==UserScript==
// @name         dataLayer QA Overlay (通用版)
// @namespace    qa.tracker
// @version      3.3
// @description  通用 dataLayer 埋点 QA 工具：实时抓取埋点、预期名单覆盖率校验、Web / H5 适配、面板可收起为拖动图标。
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
(function () {
  'use strict';
  var N = '__qa_ov', L = N + '_log', P = N + '_pos', IP = N + '_icon', MIN = N + '_min',
      I = N + '_imported', S = N + '_sites', M = 400, MQ = 768;

  function g(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function s(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function isMobile() { return window.innerWidth <= MQ; }
  function pt(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  var h = window.location.host, cs = g(S) || {}, ck = null;
  for (var k in cs) { if (h.indexOf(k) !== -1 || k === h) { ck = k; break; } }
  var expected = ck ? (g(I + '_' + ck) || []) : [];
  var lg = ck ? (g(L + '_' + ck) || []) : [];
  var rd = 0, p, fab, pl, cn, badge, sel = -1, expanded = false;

  function inExpected(name) { return expected.indexOf(name) !== -1; }

  function uc() {
    if (!cn) return;
    var total = expected.length;
    if (total > 0) {
      var seen = {};
      lg.forEach(function (o) {
        if (o && o.event && inExpected(o.event)) seen[o.event] = 1;
      });
      var d = Object.keys(seen).length;
      cn.textContent = lg.length + ' 条 · 覆盖 ' + d + '/' + total + ' ' + Math.round(d / total * 100) + '%';
    } else {
      cn.textContent = lg.length + ' 条';
    }
    if (badge) {
      if (lg.length) {
        badge.style.display = 'flex';
        badge.textContent = lg.length > 99 ? '99+' : String(lg.length);
      } else {
        badge.style.display = 'none';
      }
    }
  }

  function highlightSel() {
    var list = p && p.querySelector('#qe');
    if (!list) return;
    var items = list.querySelectorAll('.q-item');
    for (var i = 0; i < items.length; i++) {
      var on = i === sel;
      items[i].style.background = on ? '#1a2332' : 'transparent';
      items[i].style.borderColor = on ? '#3b82f6' : 'transparent';
    }
  }

  function showDetail(idx) {
    if (!pl) return;
    sel = idx;
    highlightSel();
    if (idx < 0 || idx >= lg.length) {
      pl.innerHTML = '<div style="color:#555;padding:16px;font-size:12px">暂无埋点</div>';
      return;
    }
    var o = lg[lg.length - 1 - idx];
    pl.innerHTML = '';
    var pre = document.createElement('pre');
    pre.style.cssText = 'margin:0;padding:12px 14px;font:13px/1.55 Consolas,Monaco,monospace;color:#e7e9ef;white-space:pre-wrap;word-break:break-word';
    pre.textContent = JSON.stringify(o, null, 2);
    pl.appendChild(pre);
  }

  function rebuildList() {
    var ls = p && p.querySelector('#qe');
    if (!ls) return;
    ls.innerHTML = '';
    for (var i = lg.length - 1; i >= 0; i--) {
      var o = lg[i];
      var name = (o && o.event) || '(no event)';
      var el = document.createElement('div');
      el.className = 'q-item';
      el.textContent = name;
      el.title = name;
      el.style.cssText = 'padding:6px 8px;font-size:12px;border-radius:4px;margin:1px 0;cursor:pointer;border:1px solid transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:' + (inExpected(name) ? '#34d399' : '#98a1b2');
      el.onclick = (function (displayIdx) {
        return function () { showDetail(displayIdx); };
      })(lg.length - 1 - i);
      ls.appendChild(el);
    }
    highlightSel();
    uc();
  }

  function rl() {
    rebuildList();
    if (lg.length) showDetail(sel >= 0 && sel < lg.length ? sel : 0);
    else showDetail(-1);
  }

  function pushRow() {
    if (!rd) return;
    var ls = p && p.querySelector('#qe');
    var scrollTop = ls ? ls.scrollTop : 0;
    var following = sel <= 0;
    if (following) sel = 0;
    else sel += 1;
    rebuildList();
    if (following) {
      showDetail(0);
      if (ls) ls.scrollTop = 0;
    } else if (ls) {
      var first = ls.querySelector('.q-item');
      ls.scrollTop = scrollTop + (first ? first.offsetHeight + 2 : 0);
    }
  }

  function rc(o) {
    var name = o && o.event;
    if (!name || String(name).indexOf('gtm') === 0) return;
    lg.push(o);
    if (lg.length > M) lg = lg.slice(-M);
    s(L + '_' + (ck || 'default'), lg);
    if (rd) pushRow();
    else uc();
  }

  (function hookDL() {
    var dl = window.dataLayer;
    if (dl && Array.isArray(dl)) {
      var orig = dl.push.bind(dl);
      dl.push = function () {
        for (var i = 0; i < arguments.length; i++) {
          try { rc(arguments[i]); } catch (e) {}
        }
        return orig.apply(dl, arguments);
      };
      dl.slice().forEach(rc);
    } else {
      window.dataLayer = [];
      var ndl = window.dataLayer;
      ndl.push = function () {
        for (var i = 0; i < arguments.length; i++) {
          try { rc(arguments[i]); } catch (e) {}
        }
        Array.prototype.push.apply(ndl, arguments);
      };
    }
  })();

  function im(t) {
    var ls = [];
    try {
      var parsed = JSON.parse(t);
      if (Array.isArray(parsed)) ls = parsed.map(String);
    } catch (e) {
      ls = t.split(/[,\n\r\s]+/).filter(function (x) { return x; });
    }
    if (!ls.length) return 0;
    var ex = {};
    expected.forEach(function (e) { ex[e] = 1; });
    var ns = ls.filter(function (e) { return !ex[e]; });
    if (!ns.length) return 0;
    expected = expected.concat(ns);
    if (ck) s(I + '_' + ck, expected);
    if (rd) rl();
    return ns.length;
  }

  function modalShell(html) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2147483647;display:flex;align-items:center;justify-content:center;font:12px/1.5 monospace;padding:12px;box-sizing:border-box';
    ov.innerHTML = html;
    document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    return ov;
  }

  function shI() {
    var ov = modalShell('<div style="background:#0f1115;border:1px solid #2a2f3a;border-radius:10px;padding:16px;width:480px;max-width:100%;color:#e7e9ef;max-height:90vh;overflow:auto;box-sizing:border-box"><div style="font-weight:700;font-size:14px;margin-bottom:10px;color:#f43f6e">📥 导入埋点</div><div style="color:#8b93a3;margin-bottom:8px">JSON 数组或逗号/换行分隔（用于名单内高亮）：</div><textarea id="qi" style="width:100%;height:140px;background:#171a21;color:#e7e9ef;border:1px solid #2a2f3a;border-radius:6px;padding:8px;font:11px monospace;resize:vertical;outline:none;box-sizing:border-box"></textarea><div id="qs" style="color:#8b93a3;margin-top:6px;min-height:18px"></div><div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end"><button id="qb" style="background:#f43f6e;color:#fff;border:none;border-radius:6px;padding:6px 16px;cursor:pointer;font-weight:600">导入</button><button id="qc" style="background:#232833;color:#e7e9ef;border:1px solid #2a2f3a;border-radius:6px;padding:6px 16px;cursor:pointer">取消</button></div></div>');
    var inp = ov.querySelector('#qi'), st = ov.querySelector('#qs');
    if (expected.length) inp.value = JSON.stringify(expected, null, 2);
    ov.querySelector('#qb').onclick = function () {
      var t = inp.value.trim();
      if (!t) { st.textContent = '⚠️ 输入内容'; return; }
      var n = im(t);
      st.textContent = n > 0 ? '✅ 导入 ' + n + ' 个' : '⚠️ 无新埋点';
      if (n > 0) setTimeout(function () { ov.remove(); }, 800);
    };
    ov.querySelector('#qc').onclick = function () { ov.remove(); };
  }

  function shS() {
    var ov = modalShell('<div style="background:#0f1115;border:1px solid #2a2f3a;border-radius:10px;padding:16px;width:500px;max-width:100%;color:#e7e9ef;max-height:90vh;overflow:auto;box-sizing:border-box"><div style="font-weight:700;font-size:14px;margin-bottom:12px;color:#f43f6e">🌐 网站配置</div><div style="color:#8b93a3;margin-bottom:6px">当前：<b style="color:#e7e9ef">' + h + '</b></div><input id="qsi" style="width:100%;padding:6px 8px;background:#171a21;color:#e7e9ef;border:1px solid #2a2f3a;border-radius:6px;font:11px monospace;outline:none;box-sizing:border-box;margin-bottom:10px" placeholder="域名" value="' + (ck || h) + '"><div style="color:#8b93a3;margin-bottom:6px">已保存：</div><div id="qsl" style="margin-bottom:10px;max-height:120px;overflow-y:auto"></div><div id="qss" style="color:#8b93a3;min-height:18px;margin-bottom:6px"></div><div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end"><button id="qsb" style="background:#f43f6e;color:#fff;border:none;border-radius:6px;padding:6px 16px;cursor:pointer;font-weight:600">保存</button><button id="qsc" style="background:#232833;color:#e7e9ef;border:1px solid #2a2f3a;border-radius:6px;padding:6px 16px;cursor:pointer">取消</button></div></div>');
    var inp = ov.querySelector('#qsi'), sl = ov.querySelector('#qsl'), st = ov.querySelector('#qss');
    function rs() {
      var ks = Object.keys(cs);
      if (!ks.length) { sl.innerHTML = '<div style="color:#555">无配置</div>'; return; }
      sl.innerHTML = ks.map(function (k) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 0;border-bottom:1px solid #1a1d24"><span style="color:' + (k === ck ? '#34d399' : '#8b93a3') + '">' + k + '</span><button class="qsd" data-k="' + k + '" style="background:transparent;color:#e74c3c;border:none;cursor:pointer;font-size:11px">删</button></div>';
      }).join('');
      sl.querySelectorAll('.qsd').forEach(function (b) {
        b.onclick = function () {
          var key = b.getAttribute('data-k');
          delete cs[key];
          s(S, cs);
          if (ck === key) { ck = null; expected = []; lg = []; sel = -1; }
          localStorage.removeItem(I + '_' + key);
          localStorage.removeItem(L + '_' + key);
          rs();
          st.textContent = '✅ 已删除';
          if (rd) rl();
        };
      });
    }
    rs();
    ov.querySelector('#qsb').onclick = function () {
      var key = inp.value.trim();
      if (!key) { st.textContent = '⚠️ 输入域名'; return; }
      cs[key] = { name: key };
      s(S, cs);
      st.textContent = '✅ 已保存，刷新后生效';
      rs();
    };
    ov.querySelector('#qsc').onclick = function () { ov.remove(); };
  }

  function applyPanelLayout() {
    if (!p) return;
    var ep = p.querySelector('#qe');
    var dv = p.querySelector('#qd');
    var body = p.querySelector('#qbody');
    var host = p.querySelector('#qhost');
    if (isMobile()) {
      p.style.cssText = 'position:fixed;left:0;right:0;bottom:0;top:auto;width:100%;max-width:100%;height:58vh;max-height:70vh;display:flex;flex-direction:column;background:#0f1115;color:#e7e9ef;font:12px/1.5 monospace;border:1px solid #2a2f3a;border-bottom:none;border-radius:12px 12px 0 0;z-index:2147483646;box-shadow:0 -8px 32px rgba(0,0,0,.45);overflow:hidden';
      if (body) body.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden';
      if (ep) ep.style.cssText = 'width:100%;min-width:0;max-height:38%;overflow-y:auto;padding:4px;border-right:none;border-bottom:1px solid #2a2f3a;flex-shrink:0;box-sizing:border-box';
      if (dv) dv.style.display = 'none';
      if (host) host.style.display = 'none';
    } else {
      p.style.cssText = 'position:fixed;top:12px;right:12px;width:800px;max-width:90vw;height:500px;max-height:88vh;display:flex;flex-direction:column;background:#0f1115;color:#e7e9ef;font:12px/1.5 monospace;border:1px solid #2a2f3a;border-radius:10px;z-index:2147483646;box-shadow:0 12px 44px rgba(0,0,0,.55);overflow:hidden';
      var pos = g(P);
      if (pos && typeof pos.left === 'number' && typeof pos.top === 'number') {
        p.style.left = clamp(pos.left, 0, window.innerWidth - 80) + 'px';
        p.style.top = clamp(pos.top, 0, window.innerHeight - 40) + 'px';
        p.style.right = 'auto';
      }
      if (body) body.style.cssText = 'display:flex;flex-direction:row;flex:1;min-height:0;overflow:hidden';
      if (ep) ep.style.cssText = 'width:240px;min-width:120px;max-height:none;overflow-y:auto;padding:6px 4px;border-right:1px solid #2a2f3a;border-bottom:none;flex-shrink:0;box-sizing:border-box';
      if (dv) dv.style.cssText = 'width:4px;cursor:col-resize;background:#2a2f3a;flex-shrink:0;display:block';
      if (host) host.style.display = '';
    }
  }

  function minimize() {
    expanded = false;
    s(MIN, true);
    if (p) p.style.display = 'none';
    if (fab) fab.style.display = 'flex';
  }

  function expand() {
    expanded = true;
    s(MIN, false);
    if (p) {
      applyPanelLayout();
      p.style.display = 'flex';
    }
    if (fab) fab.style.display = 'none';
  }

  function bindFabDrag() {
    var dragging = false, moved = false, sx, sy, ol, ot, threshold = 6;

    function start(e) {
      var q = pt(e);
      dragging = true;
      moved = false;
      sx = q.x; sy = q.y;
      var r = fab.getBoundingClientRect();
      ol = r.left; ot = r.top;
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
      e.preventDefault();
    }
    function move(e) {
      if (!dragging) return;
      var q = pt(e);
      var dx = q.x - sx, dy = q.y - sy;
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) moved = true;
      if (!moved) return;
      fab.style.left = clamp(ol + dx, 0, window.innerWidth - 52) + 'px';
      fab.style.top = clamp(ot + dy, 0, window.innerHeight - 52) + 'px';
      e.preventDefault();
    }
    function end() {
      if (!dragging) return;
      dragging = false;
      if (moved) {
        s(IP, { left: Math.round(fab.offsetLeft), top: Math.round(fab.offsetTop) });
      } else {
        expand();
      }
    }

    fab.addEventListener('pointerdown', start);
    fab.addEventListener('pointermove', move);
    fab.addEventListener('pointerup', end);
    fab.addEventListener('pointercancel', end);
    fab.addEventListener('touchstart', start, { passive: false });
    fab.addEventListener('touchmove', move, { passive: false });
    fab.addEventListener('touchend', end);
  }

  function bindPanelDrag() {
    var H = p.querySelector('#qh');
    var dragging = false, moved = false, sx, sy, ol, ot, threshold = 6;

    function start(e) {
      if (isMobile() || e.target.tagName === 'BUTTON') return;
      var r = p.getBoundingClientRect();
      var q = pt(e);
      dragging = true;
      moved = false;
      sx = q.x; sy = q.y; ol = r.left; ot = r.top;
      p.style.right = 'auto';
      p.style.bottom = 'auto';
      e.preventDefault();
    }
    function move(e) {
      if (!dragging || isMobile()) return;
      var q = pt(e);
      var dx = q.x - sx, dy = q.y - sy;
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) moved = true;
      p.style.left = clamp(ol + dx, 0, window.innerWidth - 80) + 'px';
      p.style.top = clamp(ot + dy, 0, window.innerHeight - 40) + 'px';
      e.preventDefault();
    }
    function end() {
      if (!dragging) return;
      dragging = false;
      if (moved && !isMobile()) s(P, { left: Math.round(p.offsetLeft), top: Math.round(p.offsetTop) });
    }

    H.addEventListener('pointerdown', start);
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', end);
    H.addEventListener('touchstart', start, { passive: false });
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
  }

  function bld() {
    if (p) return;

    // 悬浮 icon
    fab = document.createElement('div');
    fab.id = 'qa-fab';
    fab.title = '打开埋点 QA';
    fab.style.cssText = 'position:fixed;width:52px;height:52px;border-radius:50%;background:#f43f6e;color:#fff;display:none;align-items:center;justify-content:center;font-size:22px;z-index:2147483647;box-shadow:0 6px 20px rgba(244,63,110,.45);cursor:grab;user-select:none;touch-action:none;-webkit-tap-highlight-color:transparent';
    fab.textContent = '📊';
    badge = document.createElement('span');
    badge.style.cssText = 'position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#111;border:1px solid #fff;color:#fff;font:10px/18px monospace;display:none;align-items:center;justify-content:center;box-sizing:border-box';
    fab.appendChild(badge);
    var ip = g(IP);
    if (ip && typeof ip.left === 'number' && typeof ip.top === 'number') {
      fab.style.left = clamp(ip.left, 0, window.innerWidth - 52) + 'px';
      fab.style.top = clamp(ip.top, 0, window.innerHeight - 52) + 'px';
    } else {
      fab.style.right = '16px';
      fab.style.bottom = isMobile() ? '24px' : '16px';
    }
    document.body.appendChild(fab);
    bindFabDrag();

    // 面板
    p = document.createElement('div');
    p.id = 'qa-panel';
    p.innerHTML =
      '<div id="qh" style="display:flex;align-items:center;gap:6px;padding:8px 10px;background:#171a21;border-bottom:1px solid #2a2f3a;cursor:move;user-select:none;flex-shrink:0;touch-action:none">' +
        '<b style="color:#f43f6e;flex-shrink:0">📊 埋点 QA</b>' +
        '<span id="qn" style="color:#98a1b2;font-size:11px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>' +
        '<span id="qhost" style="color:#555;font-size:10px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + h + '</span>' +
        '<button id="qsbtn" style="margin-left:auto;background:#232833;color:#e7e9ef;border:1px solid #2a2f3a;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;flex-shrink:0" title="网站配置">🌐</button>' +
        '<button id="qibtn" style="background:#232833;color:#e7e9ef;border:1px solid #2a2f3a;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;flex-shrink:0" title="导入">📥</button>' +
        '<button id="qrbtn" style="background:#232833;color:#e7e9ef;border:1px solid #2a2f3a;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;flex-shrink:0" title="清空">reset</button>' +
        '<button id="qmbtn" style="background:#232833;color:#e7e9ef;border:1px solid #2a2f3a;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;flex-shrink:0" title="收起为图标">—</button>' +
      '</div>' +
      '<div id="qbody" style="display:flex;flex:1;min-height:0;overflow:hidden">' +
        '<div id="qe" style="width:240px;min-width:120px;overflow-y:auto;padding:6px 4px;border-right:1px solid #2a2f3a;flex-shrink:0;box-sizing:border-box"></div>' +
        '<div id="qd" style="width:4px;cursor:col-resize;background:#2a2f3a;flex-shrink:0"></div>' +
        '<div id="ql" style="flex:1;overflow-y:auto;min-width:0;background:#0c0e12"></div>' +
      '</div>';
    document.body.appendChild(p);
    pl = p.querySelector('#ql');
    cn = p.querySelector('#qn');

    var ep = p.querySelector('#qe'), dv = p.querySelector('#qd'), dg = 0;
    dv.addEventListener('pointerdown', function (e) {
      if (isMobile()) return;
      dg = 1;
      dv.style.background = '#f43f6e';
      e.preventDefault();
    });
    document.addEventListener('pointermove', function (e) {
      if (!dg || isMobile()) return;
      var r = p.getBoundingClientRect();
      ep.style.width = Math.max(120, Math.min(e.clientX - r.left - 4, r.width - 160)) + 'px';
    });
    document.addEventListener('pointerup', function () {
      if (!dg) return;
      dg = 0;
      dv.style.background = '#2a2f3a';
    });

    bindPanelDrag();

    p.querySelector('#qibtn').onclick = shI;
    p.querySelector('#qsbtn').onclick = shS;
    p.querySelector('#qrbtn').onclick = function () {
      lg = [];
      sel = -1;
      s(L + '_' + (ck || 'default'), lg);
      rl();
    };
    p.querySelector('#qmbtn').onclick = function (e) {
      e.stopPropagation();
      minimize();
    };

    window.addEventListener('resize', function () {
      if (expanded) applyPanelLayout();
      if (fab && fab.style.display !== 'none') {
        var r = fab.getBoundingClientRect();
        fab.style.left = clamp(r.left, 0, window.innerWidth - 52) + 'px';
        fab.style.top = clamp(r.top, 0, window.innerHeight - 52) + 'px';
        fab.style.right = 'auto';
        fab.style.bottom = 'auto';
      }
    });

    rd = 1;
    sel = lg.length ? 0 : -1;
    rl();
    window.__qa_overlay = p;

    // H5 默认收起，避免遮挡页面；Web 记住上次收起状态，默认展开
    var savedMin = g(MIN);
    if (isMobile()) {
      if (savedMin === false) expand();
      else minimize();
    } else {
      if (savedMin) minimize();
      else expand();
    }
  }

  if (document.body) bld();
  else document.addEventListener('DOMContentLoaded', bld, { once: true });
})();
