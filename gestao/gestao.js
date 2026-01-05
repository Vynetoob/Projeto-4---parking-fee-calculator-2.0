// gestao.js - Painel Administrativo Completo

const scriptURL = 'https://script.google.com/macros/s/AKfycbx5nTWDNfW5Xd93xA8HziUtatBFUfi5IOVjQW8RUOlP1ayLmndxIrE3kHZUrmPvlUN1HA/exec';

window.onload = async () => {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
        window.location.href = '../login.html';
        return;
    }
    await trocarAba('patio');
};

async function fazerLogout() {
    await window.supabase.auth.signOut();
    window.location.href = '../login.html';
}

async function trocarAba(aba) {
    const secaoPatio = document.getElementById('secaoPatio');
    const secaoEvento = document.getElementById('secaoEvento');
    const btnPatio = document.getElementById('btnTabPatio');
    const btnEvento = document.getElementById('btnTabEvento');

    secaoPatio.style.display = 'none';
    secaoEvento.style.display = 'none';
    btnPatio.classList.remove('active');
    btnEvento.classList.remove('active');

    if (aba === 'patio') {
        secaoPatio.style.display = 'flex';
        btnPatio.classList.add('active');
        await carregarPatios();
    } else {
        secaoEvento.style.display = 'flex';
        btnEvento.classList.add('active');
        await carregarEventos();
        await carregarSelectPatios();
    }
}

function converterParaMinutos(texto) {
    if (!texto) return 0;
    texto = texto.toString().toLowerCase().trim();
    if (texto.includes('h') || texto.includes(':')) {
        let horas = 0, minutos = 0;
        if (texto.includes(':')) {
            const partes = texto.split(':');
            horas = parseInt(partes[0]) || 0;
            minutos = parseInt(partes[1]) || 0;
        } else {
            const hMatch = texto.match(/(\d+)\s*h/);
            const mMatch = texto.match(/(\d+)\s*m/);
            horas = hMatch ? parseInt(hMatch[1]) : 0;
            minutos = mMatch ? parseInt(mMatch[1]) : 0;
        }
        return (horas * 60) + minutos;
    }
    return parseInt(texto) || 0;
}

// --- GESTÃO DE PÁTIOS ---

