// gestao.js

// Converte formatos como "1h 30m" para minutos inteiros
function converterParaMinutos(t) {
    if (!t) return 0;
    t = t.toString().toLowerCase().trim();
    if (t.includes('h') || t.includes(':')) {
        let h = 0, m = 0;
        if (t.includes(':')) {
            const partes = t.split(':');
            h = parseInt(partes[0]) || 0;
            m = parseInt(partes[1]) || 0;
        } else {
            h = parseInt(t.match(/(\d+)h/)?. [1]) || 0;
            m = parseInt(t.match(/(\d+)m/)?. [1]) || 0;
        }
        return (h * 60) + m;
    }
    return parseInt(t) || 0;
}

async function renderizar() {
    const { data: patios, error } = await window.supabase
        .from('patios')
        .select('*')
        .order('nome', { ascending: true });

    if (error) return console.error(error);

    document.getElementById('listaPatios').innerHTML = patios.map(p => `
        <div class="patio-card-item">
            <div><strong>${p.nome}</strong></div>
            <div class="btns">
                <button class="btn-edit" onclick="abrirModal(${p.id})">Editar</button>
                <button class="btn-del" onclick="excluir(${p.id})">Excluir</button>
            </div>
        </div>
    `).join('');
    
    window.patiosDB = patios;
}

function abrirModal(id = null) {
    const modal = document.getElementById('modalPatio');
    modal.style.display = 'block';
    const container = document.getElementById('regrasDinamicas');
    container.innerHTML = '<label>Regras (Tempo | Valor)</label>';

    if (id) {
        const p = window.patiosDB.find(x => x.id == id);
        document.getElementById('editId').value = p.id;
        document.getElementById('nomePatio').value = p.nome;
        document.getElementById('valorExtra').value = p.extra_rate_per_block;
        document.getElementById('tempoExtra').value = p.block_minutes;
        document.getElementById('valorDiaria').value = p.daily_value;
        p.min_rates.forEach((r, i) => adicionarLinhaRegra(r.limit, r.price, i === 0));
    } else {
        document.getElementById('editId').value = '';
        document.getElementById('nomePatio').value = '';
        document.getElementById('valorExtra').value = '';
        document.getElementById('tempoExtra').value = '';
        document.getElementById('valorDiaria').value = '';
        adicionarLinhaRegra('', '', true);
    }
}

function fecharModal() { document.getElementById('modalPatio').style.display = 'none'; }

function adicionarLinhaRegra(tempo = '', valor = '', primeira = false) {
    const div = document.createElement('div');
    div.className = 'regra-linha';
    div.innerHTML = `
        <input type="text" class="regra-min" value="${tempo}" placeholder="Tempo" required>
        <input type="number" class="regra-val" value="${valor}" placeholder="Valor" required>
        ${primeira ? '<button type="button" class="btn-add" onclick="adicionarLinhaRegra()">+</button>' : '<button type="button" class="btn-remove" onclick="this.parentElement.remove()">-</button>'}
    `;
    document.getElementById('regrasDinamicas').appendChild(div);
}

async function salvarPatio() {
    const id = document.getElementById('editId').value;
    const nome = document.getElementById('nomePatio').value;
    const mins = document.querySelectorAll('.regra-min');
    const vals = document.querySelectorAll('.regra-val');
    
    if (!nome || !mins[0].value) return alert("Preencha o nome e a primeira regra!");

    const min_rates = Array.from(mins).map((m, i) => ({
        limit: converterParaMinutos(m.value),
        price: parseFloat(vals[i].value)
    })).sort((a,b) => a.limit - b.limit);

    const dados = {
        nome, 
        min_rates,
        extra_rate_per_block: parseFloat(document.getElementById('valorExtra').value) || 0,
        block_minutes: converterParaMinutos(document.getElementById('tempoExtra').value) || 0,
        daily_value: parseFloat(document.getElementById('valorDiaria').value) || 0,
        daily_minutes: 1440
    };

    let result;
    if (id) {
        result = await window.supabase.from('patios').update(dados).eq('id', id);
    } else {
        result = await window.supabase.from('patios').insert([dados]);
    }

    if (result.error) alert("Erro ao salvar no banco!");
    else {
        fecharModal();
        renderizar();
    }
}

async function excluir(id) {
    if (confirm("Excluir pátio permanentemente da nuvem?")) {
        const { error } = await window.supabase.from('patios').delete().eq('id', id);
        if (error) alert("Erro ao excluir!");
        else renderizar();
    }
}

renderizar();