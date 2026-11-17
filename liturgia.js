/* Paróquia São Crispim - aba da Liturgia Diária
   Lê o arquivo liturgia.json (um dia por data) e mostra o dia escolhido.
   Todo texto entra na página por textContent, nunca como HTML. */
(function () {
  'use strict';

  var conteudo = document.getElementById('liturgia-conteudo');
  if (!conteudo) return;

  var FUSO = 'America/Sao_Paulo'; // dia de Franca-SP, não o do visitante
  var LINK_ALTERNATIVO = 'https://liturgia.cancaonova.com/pb/';
  var nav = document.querySelector('.liturgia-nav');
  var campoData = document.getElementById('dia-escolhido');
  var dados = { dias: {} };
  var falhouAoCarregar = false;

  function ehData(texto) { return /^\d{4}-\d{2}-\d{2}$/.test(texto || ''); }

  function hojeISO() {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function somarDias(iso, n) {
    var p = iso.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10);
  }

  function dataExtenso(iso) {
    var p = iso.split('-').map(Number);
    var texto = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(Date.UTC(p[0], p[1] - 1, p[2])));
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function criar(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined && texto !== null) el.textContent = String(texto);
    return el;
  }

  function linhas(destino, texto, classe) {
    String(texto || '').split('\n').forEach(function (linha) {
      linha = linha.trim();
      if (linha) destino.appendChild(criar('p', classe, linha));
    });
  }

  function aviso(mensagem, comLink) {
    var caixa = criar('p', 'liturgia-aviso', mensagem);
    if (comLink) {
      caixa.appendChild(document.createTextNode(' Se preferir, leia no '));
      var a = criar('a', '', 'site da Canção Nova');
      a.href = LINK_ALTERNATIVO;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      caixa.appendChild(a);
      caixa.appendChild(document.createTextNode('.'));
    }
    return caixa;
  }

  function mostrar(iso) {
    if (campoData) campoData.value = iso;
    while (conteudo.firstChild) conteudo.removeChild(conteudo.firstChild);
    conteudo.appendChild(criar('h2', 'liturgia-dia', dataExtenso(iso)));

    var dia = dados.dias && dados.dias[iso];
    if (!dia) {
      conteudo.appendChild(aviso(textoSemDia(), true));
      return;
    }

    if (dia.titulo) {
      conteudo.appendChild(criar('p', 'liturgia-celebracao', dia.grau ? dia.titulo + ' · ' + dia.grau : dia.titulo));
    }
    if (dia.cor) conteudo.appendChild(criar('p', 'liturgia-cor', 'Cor litúrgica: ' + dia.cor));

    (dia.leituras || []).forEach(function (l) {
      var cartao = criar('article', 'liturgia-leitura');
      var titulo = criar('h3', '', l.tipo || 'Leitura');
      if (l.referencia) titulo.appendChild(criar('span', 'referencia', l.referencia));
      cartao.appendChild(titulo);
      if (l.refrao) cartao.appendChild(criar('p', 'refrao', 'R. ' + l.refrao));
      linhas(cartao, l.texto, /salmo/i.test(l.tipo || '') ? 'verso' : '');
      conteudo.appendChild(cartao);
    });

    if (dia.fonte) conteudo.appendChild(criar('p', 'liturgia-fonte', 'Texto: ' + dia.fonte));
  }

  function textoSemDia() {
    return falhouAoCarregar
      ? 'Não foi possível carregar a liturgia agora. Tente novamente mais tarde.'
      : 'A liturgia deste dia ainda não foi publicada aqui.';
  }

  function iniciar() {
    var inicial = (ehData(location.hash.slice(1)) ? location.hash.slice(1) : hojeISO());
    mostrar(inicial);

    if (nav) nav.hidden = false;
    var atual = function () { return ehData(campoData && campoData.value) ? campoData.value : hojeISO(); };
    function ir(iso) { history.replaceState(null, '', '#' + iso); mostrar(iso); }

    var anterior = document.getElementById('dia-anterior');
    var proximo = document.getElementById('dia-proximo');
    var hoje = document.getElementById('dia-hoje');
    if (anterior) anterior.addEventListener('click', function () { ir(somarDias(atual(), -1)); });
    if (proximo) proximo.addEventListener('click', function () { ir(somarDias(atual(), 1)); });
    if (hoje) hoje.addEventListener('click', function () { ir(hojeISO()); });
    if (campoData) campoData.addEventListener('change', function () { if (ehData(campoData.value)) ir(campoData.value); });
    window.addEventListener('hashchange', function () { if (ehData(location.hash.slice(1))) mostrar(location.hash.slice(1)); });
  }

  fetch('liturgia.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (j) { if (j && typeof j.dias === 'object' && j.dias) dados = j; })
    .catch(function () { falhouAoCarregar = true; })
    .then(iniciar);
})();
