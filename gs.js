/* Cầu nối chung: mọi trang con gọi Apps Script qua đây */
(function () {
  var CFG = function () { try { return JSON.parse(localStorage.getItem('hub_cfg') || '{}'); } catch (e) { return {}; } };
  var HUB = window.HUB = { cfg: CFG };

  HUB.post = async function (body) {
    var c = CFG();
    if (!c.url) throw new Error('Chưa cài link Apps Script (về Menu, bấm ⚙)');
    body.key = body.app === 'kho' ? (c.kho || '') : body.app === 'chi' ? (c.chi || '') : '';
    var r = await fetch(c.url, { method: 'POST', body: JSON.stringify(body) });
    var j = await r.json();
    if (j.err) throw new Error(j.err);
    return j.data;
  };

  /* Giả lập google.script.run để trang Tính công và Thu chi chạy nguyên code cũ */
  HUB.run = function (app) {
    function mk(ok, fail) {
      return new Proxy({}, {
        get: function (_, k) {
          if (k === 'withSuccessHandler') return function (f) { return mk(f, fail); };
          if (k === 'withFailureHandler') return function (f) { return mk(ok, f); };
          return function () {
            var args = Array.prototype.slice.call(arguments);
            HUB.post({ app: app, fn: k, args: args })
              .then(function (d) { if (ok) ok(d); })
              .catch(function (e) { if (fail) fail(e); });
          };
        }
      });
    }
    return mk();
  };
})();
