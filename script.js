// script.js

// Carrega pátios do banco de dados na nuvem ao abrir a página
async function carregarPatiosNoSelect() {
    const select = document.getElementById('patio');
    
    const { data: patios, error } = await window.supabase
        .from('patios')
        .select('*')
        .order('nome', { ascending: true });

    if (error) {
        console.error("Erro ao carregar:", error);
        select.innerHTML = '<option>Erro ao carregar</option>';
        return;
    }

    select.innerHTML = patios.length ? '' : '<option value="">Nenhum pátio cadastrado</option>';
    patios.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nome;
        select.appendChild(opt);
    });

    // Guardamos os dados localmente para o cálculo não precisar ir na internet de novo
    window.patiosCache = patios;
}

window.onload = carregarPatiosNoSelect;

function calcularTarifaBase(minutos, rules) {
    const { min_rates, extra_rate_per_block, block_minutes } = rules;
    
    // 1. Verifica faixas de minutos
    for (let r of min_rates) {
        if (minutos <= r.limit) return r.price;
    }

    // 2. Se passar da última faixa, aplica o adicional por bloco
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
        if (diffMin <= rules.daily_minutes) { // Até 24h
            const tarifaMinutos = calcularTarifaBase(diffMin, rules);
            valor = Math.min(tarifaMinutos, rules.daily_value);
            diarias = 1;
        } else if (diffMin < (2 * rules.daily_minutes)) { // 24h a 48h
            valor = rules.daily_value;
            diarias = 1;
        } else { // Acima de 48h (cobra por blocos de 24h)
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