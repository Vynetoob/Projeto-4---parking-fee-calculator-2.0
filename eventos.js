// eventos.js - Lógica PÚBLICA (Visualizar e Copiar)

window.onload = async () => {
    await renderizarEventos();
};

// 1. FUNÇÃO PARA COPIAR DADOS DO EVENTO
async function copiarEvento(id, btn) {
    const ev = window.eventosDB.find(x => x.id === id);
    
    // Formata a data para o padrão brasileiro (DD/MM/AAAA)
    const [ano, mes, dia] = ev.data_evento.split('-');
    const dataBr = `${dia}/${mes}/${ano}`;

    const textoParaCopiar = `🎫 Evento: ${ev.nome_evento}\n📅 Data: ${dataBr}\n⏰ Hora: ${ev.horario_evento.substring(0,5)}\n📍 Local: ${ev.local_evento}\n🅿️ Pátio: ${ev.patio_nome}`;

    try {
        await navigator.clipboard.writeText(textoParaCopiar);
        
        const textoOriginal = btn.innerHTML;
        btn.innerHTML = "✅ Copiado!";
        btn.style.background = "#28a745"; 
        
        setTimeout(() => { 
            btn.innerHTML = textoOriginal; 
            btn.style.background = "#007bff"; 
        }, 2000);
        
    } catch (err) {
        alert("Erro ao copiar.");
    }
}

// 2. RENDERIZAR LISTA DE EVENTOS
async function renderizarEventos() {
    const container = document.getElementById('listaEventos');
    
    const { data: eventos, error } = await window.supabase
        .from('eventos')
        .select('*')
        .order('data_evento', { ascending: true });

    if (error) {
        container.innerHTML = '<p style="color:white; text-align:center;">Erro ao carregar eventos.</p>';
        return;
    }

    window.eventosDB = eventos;

    if (eventos.length === 0) {
        container.innerHTML = '<div class="eventos-header" style="background:rgba(255,255,255,0.1); color:white;"><p>Nenhum evento agendado no momento.</p></div>';
        return;
    }

    container.innerHTML = eventos.map(e => {
        // Lógica de Data
        const d = new Date(e.data_evento + 'T00:00:00');
        const dia = d.getDate().toString().padStart(2, '0');
        const mes = d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

        return `
            <div class="evento-card">
                <div class="data-box">
                    <span class="dia">${dia}</span>
                    <span class="mes">${mes}</span>
                </div>
                <div class="evento-info">
                    <span class="badge-patio">${e.patio_nome}</span>
                    <h3>${e.nome_evento}</h3>
                    <div class="evento-detalhes">
                        <span>📍 ${e.local_evento}</span>
                        <span>⏰ ${e.horario_evento.substring(0,5)}</span>
                    </div>
                </div>
                <button class="btn-copy-evento" onclick="copiarEvento(${e.id}, this)">
                    📋 Copiar
                </button>
            </div>
        `;
    }).join('');
}