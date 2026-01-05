// script.js - Lógica da Calculadora e Avisos de Eventos

// 1. FUNÇÃO DE INICIALIZAÇÃO ÚNICA (Carrega tudo ao abrir a página)
window.onload = async () => {
    await carregarPatiosNoSelect();
    await verificarEventosHoje();
};

// 2. CARREGAR PÁTIOS NO SELECT
async function carregarPatiosNoSelect() {
    const select = document.getElementById('patio');
    const { data: patios, error } = await window.supabase
        .from('patios')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error("Erro ao carregar:", error);
        return;
    }

    select.innerHTML = patios.length ? '' : '<option value="">Nenhum pátio cadastrado</option>';
    patios.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nome;
        select.appendChild(opt);
    });

    window.patiosCache = patios;
}

// 3. VERIFICAR SE HÁ EVENTOS HOJE E EXIBIR BALÃO OU MENSAGEM
async function verificarEventosHoje() {
    const container = document.getElementById('avisosEventos');
    
    // Obtém a data de hoje no formato YYYY-MM-DD
    const hoje = new Date().toLocaleDateString('en-CA'); 

    const { data: eventos, error } = await window.supabase
        .from('eventos')
        .select('*')
        .eq('data_evento', hoje)
        .order('horario_evento', { ascending: true });

    // SE NÃO HOUVER EVENTOS, MOSTRA A MENSAGEM "Hoje não tem evento"
    if (error || !eventos || eventos.length === 0) {
        container.innerHTML = `
            <div class="sem-evento-msg">
                Hoje não tem evento
            </div>
        `;
        return;
    }

    // SE HOUVER EVENTOS, RENDERIZA OS BALÕES NA ORDEM DE HORÁRIO
    container.innerHTML = eventos.map(e => {
        const d = new Date(e.data_evento + 'T00:00:00');
        const dia = d.getDate().toString().padStart(2, '0');
        const mes = d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

        return `
            <div class="aviso-balao" id="balao-${e.id}">
                <div class="data-quadrado-mini">
                    <span class="dia-mini">${dia}</span>
                    <span class="mes-mini">${mes}</span>
                </div>
                <div class="aviso-info">
                    <strong>${e.nome_evento}</strong>
                    <span>📍 ${e.patio_nome} | ⏰ ${e.horario_evento}</span>
                </div>
                <button class="btn-status-aviso" onclick="gerenciarStatusAviso(this, ${e.id})">
                    CONTRATO TROCADO
                </button>
            </div>
        `;
    }).join('');
}

// 4. LÓGICA DO BOTÃO DO BALÃO (Status e Remoção)
function gerenciarStatusAviso(btn, id) {
    if (btn.innerText === "CONTRATO TROCADO") {
        // Primeiro clique: Vira Evento Encerrado (Verde)
        btn.innerText = "EVENTO ENCERRADO";
        btn.classList.add('encerrado');
    } else {
        // Segundo clique: O balão some
        const balao = document.getElementById(`balao-${id}`);
        balao.style.opacity = '0';
        balao.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            balao.remove();
            
            // Verifica se era o último balão; se for, volta a mensagem de "sem evento"
            const container = document.getElementById('avisosEventos');
            if (container.children.length === 0) {
                container.innerHTML = `<div class="sem-evento-msg">Hoje não tem evento</div>`;
            }
        }, 300);
    }
}

// 5. LÓGICA DE CÁLCULO DA TARIFA
function calcularTarifaBase(minutos, rules) {
    const { min_rates, extra_rate_per_block, block_minutes } = rules;
    for (let r of min_rates) {
        if (minutos <= r.limit) return r.price;
    }
    const lastRule = min_rates[min_rates.length - 1];
    if (extra_rate_per_block > 0 && block_minutes > 0) {
        const excesso = minutos - lastRule.limit;
        const blocos = Math.ceil(excesso / block_minutes);
        return lastRule.price + (blocos * extra_rate_per_block);
    }
    return lastRule.price;
}

function calcular() {
    const entradaVal = document.getElementById("entrada").value;
    const patioId = document.getElementById("patio").value;
    const rules = window.patiosCache?.find(p => p.id == patioId);

    if (!entradaVal || !rules) return alert("Preencha a entrada e selecione um pátio!");

    const saidaVal = document.getElementById("saida").value;
    const saidaDate = saidaVal ? new Date(saidaVal) : new Date();
    const diffMin = Math.ceil((saidaDate - new Date(entradaVal)) / 60000);

    if (diffMin < 0) return alert("Saída antes da entrada!");

    let valor = 0, diarias = 0;
    if (diffMin > 0) {
        if (diffMin <= rules.daily_minutes) {
            const tarifaMinutos = calcularTarifaBase(diffMin, rules);
            valor = Math.min(tarifaMinutos, rules.daily_value);
            diarias = 1;
        } else if (diffMin < (2 * rules.daily_minutes)) {
            valor = rules.daily_value;
            diarias = 1;
        } else {
            diarias = Math.floor(diffMin / rules.daily_minutes);
            valor = diarias * rules.daily_value;
        }
    }

    document.getElementById("resultado").innerHTML = `
        <p><strong>Pátio:</strong> ${rules.nome}</p>
        <p><strong>Tempo:</strong> ${Math.floor(diffMin/60)}h ${diffMin%60}min</p>
        <p><strong>Diárias:</strong> ${diarias}</p>
        <p><strong>Valor:</strong> R$ ${valor.toFixed(2)}</p>
    `;
}