async function carregarPatios() {
    const container = document.getElementById('listaPatios');
    const { data: patios } = await window.supabase.from('patios').select('*').order('nome');
    window.patiosCacheGestao = patios;

    container.innerHTML = patios.map(p => `
        <div class="patio-card-item">
            <div class="patio-info">
                <strong>${p.nome}</strong>
                <span>Teto: R$ ${p.daily_value.toFixed(2)} | ${p.min_rates.length} regras</span>
            </div>
            <div class="patio-actions">
                <button class="btn-edit" onclick="abrirModalPatio(${p.id})">✏️ Editar</button>
                <button class="btn-del" onclick="removerPatio(${p.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

function abrirModalPatio(id = null) {
    document.getElementById('modalPatio').style.display = 'block';
    const container = document.getElementById('regrasDinamicas');
    
    if (id) {
        const p = window.patiosCacheGestao.find(x => x.id === id);
        document.getElementById('modalTitlePatio').innerText = "Editar Pátio";
        document.getElementById('editPatioId').value = p.id;
        document.getElementById('nomePatio').value = p.nome;
        document.getElementById('valorExtra').value = p.extra_rate_per_block;
        document.getElementById('tempoExtra').value = p.block_minutes + "m";
        document.getElementById('valorDiaria').value = p.daily_value;
        
        container.innerHTML = '<label>Regras (Tempo | Valor)</label>';
        p.min_rates.forEach((r, i) => {
            const div = document.createElement('div');
            div.className = 'regra-linha';
            div.innerHTML = `
                <input type="text" class="regra-min" value="${r.limit}m" required>
                <input type="number" class="regra-val" value="${r.price}" required>
                ${i === 0 ? `<button type="button" class="btn-add" onclick="adicionarLinhaRegra()">+</button>` : `<button type="button" class="btn-remove" onclick="this.parentElement.remove()">-</button>`}
            `;
            container.appendChild(div);
        });
    } else {
        document.getElementById('modalTitlePatio').innerText = "Novo Pátio";
        document.getElementById('editPatioId').value = '';
        document.getElementById('nomePatio').value = '';
        document.getElementById('valorExtra').value = '';
        document.getElementById('tempoExtra').value = '';
        document.getElementById('valorDiaria').value = '';
        container.innerHTML = `
            <label>Regras (Tempo | Valor)</label>
            <div class="regra-linha">
                <input type="text" class="regra-min" placeholder="Tempo" required>
                <input type="number" class="regra-val" placeholder="Valor" required>
                <button type="button" class="btn-add" onclick="adicionarLinhaRegra()">+</button>
            </div>`;
    }
}

function adicionarLinhaRegra() {
    const container = document.getElementById('regrasDinamicas');
    const div = document.createElement('div');
    div.className = 'regra-linha';
    div.innerHTML = `
        <input type="text" class="regra-min" placeholder="Tempo" required>
        <input type="number" class="regra-val" placeholder="Valor" required>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">-</button>
    `;
    container.appendChild(div);
}

async function salvarPatio() {
    const id = document.getElementById('editPatioId').value;
    const nome = document.getElementById('nomePatio').value;
    const mins = document.querySelectorAll('.regra-min');
    const vals = document.querySelectorAll('.regra-val');

    if (!nome || !mins[0].value) return alert("Preencha o nome e ao menos uma regra!");

    const min_rates = [];
    mins.forEach((m, i) => {
        if (m.value) min_rates.push({ limit: converterParaMinutos(m.value), price: parseFloat(vals[i].value) });
    });

    const dados = {
        nome: nome,
        min_rates: min_rates.sort((a, b) => a.limit - b.limit),
        extra_rate_per_block: parseFloat(document.getElementById('valorExtra').value) || 0,
        block_minutes: converterParaMinutos(document.getElementById('tempoExtra').value) || 0,
        daily_value: parseFloat(document.getElementById('valorDiaria').value) || 0,
        daily_minutes: 1440
    };

    let res = id ? await window.supabase.from('patios').update(dados).eq('id', id) : await window.supabase.from('patios').insert([dados]);

    if (res.error) alert("Erro ao salvar pátio.");
    else { fecharModalPatio(); carregarPatios(); }
}

// --- GESTÃO DE EVENTOS ---

async function carregarEventos() {
    const container = document.getElementById('listaEventosGestao');
    const { data: eventos } = await window.supabase.from('eventos').select('*').order('data_evento', { ascending: false });
    window.eventosCacheGestao = eventos;

    container.innerHTML = eventos.map(e => `
        <div class="patio-card-item">
            <div class="patio-info">
                <strong>${e.nome_evento}</strong>
                <span>📅 ${e.data_evento} | ⏰ ${e.horario_evento}</span>
            </div>
            <div class="patio-actions">
                <button class="btn-edit" onclick="abrirModalEvento(${e.id})">✏️ Editar</button>
                <button class="btn-del" onclick="removerEvento(${e.id})">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
}

function abrirModalEvento(id = null) {
    document.getElementById('modalEvento').style.display = 'block';
    if (id) {
        const e = window.eventosCacheGestao.find(x => x.id === id);
        document.getElementById('modalTitleEvento').innerText = "Editar Evento";
        document.getElementById('editEventoId').value = e.id;
        document.getElementById('dataEv').value = e.data_evento;
        document.getElementById('patioEv').value = e.patio_nome;
        document.getElementById('nomeEv').value = e.nome_evento;
        document.getElementById('localEv').value = e.local_evento;
        document.getElementById('horaEv').value = e.horario_evento;
    } else {
        document.getElementById('modalTitleEvento').innerText = "Novo Evento";
        document.getElementById('editEventoId').value = '';
        document.getElementById('dataEv').value = '';
        document.getElementById('nomeEv').value = '';
        document.getElementById('localEv').value = ''; // Limpa o campo local
        document.getElementById('horaEv').value = '';
    }
}

async function salvarEvento() {
    const id = document.getElementById('editEventoId').value;
    let hora = document.getElementById('horaEv').value;
    if (hora && hora.length === 5) hora += ":00";

    const dados = {
        data_evento: document.getElementById('dataEv').value,
        patio_nome: document.getElementById('patioEv').value,
        nome_evento: document.getElementById('nomeEv').value,
        local_evento: document.getElementById('localEv').value,
        horario_evento: hora
    };

    let res = id ? await window.supabase.from('eventos').update(dados).eq('id', id) : await window.supabase.from('eventos').insert([dados]);

    if (res.error) {
        alert("Erro ao salvar evento no banco.");
    } else {
        try {
            fetch(scriptURL, { 
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        } catch (e) {
            console.error("Erro Planilha:", e);
        }

        alert("Evento salvo e sincronizado!");
        fecharModalEvento();
        carregarEventos();
    }
}

function fecharModalPatio() { document.getElementById('modalPatio').style.display = 'none'; }
function fecharModalEvento() { document.getElementById('modalEvento').style.display = 'none'; }

async function removerPatio(id) {
    if (confirm("Excluir pátio permanentemente?")) {
        await window.supabase.from('patios').delete().eq('id', id);
        carregarPatios();
    }
}

async function removerEvento(id) {
    if (confirm("Excluir evento permanentemente?")) {
        await window.supabase.from('eventos').delete().eq('id', id);
        carregarEventos();
    }
}

async function carregarSelectPatios() {
    const select = document.getElementById('patioEv');
    const { data } = await window.supabase.from('patios').select('nome');
    if (data) {
        select.innerHTML = data.map(p => `<option value="${p.nome}">${p.nome}</option>`).join('');
    }
}