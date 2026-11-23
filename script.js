/* Paróquia São Crispim - interatividade e animações
   Sem bibliotecas externas e sem innerHTML: todo texto entra via textContent. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var FUSO = 'America/Sao_Paulo'; // horário de Franca-SP, não o do visitante
  var DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  var reduzMovimento = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(seletor, raiz) { return (raiz || document).querySelector(seletor); }
  function $$(seletor, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(seletor)); }

  doc.classList.add('menu-js');
  if (!reduzMovimento) doc.classList.add('scroll-js');

  /* ---------- Data e hora em Franca-SP ---------- */
  function agora() {
    try {
      var partes = new Intl.DateTimeFormat('en-US', {
        timeZone: FUSO, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      var o = {};
      partes.forEach(function (p) { o[p.type] = p.value; });
      var mapa = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { dia: mapa[o.weekday], min: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function numeros(texto) {
    return String(texto || '').split(',').map(function (n) { return parseInt(n, 10); })
      .filter(function (n) { return !isNaN(n); });
  }

  /* ---------- Destaque do dia de hoje ---------- */
  function marcarHoje() {
    var ag = agora();
    $$('.lista-horarios li[data-dias]').forEach(function (li) {
      var ehHoje = numeros(li.getAttribute('data-dias')).indexOf(ag.dia) !== -1;
      var selo = $('.badge-hoje', li);
      li.classList.toggle('hoje', ehHoje);
      if (ehHoje && !selo) {
        selo = document.createElement('span');
        selo.className = 'badge-hoje';
        selo.textContent = 'Hoje';
        li.appendChild(selo);
      } else if (!ehHoje && selo) {
        li.removeChild(selo);
      }
    });
  }

  /* ---------- Próxima missa (lê os horários que já estão na página) ---------- */
  function coletarMissas() {
    var itens = [];
    $$('.lista-horarios li[data-hora]').forEach(function (li) {
      var dias = numeros(li.getAttribute('data-dias'));
      var artigo = li.closest('article');
      var titulo = artigo ? $('h3', artigo) : null;
      var local = titulo ? titulo.textContent.trim() : '';
      var votiva = !!li.closest('.grid-votivas');
      li.getAttribute('data-hora').split(',').forEach(function (h) {
        var p = h.split(':');
        itens.push({ dias: dias, min: parseInt(p[0], 10) * 60 + parseInt(p[1], 10), hora: h, local: local, votiva: votiva });
      });
    });
    return itens;
  }

  function acharProxima(itens, ag) {
    var melhor = null;
    for (var off = 0; off <= 7; off++) {
      var dia = (ag.dia + off) % 7;
      for (var i = 0; i < itens.length; i++) {
        var it = itens[i];
        if (it.dias.indexOf(dia) === -1) continue;
        if (off === 0 && it.min <= ag.min) continue;
        var espera = off * 1440 + it.min - ag.min;
        if (!melhor || espera < melhor.espera) melhor = { it: it, off: off, dia: dia, espera: espera };
      }
    }
    return melhor;
  }

  function textoEspera(min) {
    if (min < 60) return 'começa em ' + min + ' min';
    if (min < 720) {
      var h = Math.floor(min / 60), m = min % 60;
      return 'começa em ' + h + 'h' + (m ? ' ' + (m < 10 ? '0' : '') + m + 'min' : '');
    }
    return '';
  }

  function atualizarProximaMissa(itens) {
    var caixa = $('#proxima-missa');
    if (!caixa) return;
    var prox = acharProxima(itens, agora());
    if (!prox) { caixa.hidden = true; return; }

    var quando = prox.off === 0 ? 'Hoje' : prox.off === 1 ? 'Amanhã' : DIAS[prox.dia].charAt(0).toUpperCase() + DIAS[prox.dia].slice(1);
    var linha1 = document.createElement('small');
    linha1.textContent = 'Próxima missa';
    var linha2 = document.createElement('strong');
    linha2.textContent = quando + ' às ' + prox.it.hora.replace(':', 'h');
    var linha3 = document.createElement('span');
    var detalhe = (prox.it.votiva ? 'Missa votiva · ' : '') + prox.it.local;
    var espera = prox.off === 0 ? textoEspera(prox.espera) : '';
    linha3.textContent = espera ? detalhe + ' · ' + espera : detalhe;

    while (caixa.firstChild) caixa.removeChild(caixa.firstChild);
    caixa.appendChild(linha1);
    caixa.appendChild(linha2);
    caixa.appendChild(linha3);
    caixa.hidden = false;
  }

  var missas = coletarMissas();
  marcarHoje();
  atualizarProximaMissa(missas);
  setInterval(function () { marcarHoje(); atualizarProximaMissa(missas); }, 30000);

  /* ---------- Menu no celular ---------- */
  var botaoMenu = $('#menu-btn');
  var menu = $('#menu-principal');

  function abrirMenu(abrir) {
    if (!botaoMenu || !menu) return;
    menu.classList.toggle('aberto', abrir);
    botaoMenu.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    botaoMenu.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
    botaoMenu.textContent = abrir ? '✕' : '☰';
  }

  if (botaoMenu && menu) {
    botaoMenu.addEventListener('click', function () { abrirMenu(!menu.classList.contains('aberto')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { abrirMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('aberto')) { abrirMenu(false); botaoMenu.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 600) abrirMenu(false); });
  }

  /* ---------- Rolagem: barra de progresso, sombra do cabeçalho, voltar ao topo ---------- */
  var cabecalho = $('header');
  var barra = $('#progresso');
  var topo = $('#topo');
  var esperandoQuadro = false;
  var topoHero = $('.hero');
  var versaoRolagem = 0;

  function aoRolar() {
    esperandoQuadro = false;
    versaoRolagem++;
    var y = window.pageYOffset || doc.scrollTop || 0;
    if (topoHero && !reduzMovimento && y < topoHero.offsetHeight + 200) {
      // a foto de fundo anda a 35% da velocidade da página (no máximo 11% da altura do topo)
      var par = Math.min(Math.max(y, 0) * 0.35, topoHero.offsetHeight * 0.11);
      topoHero.style.setProperty('--par', par.toFixed(1) + 'px');
    }
    var total = doc.scrollHeight - window.innerHeight;
    if (barra) barra.style.transform = 'scaleX(' + (total > 0 ? Math.min(y / total, 1) : 0) + ')';
    if (cabecalho) cabecalho.classList.toggle('rolou', y > 10);
    if (topo) {
      var mostrar = y > 500;
      topo.classList.toggle('mostrar', mostrar);
      topo.setAttribute('tabindex', mostrar ? '0' : '-1');
    }
  }

  window.addEventListener('scroll', function () {
    if (!esperandoQuadro) { esperandoQuadro = true; window.requestAnimationFrame(aoRolar); }
  }, { passive: true });
  window.addEventListener('resize', aoRolar);
  aoRolar();

  /* ---------- Rolagem animada (começa devagar, acelera e desacelera no fim) ---------- */
  var tokenRolagem = 0;

  function suavizar(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function rolarPara(destino) {
    var inicio = window.pageYOffset;
    var delta = destino - inicio;
    if (Math.abs(delta) < 2) return;
    var meu = ++tokenRolagem;
    var duracao = Math.min(Math.max(Math.abs(delta) * 0.5, 600), 1200);
    var t0 = null;
    window.requestAnimationFrame(function passo(ts) {
      if (meu !== tokenRolagem) return; // outra rolagem começou ou o visitante assumiu o controle
      if (t0 === null) t0 = ts;
      var f = Math.min((ts - t0) / duracao, 1);
      window.scrollTo(0, inicio + delta * suavizar(f));
      if (f < 1) window.requestAnimationFrame(passo);
    });
  }

  if (!reduzMovimento) {
    // se o visitante rolar por conta própria, a animação para na hora
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
      window.addEventListener(ev, function () { tokenRolagem++; }, { passive: true });
    });

    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var alvo = id ? document.getElementById(id) : null;
        if (!alvo) return;
        e.preventDefault();
        var margem = parseFloat(window.getComputedStyle(alvo).scrollMarginTop) || 0;
        rolarPara(alvo.getBoundingClientRect().top + window.pageYOffset - margem);
        if (window.history && history.replaceState) history.replaceState(null, '', '#' + id);
        alvo.setAttribute('tabindex', '-1');
        alvo.focus({ preventScroll: true });
      });
    });
  }

  if (topo) {
    topo.addEventListener('click', function () {
      if (reduzMovimento) window.scrollTo(0, 0); else rolarPara(0);
    });
  }

  /* ---------- Link do menu da seção atual ---------- */
  var links = {};
  $$('nav a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });

  if ('IntersectionObserver' in window) {
    var secoes = Object.keys(links).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var obsSecao = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (id) {
          var ativo = id === en.target.id;
          links[id].classList.toggle('ativo', ativo);
          if (ativo) links[id].setAttribute('aria-current', 'true'); else links[id].removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secoes.forEach(function (sec) { obsSecao.observe(sec); });
  }

  /* ---------- Aparecer ao rolar ---------- */
  var alvos = $$('.titulo-secao, .sobre p, .anos, .sub-titulo, .card-horario, .padre-card, .clero-container h3, .card, #localizacao .botoes, .proxima-missa');

  if (!('IntersectionObserver' in window) || reduzMovimento) {
    alvos.forEach(function (el) { el.classList.add('visivel'); });
  } else {
    var contagem = new Map();
    alvos.forEach(function (el) {
      var pai = el.parentElement;
      var n = contagem.get(pai) || 0;
      contagem.set(pai, n + 1);
      el.style.setProperty('--atraso', (Math.min(n, 5) * 0.09).toFixed(2) + 's');
      // cartões entram girando: os pares vêm da esquerda e os ímpares da direita
      if (el.matches('.card-horario, .card, .padre-card')) el.style.setProperty('--giro', (n % 2 ? 14 : -14) + 'deg');
      el.classList.add('reveal');
    });

    var obsRevelar = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('visivel');
        obs.unobserve(el);
        // depois de aparecer, tira as classes para o efeito de hover voltar ao normal
        window.setTimeout(function () {
          el.classList.remove('reveal', 'visivel');
          el.style.removeProperty('--atraso');
          el.style.removeProperty('--giro');
        }, 1900);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    alvos.forEach(function (el) { obsRevelar.observe(el); });
  }

  /* ---------- Inclinação 3D (só em telas com mouse e sem pedido de menos movimento) ---------- */
  var temMouse = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  function inclinar(el, forca, comBrilho, elevar) {
    var caixa = null, versao = -1, quadro = false, px = 0.5, py = 0.5;

    function medir() { caixa = el.getBoundingClientRect(); versao = versaoRolagem; }
    function aplicar() {
      quadro = false;
      el.style.setProperty('--ry', ((px - 0.5) * forca).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - py) * forca).toFixed(2) + 'deg');
      if (comBrilho) {
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      }
    }

    el.addEventListener('pointerenter', function () {
      medir();
      el.classList.add('ativo');
      if (elevar) el.style.setProperty('--ty', '-6px');
    });
    el.addEventListener('pointermove', function (e) {
      if (!caixa || versao !== versaoRolagem) medir();
      px = Math.min(Math.max((e.clientX - caixa.left) / caixa.width, 0), 1);
      py = Math.min(Math.max((e.clientY - caixa.top) / caixa.height, 0), 1);
      if (!quadro) { quadro = true; window.requestAnimationFrame(aplicar); }
    });
    el.addEventListener('pointerleave', function () {
      el.classList.remove('ativo');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      if (elevar) el.style.setProperty('--ty', '0px');
    });
  }

  if (temMouse && !reduzMovimento) {
    $$('.card-horario, .card, .padre-card').forEach(function (el) {
      el.classList.add('tilt');
      inclinar(el, 14, true, true);
    });
    var brasao = $('#logo-3d');
    if (brasao) inclinar(brasao, 30, false, false);
  }

  /* ---------- Contador de anos de história ---------- */
  function anosDesde(texto) {
    var p = texto.split('-').map(Number);
    var hoje = new Date();
    var anos = hoje.getFullYear() - p[0];
    if (hoje.getMonth() + 1 < p[1] || (hoje.getMonth() + 1 === p[1] && hoje.getDate() < p[2])) anos--;
    return anos;
  }

  $$('[data-desde]').forEach(function (el) {
    var alvo = anosDesde(el.getAttribute('data-desde'));
    if (isNaN(alvo) || alvo < 0) return;
    el.textContent = String(alvo);
    if (reduzMovimento || !('IntersectionObserver' in window)) return;

    var obs = new IntersectionObserver(function (entradas, o) {
      if (!entradas[0].isIntersecting) return;
      o.disconnect();
      var inicio = null, duracao = 1400;
      el.textContent = '0';
      (function passo(t) {
        if (inicio === null) inicio = t;
        var f = Math.min((t - inicio) / duracao, 1);
        el.textContent = String(Math.round(alvo * (1 - Math.pow(1 - f, 3))));
        if (f < 1) window.requestAnimationFrame(passo);
      })(performance.now());
    }, { threshold: 0.6 });
    obs.observe(el);
  });

  /* ---------- Copiar endereço ---------- */
  var toast = $('#toast');
  var tempoToast = null;

  function avisar(texto) {
    if (!toast) return;
    toast.textContent = texto;
    toast.classList.add('mostrar');
    window.clearTimeout(tempoToast);
    tempoToast = window.setTimeout(function () { toast.classList.remove('mostrar'); }, 2200);
  }

  function copiarTexto(texto) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texto);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(area);
      if (ok) resolve(); else reject(new Error('copia indisponível'));
    });
  }

  var botaoCopiar = $('#copiar-endereco');
  if (botaoCopiar) {
    botaoCopiar.hidden = false;
    botaoCopiar.addEventListener('click', function () {
      copiarTexto(botaoCopiar.getAttribute('data-copiar') || '').then(
        function () { avisar('Endereço copiado!'); },
        function () { avisar('Não foi possível copiar. Selecione o endereço manualmente.'); }
      );
    });
  }
})();
