/*
  TempoLivre — protótipo. Tudo aqui é simulação: nenhum dado sai do navegador,
  nada é salvo e todo o dinheiro é fictício.
*/
(function () {
  'use strict';

  /* ---------- Regras do negócio (as mesmas do projeto) ---------- */
  var COMISSAO = 0.15;
  var DESPESAS_BASE = 7000;      // por mês
  var INVESTIMENTO = 60000;
  var SAIDAS_LANCAMENTO = 42000; // plataforma 18.000 + marketing 12.000 + segurança 6.000 + equipamentos 6.000

  var CATEGORIAS = { reforco: 'Reforço escolar', video: 'Edição de vídeo', slides: 'Apresentações' };

  /* ---------- Formatação ---------- */
  var fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  var fmtInt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  var fmtNota = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function moeda(v) { return fmtMoeda.format(Math.round(v * 100) / 100).replace(/ /g, ' '); }
  function inteiro(v) { return fmtInt.format(Math.round(v)); }
  function pct(v) { return fmtNota.format(v * 100) + '%'; }
  function arred(v) { return Math.round(v * 100) / 100; }

  /* divisão de um pagamento: comissão de 15% e o resto para o prestador */
  function dividir(preco) {
    var comissao = arred(preco * COMISSAO);
    return { cliente: preco, comissao: comissao, prestador: arred(preco - comissao) };
  }

  /* ---------- Ajudantes de DOM (texto sempre entra como texto) ---------- */
  function $(id) { return document.getElementById(id); }

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    var k;
    if (attrs) {
      for (k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        if (k === 'class') e.className = attrs[k];
        else if (k === 'text') e.textContent = attrs[k];
        else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
    }
    (kids || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, text) {
    var e = document.createElementNS(SVG_NS, tag);
    var k;
    for (k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    }
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function limpar(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function setLargura(el, v) { el.style.setProperty('--w', v + '%'); }

  function ligarChips(grupo, atributo, aoMudar) {
    var botoes = grupo.querySelectorAll('[' + atributo + ']');
    Array.prototype.forEach.call(botoes, function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(botoes, function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        aoMudar(b.getAttribute(atributo));
      });
    });
  }

  function dataHoje() {
    var d = new Date();
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2);
  }

  /* ---------- Dados de exemplo ---------- */
  var servicos = [
    { id: 'marina', nome: 'Marina S.', cat: 'reforco', titulo: 'Matemática do ensino fundamental, 4 aulas', preco: 160, nota: 4.9, avals: 31, horario: 'Tardes' },
    { id: 'davi',   nome: 'Davi A.',   cat: 'reforco', titulo: 'Correção e dicas de redação, 1 hora',        preco: 40,  nota: 4.8, avals: 22, horario: 'Noites' },
    { id: 'caio',   nome: 'Caio R.',   cat: 'video',   titulo: 'Edição de vídeo curto para redes sociais',    preco: 120, nota: 4.9, avals: 18, horario: 'Fins de semana' },
    { id: 'larissa',nome: 'Larissa P.',cat: 'video',   titulo: 'Pacote com 3 vídeos para pequenos negócios',  preco: 220, nota: 4.7, avals: 12, horario: 'Tardes' },
    { id: 'beatriz',nome: 'Beatriz L.',cat: 'slides',  titulo: 'Apresentação de trabalho escolar, 10 slides', preco: 90,  nota: 4.8, avals: 27, horario: 'Noites' },
    { id: 'tiago',  nome: 'Tiago M.',  cat: 'slides',  titulo: 'Slides para pequeno negócio, 15 slides',      preco: 150, nota: 4.9, avals: 9,  horario: 'Fins de semana' }
  ];

  /* registros de exemplo de cada prestador, em ordem cronológica */
  var registros = {
    marina: [
      { tipo: 'servico', data: '02/09', desc: 'Matemática, 4 aulas', valor: 160 },
      { tipo: 'custo',   data: '05/09', desc: 'Material impresso',   valor: 12 },
      { tipo: 'servico', data: '09/09', desc: 'Reforço, 1 aula',     valor: 40 },
      { tipo: 'custo',   data: '12/09', desc: 'Internet do mês',     valor: 25 },
      { tipo: 'servico', data: '16/09', desc: 'Matemática, 4 aulas', valor: 160 },
      { tipo: 'servico', data: '23/09', desc: 'Revisão para a prova', valor: 60 }
    ],
    davi: [
      { tipo: 'servico', data: '04/09', desc: 'Redação, 1 hora',     valor: 40 },
      { tipo: 'servico', data: '11/09', desc: 'Redação, 1 hora',     valor: 40 },
      { tipo: 'custo',   data: '13/09', desc: 'Caderno e canetas',   valor: 15 },
      { tipo: 'servico', data: '18/09', desc: 'Pacote de 3 correções', valor: 100 }
    ],
    caio: [
      { tipo: 'servico', data: '01/09', desc: 'Vídeo curto',          valor: 120 },
      { tipo: 'custo',   data: '03/09', desc: 'Trilha sonora licenciada', valor: 30 },
      { tipo: 'servico', data: '08/09', desc: 'Vídeo curto',          valor: 120 },
      { tipo: 'servico', data: '15/09', desc: 'Vídeo curto com legenda', valor: 150 },
      { tipo: 'custo',   data: '20/09', desc: 'Armazenamento na nuvem', valor: 20 }
    ],
    larissa: [
      { tipo: 'servico', data: '06/09', desc: 'Pacote de 3 vídeos',   valor: 220 },
      { tipo: 'custo',   data: '07/09', desc: 'Programa de edição',   valor: 45 },
      { tipo: 'servico', data: '19/09', desc: 'Pacote de 3 vídeos',   valor: 220 }
    ],
    beatriz: [
      { tipo: 'servico', data: '03/09', desc: 'Apresentação, 10 slides', valor: 90 },
      { tipo: 'servico', data: '10/09', desc: 'Apresentação, 10 slides', valor: 90 },
      { tipo: 'custo',   data: '14/09', desc: 'Banco de imagens',      valor: 18 },
      { tipo: 'servico', data: '21/09', desc: 'Revisão de slides',     valor: 35 }
    ],
    tiago: [
      { tipo: 'servico', data: '07/09', desc: 'Slides, 15 slides',     valor: 150 },
      { tipo: 'custo',   data: '09/09', desc: 'Internet do mês',       valor: 25 },
      { tipo: 'servico', data: '22/09', desc: 'Slides, 15 slides',     valor: 150 }
    ]
  };

  var catalogoFiltro = 'todos';
  var painelAtual = 'marina';
  var contadorNovos = 0;

  function servicoPorId(id) {
    for (var i = 0; i < servicos.length; i++) if (servicos[i].id === id) return servicos[i];
    return null;
  }

  function iniciais(nome) {
    var partes = nome.replace(/[^A-Za-zÀ-ÿ ]/g, '').trim().split(/\s+/);
    var a = (partes[0] || '?').charAt(0);
    var b = partes.length > 1 ? partes[1].charAt(0) : '';
    return (a + b).toUpperCase();
  }

  /* ---------- Início: comprovante de exemplo ---------- */
  var heroSelect = $('hero-servico');

  function montarHeroSelect(selecionado) {
    limpar(heroSelect);
    servicos.forEach(function (sv) {
      heroSelect.appendChild(h('option', { value: sv.id, text: sv.titulo + ' (' + moeda(sv.preco) + ')' }));
    });
    if (selecionado) heroSelect.value = selecionado;
  }

  function atualizarRecibo() {
    var sv = servicoPorId(heroSelect.value) || servicos[0];
    var d = dividir(sv.preco);
    $('r-cliente').textContent = moeda(d.cliente);
    $('r-comissao').textContent = moeda(d.comissao);
    $('r-prestador').textContent = moeda(d.prestador);
    setLargura($('r-barra-prest'), 85);
    setLargura($('r-barra-com'), 15);
  }

  /* ---------- Catálogo ---------- */
  function cartaoServico(sv) {
    var d = dividir(sv.preco);
    var extra = [];
    if (sv.novo) {
      extra.push(h('span', { class: 'etiqueta', text: 'Perfil novo' }));
    } else {
      extra.push(h('span', { text: 'Nota ' + fmtNota.format(sv.nota) + ' (' + sv.avals + ' avaliações)' }));
    }
    extra.push(h('span', { text: 'Livre: ' + sv.horario.toLowerCase() }));

    return h('li', { class: 'servico' }, [
      h('div', { class: 'servico-avatar cat-' + sv.cat, 'aria-hidden': 'true', text: iniciais(sv.nome) }),
      h('div', { class: 'servico-corpo' }, [
        h('h3', { text: sv.titulo }),
        h('p', { class: 'servico-quem', text: sv.nome + ' • ' + CATEGORIAS[sv.cat] }),
        h('p', { class: 'servico-extra' }, extra)
      ]),
      h('div', { class: 'servico-preco' }, [
        h('strong', { text: moeda(sv.preco) }),
        h('small', { text: 'O prestador fica com ' + moeda(d.prestador) }),
        h('button', {
          class: 'btn btn-primario btn-pequeno', type: 'button',
          'aria-label': 'Contratar: ' + sv.titulo,
          text: 'Contratar',
          onclick: function () { abrirContratacao(sv.id); }
        })
      ])
    ]);
  }

  function renderCatalogo() {
    var lista = $('lista-servicos');
    limpar(lista);
    var visiveis = servicos.filter(function (sv) { return catalogoFiltro === 'todos' || sv.cat === catalogoFiltro; });
    visiveis.forEach(function (sv) { lista.appendChild(cartaoServico(sv)); });
    var nome = catalogoFiltro === 'todos' ? 'todas as categorias' : CATEGORIAS[catalogoFiltro];
    $('catalogo-status').textContent = visiveis.length === 1
      ? 'Mostrando 1 serviço de ' + nome + '.'
      : 'Mostrando ' + visiveis.length + ' serviços de ' + nome + '.';
  }

  /* ---------- Janela de contratação (pagar, reter, concluir) ---------- */
  var dlg = $('dlg');
  var dlgCorpo = $('dlg-corpo');

  function fecharDlg() {
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
  }

  function etapas(atual) {
    var nomes = ['Revisar', 'Pagamento retido', 'Serviço concluído'];
    return h('ol', { class: 'etapas', 'aria-label': 'Etapas da contratação' }, nomes.map(function (n, i) {
      var cls = 'etapa' + (i < atual ? ' etapa-feita' : '') + (i === atual ? ' etapa-atual' : '');
      var attrs = { class: cls, text: n };
      if (i === atual) attrs['aria-current'] = 'step';
      return h('li', attrs);
    }));
  }

  function resumoValores(d) {
    function fila(rotulo, valor, destaque) {
      return h('div', { class: 'fila' + (destaque ? ' fila-destaque' : '') }, [
        h('dt', { text: rotulo }), h('dd', { text: valor })
      ]);
    }
    return h('dl', { class: 'fechamento' }, [
      fila('Cliente paga', moeda(d.cliente)),
      fila('Comissão da TempoLivre (15%)', moeda(d.comissao)),
      fila('Prestador recebe (85%)', moeda(d.prestador), true)
    ]);
  }

  function mostrarEtapa(sv, etapa) {
    var d = dividir(sv.preco);
    limpar(dlgCorpo);
    var titulo = h('h3', { id: 'dlg-titulo', tabindex: '-1' });
    var corpo = [];

    if (etapa === 0) {
      titulo.textContent = 'Contratar ' + sv.nome;
      corpo = [
        etapas(0),
        h('p', { text: sv.titulo + '. Este pagamento é de mentira: nenhum dinheiro real é usado.' }),
        resumoValores(d),
        h('div', { class: 'dlg-acoes' }, [
          h('button', { class: 'btn btn-primario', type: 'button', text: 'Pagar ' + moeda(d.cliente), onclick: function () { mostrarEtapa(sv, 1); } }),
          h('button', { class: 'btn btn-contorno', type: 'button', text: 'Cancelar', onclick: fecharDlg })
        ])
      ];
    } else if (etapa === 1) {
      titulo.textContent = 'Pagamento retido';
      corpo = [
        etapas(1),
        h('p', { text: moeda(d.cliente) + ' ficam guardados com a TempoLivre. ' + sv.nome + ' faz o serviço e, quando você confirmar, o valor é liberado.' }),
        h('div', { class: 'dlg-acoes' }, [
          h('button', { class: 'btn btn-primario', type: 'button', text: 'Confirmar serviço feito', onclick: function () { concluir(sv, d); } }),
          h('button', { class: 'btn btn-contorno', type: 'button', text: 'Fechar', onclick: fecharDlg })
        ])
      ];
    } else {
      titulo.textContent = 'Serviço concluído';
      corpo = [
        etapas(2),
        h('p', { text: sv.nome + ' recebeu ' + moeda(d.prestador) + ' e a TempoLivre ficou com ' + moeda(d.comissao) + '. O registro já está no Banco de Talentos.' }),
        resumoValores(d),
        h('div', { class: 'dlg-acoes' }, [
          h('button', { class: 'btn btn-primario', type: 'button', text: 'Ver no Banco de Talentos', onclick: function () { irParaBanco(sv.id); } }),
          h('button', { class: 'btn btn-contorno', type: 'button', text: 'Fechar', onclick: fecharDlg })
        ])
      ];
    }

    dlgCorpo.appendChild(titulo);
    corpo.forEach(function (c) { dlgCorpo.appendChild(c); });
    titulo.focus();
  }

  function abrirContratacao(id) {
    var sv = servicoPorId(id);
    if (!sv) return;
    mostrarEtapa(sv, 0);
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    $('dlg-titulo').focus();
  }

  function concluir(sv, d) {
    if (!registros[sv.id]) registros[sv.id] = [];
    registros[sv.id].push({ tipo: 'servico', data: dataHoje(), desc: sv.titulo, valor: d.cliente, simulado: true });
    mostrarEtapa(sv, 2);
    if (painelAtual === sv.id) renderBanco();
  }

  function irParaBanco(id) {
    painelAtual = id;
    $('banco-prestador').value = id;
    renderBanco();
    fecharDlg();
    var alvo = $('banco');
    if (alvo && alvo.scrollIntoView) alvo.scrollIntoView();
  }

  dlg.addEventListener('click', function (e) { if (e.target === dlg) fecharDlg(); });

  /* ---------- Cadastro de talento ---------- */
  function atualizarPrevia() {
    var v = parseInt($('t-preco').value, 10);
    var alvo = $('t-previa');
    if (isNaN(v) || v < 10 || v > 1000) {
      alvo.textContent = 'Digite um preço entre R$ 10 e R$ 1.000 para ver a divisão.';
      return;
    }
    var d = dividir(v);
    alvo.textContent = 'O cliente paga ' + moeda(d.cliente) + '. Quando o serviço for concluído, a TempoLivre fica com ' +
      moeda(d.comissao) + ' (15%) e você recebe ' + moeda(d.prestador) + '. Antes disso, você não paga nada.';
  }

  function mostrarErro(el, msg) {
    el.textContent = msg;
    el.hidden = false;
  }

  $('form-talento').addEventListener('submit', function (e) {
    e.preventDefault();
    var erro = $('t-erro');
    var apelido = $('t-apelido').value.trim();
    var titulo = $('t-titulo').value.trim();
    var preco = parseInt($('t-preco').value, 10);
    erro.hidden = true;

    if (apelido.length < 2) { mostrarErro(erro, 'Escreva um apelido com pelo menos 2 letras.'); $('t-apelido').focus(); return; }
    if (titulo.length < 5) { mostrarErro(erro, 'Descreva o que você oferece em pelo menos 5 letras.'); $('t-titulo').focus(); return; }
    if (isNaN(preco) || preco < 10 || preco > 1000) { mostrarErro(erro, 'Informe um preço entre R$ 10 e R$ 1.000.'); $('t-preco').focus(); return; }

    contadorNovos += 1;
    var novo = {
      id: 'novo-' + contadorNovos, nome: apelido, cat: $('t-categoria').value,
      titulo: titulo, preco: preco, nota: 0, avals: 0, horario: $('t-horario').value, novo: true
    };
    servicos.unshift(novo);
    registros[novo.id] = [];

    montarHeroSelect(heroSelect.value);
    montarSelectBanco();
    catalogoFiltro = 'todos';
    Array.prototype.forEach.call(document.querySelectorAll('[data-filtro]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-filtro') === 'todos' ? 'true' : 'false');
    });
    renderCatalogo();

    $('t-sucesso-texto').textContent = apelido + ', seu perfil já aparece no começo do catálogo, com a etiqueta "Perfil novo". Você também ganhou um painel no Banco de Talentos, ainda vazio.';
    $('t-sucesso').hidden = false;
    $('form-talento').reset();
    $('t-preco').value = 80;
    atualizarPrevia();
  });

  $('t-preco').addEventListener('input', atualizarPrevia);

  /* ---------- Banco de Talentos ---------- */
  function montarSelectBanco() {
    var sel = $('banco-prestador');
    limpar(sel);
    servicos.forEach(function (sv) {
      var rotulo = sv.nome + ' (' + CATEGORIAS[sv.cat].toLowerCase() + ')' + (sv.novo ? ', perfil novo' : '');
      sel.appendChild(h('option', { value: sv.id, text: rotulo }));
    });
    sel.value = painelAtual;
  }

  function totaisBanco(id) {
    var lista = registros[id] || [];
    var recebido = 0, custos = 0;
    lista.forEach(function (r) {
      if (r.tipo === 'servico') recebido += dividir(r.valor).prestador;
      else custos += r.valor;
    });
    return { recebido: arred(recebido), custos: arred(custos), liquido: arred(recebido - custos) };
  }

  function renderBanco() {
    var t = totaisBanco(painelAtual);
    $('k-recebido').textContent = moeda(t.recebido);
    $('k-custos').textContent = moeda(t.custos);
    $('k-liquido').textContent = moeda(t.liquido);
    renderAlocacao(t.liquido);

    var corpo = $('banco-corpo');
    limpar(corpo);
    var lista = (registros[painelAtual] || []).slice().reverse();
    if (!lista.length) {
      corpo.appendChild(h('tr', {}, [
        h('td', { class: 'vazio', colspan: '6', text: 'Ainda não há registros neste painel. Contrate um serviço deste prestador ou registre um custo.' })
      ]));
      return;
    }
    lista.forEach(function (r) {
      var descCelula = h('td', {}, [r.desc]);
      if (r.simulado) descCelula.appendChild(h('span', { class: 'etiqueta', text: 'Simulação' }));
      var linha;
      if (r.tipo === 'servico') {
        var d = dividir(r.valor);
        linha = [
          h('td', { text: r.data }), descCelula,
          h('td', { class: 'num', text: moeda(d.cliente) }),
          h('td', { class: 'num', text: moeda(d.comissao) }),
          h('td', { class: 'num', text: moeda(d.prestador) }),
          h('td', { class: 'num', text: '—' })
        ];
      } else {
        linha = [
          h('td', { text: r.data }), descCelula,
          h('td', { class: 'num', text: '—' }), h('td', { class: 'num', text: '—' }), h('td', { class: 'num', text: '—' }),
          h('td', { class: 'num', text: moeda(r.valor) })
        ];
      }
      corpo.appendChild(h('tr', {}, linha));
    });
  }

  /* guardar + reinvestir nunca passam de 100% */
  function renderAlocacao(liquido) {
    var gSlider = $('a-guardar'), rSlider = $('a-reinvestir');
    var g = parseInt(gSlider.value, 10), r = parseInt(rSlider.value, 10);
    var livre = 100 - g - r;
    $('a-guardar-v').textContent = g + '%';
    $('a-reinvestir-v').textContent = r + '%';
    setLargura($('p-guardar'), g);
    setLargura($('p-reinvestir'), r);
    setLargura($('p-livre'), livre);

    var base = Math.max(liquido, 0);
    var itens = [
      ['Guardar', g, 'var(--teal)'],
      ['Reinvestir no talento', r, 'var(--coin)'],
      ['Livre para gastar', livre, 'var(--u6)']
    ];
    var leg = $('a-legenda');
    limpar(leg);
    itens.forEach(function (it) {
      var li = h('li', {}, [
        h('span', { class: 'amostra' }),
        h('span', { text: it[0] + ' (' + it[1] + '%)' }),
        h('span', { class: 'legenda-valor', text: moeda(base * it[1] / 100) })
      ]);
      li.firstChild.style.setProperty('--c', it[2]);
      leg.appendChild(li);
    });
  }

  $('a-guardar').addEventListener('input', function () {
    var g = parseInt(this.value, 10), r = parseInt($('a-reinvestir').value, 10);
    if (g + r > 100) $('a-reinvestir').value = 100 - g;
    renderBanco();
  });
  $('a-reinvestir').addEventListener('input', function () {
    var r = parseInt(this.value, 10), g = parseInt($('a-guardar').value, 10);
    if (g + r > 100) $('a-guardar').value = 100 - r;
    renderBanco();
  });

  $('banco-prestador').addEventListener('change', function () {
    painelAtual = this.value;
    renderBanco();
  });

  $('form-custo').addEventListener('submit', function (e) {
    e.preventDefault();
    var erro = $('custo-erro');
    var desc = $('custo-desc').value.trim();
    var valor = parseFloat($('custo-valor').value);
    erro.hidden = true;
    if (desc.length < 2) { mostrarErro(erro, 'Diga em poucas palavras o que você gastou.'); $('custo-desc').focus(); return; }
    if (isNaN(valor) || valor < 1 || valor > 1000) { mostrarErro(erro, 'Informe um valor entre R$ 1 e R$ 1.000.'); $('custo-valor').focus(); return; }
    if (!registros[painelAtual]) registros[painelAtual] = [];
    registros[painelAtual].push({ tipo: 'custo', data: dataHoje(), desc: desc, valor: arred(valor), simulado: true });
    $('custo-desc').value = '';
    $('custo-valor').value = '';
    renderBanco();
  });

  /* ---------- Para investidores: uso do dinheiro ---------- */
  var usoInvestimento = [
    { nome: 'Desenvolvimento da plataforma', valor: 18000, cor: 'var(--u1)',
      risco: 'A primeira versão atrasar ou custar mais do que o previsto.',
      reduz: 'Lançar só com o essencial (catálogo, pagamento retido e Banco de Talentos) e liberar o resto por etapas.' },
    { nome: 'Marketing e aquisição de clientes', valor: 12000, cor: 'var(--u2)',
      risco: 'Gastar com divulgação e atrair gente que não contrata.',
      reduz: 'Começar pelo boca a boca em escolas e bairros, medir quanto custa cada cliente novo e ampliar só o que funciona.' },
    { nome: 'Segurança e cadastro de prestadores', valor: 6000, cor: 'var(--u3)',
      risco: 'Perfil falso, golpe ou serviço mal feito abalarem a confiança.',
      reduz: 'Verificação simples no cadastro, pagamento retido até a confirmação e avaliação depois de cada serviço.' },
    { nome: 'Equipamentos e atendimento', valor: 6000, cor: 'var(--u4)',
      risco: 'Os pedidos de ajuda crescerem mais rápido que a equipe.',
      reduz: 'Central de ajuda com respostas prontas e compra de equipamento só quando a equipe crescer.' },
    { nome: 'Capital de giro', valor: 12000, cor: 'var(--u5)',
      risco: 'Meses em que a receita fica abaixo das despesas antes do equilíbrio.',
      reduz: 'O giro cobre os primeiros meses. O equilíbrio está em 467 serviços por mês e é acompanhado todo mês.' },
    { nome: 'Reserva para imprevistos', valor: 6000, cor: 'var(--u6)',
      risco: 'Imprevistos: queda do sistema, mudança de regra ou gasto extra.',
      reduz: 'Reserva separada, usada só com decisão registrada.' }
  ];

  var riscosExpansao = [
    { nome: 'Crescer rápido demais',
      risco: 'A qualidade dos serviços cair quando entrarem muitos prestadores de uma vez.',
      reduz: 'Abrir um bairro de cada vez e só avançar quando as avaliações se mantiverem boas.' },
    { nome: 'Faltar prestador ou faltar cliente',
      risco: 'Em um bairro novo, ter muita procura e pouca oferta (ou o contrário).',
      reduz: 'Cadastrar prestadores antes do lançamento e divulgar para clientes só onde já há quem atenda.' },
    { nome: 'Reação de plataformas maiores',
      risco: 'Plataformas conhecidas copiarem a ideia ou baixarem o preço.',
      reduz: 'Focar em quem está começando, na comunidade local e no Banco de Talentos, que hoje não é o foco delas.' },
    { nome: 'Regras de pagamento e de dados',
      risco: 'Reter pagamentos e guardar dados de usuários exige cumprir regras legais.',
      reduz: 'Procurar orientação antes de operar de verdade, pedir só os dados necessários e não guardar dados pessoais sem motivo.' }
  ];

  function renderUso() {
    var barra = $('uso-barra');
    var leg = $('uso-legenda');
    limpar(barra);
    limpar(leg);
    usoInvestimento.forEach(function (u) {
      var parte = u.valor / INVESTIMENTO * 100;
      var seg = h('span', { class: 'pilha-seg', title: u.nome + ': ' + moeda(u.valor) });
      seg.style.setProperty('--c', u.cor);
      setLargura(seg, parte);
      barra.appendChild(seg);

      var li = h('li', {}, [
        h('span', { class: 'amostra' }),
        h('span', { text: u.nome }),
        h('span', { class: 'legenda-valor', text: moeda(u.valor) + ' (' + Math.round(parte) + '%)' })
      ]);
      li.firstChild.style.setProperty('--c', u.cor);
      leg.appendChild(li);
    });
  }

  function itemRisco(nome, valor, risco, reduz) {
    var resumo = h('summary', {}, [h('span', { text: nome }), valor ? h('span', { class: 'risco-valor', text: valor }) : null]);
    return h('details', {}, [
      resumo,
      h('div', { class: 'risco-corpo' }, [
        h('p', {}, [h('strong', { text: 'Risco: ' }), risco]),
        h('p', {}, [h('strong', { text: 'Como reduzimos: ' }), reduz])
      ])
    ]);
  }

  function renderRiscos() {
    var alvo = $('lista-riscos');
    limpar(alvo);
    alvo.appendChild(h('h4', { text: 'Onde o investimento será usado' }));
    usoInvestimento.forEach(function (u) { alvo.appendChild(itemRisco(u.nome, moeda(u.valor), u.risco, u.reduz)); });
    alvo.appendChild(h('h4', { text: 'Se a TempoLivre expandir para outros bairros' }));
    riscosExpansao.forEach(function (r) { alvo.appendChild(itemRisco(r.nome, '', r.risco, r.reduz)); });
  }

  /* ---------- Calculadora ---------- */
  var GAUGE_MAX = 1500;

  function atualizarCalculadora() {
    var qtd = parseInt($('calc-servicos').value, 10);
    var ticket = parseInt($('calc-ticket').value, 10);
    $('calc-servicos-v').textContent = inteiro(qtd);
    $('calc-ticket-v').textContent = moeda(ticket);

    var volume = qtd * ticket;
    var receita = volume * COMISSAO;
    var lucro = receita - DESPESAS_BASE;
    var margem = receita > 0 ? lucro / receita : 0;
    var equilibrio = Math.ceil(DESPESAS_BASE / (ticket * COMISSAO));

    $('c-volume').textContent = moeda(volume);
    $('c-receita').textContent = moeda(receita);
    $('c-despesas').textContent = moeda(DESPESAS_BASE);
    $('c-lucro').textContent = moeda(lucro);
    $('c-margem').textContent = pct(margem);
    $('c-pe').textContent = inteiro(equilibrio) + ' serviços/mês';

    var acima = qtd >= equilibrio;
    $('c-status').textContent = acima
      ? 'Acima do ponto de equilíbrio: sobram ' + moeda(lucro) + ' por mês depois das despesas.'
      : 'Abaixo do ponto de equilíbrio: faltam ' + inteiro(equilibrio - qtd) + ' serviços por mês para cobrir as despesas.';

    setLargura($('medidor-barra'), Math.min(100, qtd / GAUGE_MAX * 100));
    $('medidor-marca').style.setProperty('--x', Math.min(100, equilibrio / GAUGE_MAX * 100) + '%');
    $('medidor-barra').parentNode.setAttribute('data-estado', acima ? 'ok' : 'baixo');
    $('medidor-rotulo').textContent = 'A marca preta é o ponto de equilíbrio: ' + inteiro(equilibrio) + ' serviços por mês.';
  }

  /* ---------- Primeiro ano ---------- */
  var CENARIOS = {
    esperado:  { nome: 'esperado',  servicos: [300, 450, 600, 800, 900, 1000, 1080, 1160, 1240, 1320, 1400, 1480] },
    cauteloso: { nome: 'cauteloso', servicos: [150, 300, 450, 600, 700, 800, 840, 880, 920, 960, 1000, 1040] }
  };
  var TICKET_ANO = 100;
  var cenarioAtual = 'esperado';

  /* despesas crescem 4% ao mês a partir do mês 5 */
  function despesasDoMes(m) { return DESPESAS_BASE * Math.pow(1.04, Math.max(0, m - 5 + 1)); }

  function calcularAno(chave) {
    var sv = CENARIOS[chave].servicos;
    var meses = sv.map(function (qtd, i) {
      var m = i + 1;
      var receita = qtd * TICKET_ANO * COMISSAO;
      var despesas = despesasDoMes(m);
      return { m: m, qtd: qtd, receita: receita, despesas: despesas, lucro: receita - despesas };
    });
    var receita = 0, despesas = 0;
    meses.forEach(function (x) { receita += x.receita; despesas += x.despesas; });
    var lucro = receita - despesas;
    var ultimo = sv[sv.length - 1], primeiro = sv[0];
    return {
      meses: meses, receita: receita, despesas: despesas, lucro: lucro,
      margem: receita > 0 ? lucro / receita : 0,
      usuariosInicio: Math.ceil(primeiro / 2) + Math.ceil(primeiro / 6),
      usuariosFim: Math.ceil(ultimo / 2) + Math.ceil(ultimo / 6),
      caixaFinal: INVESTIMENTO + lucro - SAIDAS_LANCAMENTO
    };
  }

  function kpi(rotulo, valor, nota, destaque) {
    return h('div', { class: 'kpi' }, [
      h('span', { class: 'kpi-rotulo', text: rotulo }),
      h('strong', { class: destaque ? 'kpi-destaque' : '', text: valor }),
      nota ? h('small', { text: nota }) : null
    ]);
  }

  function renderAno() {
    var a = calcularAno(cenarioAtual);
    var k = $('ano-kpis');
    limpar(k);
    k.appendChild(kpi('Receita do ano', moeda(a.receita), 'Comissão de 15%'));
    k.appendChild(kpi('Despesas do ano', moeda(a.despesas)));
    k.appendChild(kpi('Lucro do ano', moeda(a.lucro), null, true));
    k.appendChild(kpi('Margem de lucro', pct(a.margem), 'Lucro dividido pela receita'));
    k.appendChild(kpi('Usuários', inteiro(a.usuariosInicio) + ' → ' + inteiro(a.usuariosFim), 'Início e fim do ano'));
    k.appendChild(kpi('Caixa no fim do ano', moeda(a.caixaFinal), 'R$ 60.000 + lucro − R$ 42.000 de lançamento'));

    desenharGrafico(a);

    var primeiroLucro = null, prejuizoAntes = 0;
    a.meses.forEach(function (x) {
      if (primeiroLucro === null) {
        if (x.lucro >= 0) primeiroLucro = x.m;
        else prejuizoAntes += -x.lucro;
      }
    });
    var giro = 18000;
    var texto = 'No cenário ' + CENARIOS[cenarioAtual].nome + ', a empresa passa a ter lucro mensal no mês ' + primeiroLucro + '. ';
    if (prejuizoAntes > 0) {
      texto += 'Antes disso, o prejuízo acumulado é de ' + moeda(prejuizoAntes) + ', que cabe nos ' + moeda(giro) + ' de capital de giro e reserva.';
    }
    $('ano-leitura').textContent = texto;
  }

  function desenharGrafico(a) {
    var svg = $('grafico-ano');
    limpar(svg);
    var L = 56, R = 16, T = 30, B = 40;
    var W = 720, H = 320;
    var pw = W - L - R, ph = H - T - B;
    var topo = 24000;
    var banda = pw / 12;
    var largura = Math.min(36, banda - 14);

    function y(v) { return T + ph - (v / topo) * ph; }

    svg.setAttribute('aria-label',
      'Gráfico de barras com a receita de cada mês e uma linha com as despesas. Receita do ano: ' + moeda(a.receita) +
      '. Despesas do ano: ' + moeda(a.despesas) + '.');
    svg.appendChild(s('title', {}, 'Receita e despesas por mês, cenário ' + CENARIOS[cenarioAtual].nome));

    /* grade e escala */
    [0, 6000, 12000, 18000, 24000].forEach(function (v) {
      svg.appendChild(s('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: v === 0 ? 'g-eixo' : 'g-grade' }));
      svg.appendChild(s('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'g-texto' }, v === 0 ? '0' : inteiro(v / 1000) + ' mil'));
    });
    svg.appendChild(s('text', { x: L, y: 14, class: 'g-texto' }, 'R$ por mês'));

    /* barras de receita */
    a.meses.forEach(function (x, i) {
      var cx = L + banda * i + banda / 2;
      var altura = (x.receita / topo) * ph;
      var barra = s('rect', {
        x: cx - largura / 2, y: y(x.receita), width: largura, height: altura, rx: 3,
        class: x.receita >= x.despesas ? 'g-barra-acima' : 'g-barra-abaixo'
      });
      barra.appendChild(s('title', {}, 'Mês ' + x.m + ': receita ' + moeda(x.receita) + ', despesas ' + moeda(x.despesas)));
      svg.appendChild(barra);
      svg.appendChild(s('text', { x: cx, y: H - B + 20, 'text-anchor': 'middle', class: 'g-texto' }, String(x.m)));
    });
    svg.appendChild(s('text', { x: L + pw / 2, y: H - 4, 'text-anchor': 'middle', class: 'g-texto' }, 'Mês do ano'));

    /* linha das despesas */
    var pontos = a.meses.map(function (x, i) {
      return (L + banda * i + banda / 2).toFixed(1) + ',' + y(x.despesas).toFixed(1);
    }).join(' ');
    svg.appendChild(s('polyline', { points: pontos, class: 'g-linha' }));
    a.meses.forEach(function (x, i) {
      svg.appendChild(s('circle', { cx: L + banda * i + banda / 2, cy: y(x.despesas), r: 3.5, class: 'g-ponto' }));
    });

    /* valores do primeiro e do último mês */
    [0, 11].forEach(function (i) {
      var x = a.meses[i];
      var cx = L + banda * i + banda / 2;
      svg.appendChild(s('text', { x: cx, y: y(x.receita) - 8, 'text-anchor': 'middle', class: 'g-valor' }, moeda(x.receita).replace(',00', '')));
    });
  }

  /* ---------- Início ---------- */
  function iniciar() {
    montarHeroSelect();
    heroSelect.addEventListener('change', atualizarRecibo);
    /* as barras começam vazias e crescem uma vez, quando a página abre */
    window.requestAnimationFrame(function () { window.requestAnimationFrame(atualizarRecibo); });
    $('r-cliente').textContent = moeda(servicos[0].preco);
    $('r-comissao').textContent = moeda(dividir(servicos[0].preco).comissao);
    $('r-prestador').textContent = moeda(dividir(servicos[0].preco).prestador);

    renderCatalogo();
    ligarChips(document.querySelector('[aria-label="Filtrar por categoria"]'), 'data-filtro', function (v) {
      catalogoFiltro = v;
      renderCatalogo();
    });

    atualizarPrevia();
    montarSelectBanco();
    renderBanco();

    renderUso();
    renderRiscos();
    $('calc-servicos').addEventListener('input', atualizarCalculadora);
    $('calc-ticket').addEventListener('input', atualizarCalculadora);
    atualizarCalculadora();

    ligarChips(document.querySelector('[aria-label="Escolher cenário"]'), 'data-cenario', function (v) {
      cenarioAtual = v;
      renderAno();
    });
    renderAno();
  }

  iniciar();
})();
