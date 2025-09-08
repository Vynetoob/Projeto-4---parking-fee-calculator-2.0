// Objeto que armazena as regras de preço para cada pátio
const pricingTables = {
    // Pátio Padrão (Exemplo Antigo)
    "padrao": {
      "min_rates": [ // Regras para cálculo por minutos
        { limit: 30, price: 6 },
        { limit: 60, price: 12 },
        { limit: 90, price: 16 }
      ],
      "extra_rate_per_block": 3,      // R\$ 3,00 por bloco
      "block_minutes": 15,            // Tamanho do bloco em minutos (e.g., 15 minutos)
      "daily_value": 40,              // Valor da diária
      "daily_minutes": 1440           // 24 * 60 = minutos por diária
    },
    // PR01 - Presidente Faria
    "pr01": {
      "min_rates": [
        { limit: 30, price: 6 },
        { limit: 60, price: 12 },
        { limit: 120, price: 15 }, // 2:00h
        { limit: 240, price: 20 }, // 4:00h
        { limit: 720, price: 30 }  // 12:00h
      ],
      "extra_rate_per_block": 3,
      "block_minutes": 15,
      "daily_value": 40,
      "daily_minutes": 1440
    },
    // PR02 - Ivo Leão (Mesmas regras do padrão)
    "pr02": {
      "min_rates": [
        { limit: 30, price: 6 },
        { limit: 60, price: 12 },
        { limit: 90, price: 16 }
      ],
      "extra_rate_per_block": 3,
      "block_minutes": 15,
      "daily_value": 40,
      "daily_minutes": 1440
    },
    // PR03 - Getulio Vargas
    "pr03": {
      "min_rates": [
        { limit: 30, price: 5 },
        { limit: 60, price: 10 },
        { limit: 120, price: 14 }, // 2:00h
        { limit: 240, price: 16 }, // 4:00h
        { limit: 480, price: 20 }  // 8:00h
      ],
      "extra_rate_per_block": 0.75,
      "block_minutes": 30,
      "daily_value": 45, // Diária máxima de 45,00
      "daily_minutes": 1440
    },
    // PR04 - Treze de Maio (sem cobrança adicional por bloco após o último limite de minutos)
    "pr04": {
      "min_rates": [
        { limit: 30, price: 5 },
        { limit: 60, price: 10 },
        { limit: 360, price: 15 }, // 6:00h
        { limit: 720, price: 20 }  // 12:00h
      ],
      "daily_value": 40,
      "daily_minutes": 1440
    },
    // PR05 - Mateus Leme
    "pr05": {
      "min_rates": [
        { limit: 30, price: 5 },
        { limit: 60, price: 10 },
        { limit: 120, price: 12 }, // 2:00h
        { limit: 240, price: 15 }, // 4:00h
        { limit: 480, price: 20 }, // 8:00h
        { limit: 720, price: 25 }  // 12:00h
      ],
      "extra_rate_per_block": 2.50,
      "block_minutes": 30,
      "daily_value": 35, // Diária máxima de 35,00
      "daily_minutes": 1440
    }
  };
  
  // Função auxiliar para calcular a tarifa baseada nos minutos,
  // usando as regras específicas do pátio.
  function calcularTarifaPorMinutos(minutos, minRates, extraRatePerBlock, blockMinutes) {
    if (minutos <= 0) {
      return 0;
    }
  
    // Procura o valor dentro dos limites definidos
    for (let i = 0; i < minRates.length; i++) {
      if (minutos <= minRates[i].limit) {
        return minRates[i].price;
      }
    }
  
    // Se o tempo for maior que o último limite definido (e.g., > 90 minutos)
    const lastLimit = minRates[minRates.length - 1].limit;
    const lastPrice = minRates[minRates.length - 1].price;
    
    // Se houver uma regra de cobrança adicional por bloco
    if (extraRatePerBlock !== undefined && blockMinutes !== undefined && minutos > lastLimit) {
      const minutosExtras = minutos - lastLimit;
      // Math.ceil garante que qualquer fração do bloco seja contada como um bloco completo
      const numBlocks = Math.ceil(minutosExtras / blockMinutes);
      return lastPrice + numBlocks * extraRatePerBlock;
    } else {
      // Se não houver regra de cobrança adicional por bloco, retorna o último preço
      return lastPrice;
    }
  }
  
  function calcular() {
    const entradaInput = document.getElementById("entrada").value;
    let saidaInput = document.getElementById("saida").value;
    const patioSelecionado = document.getElementById("patio").value;
  
    // Obtém as regras de preço para o pátio selecionado
    const currentPatioRules = pricingTables[patioSelecionado];
    if (!currentPatioRules) {
      alert("Pátio selecionado não encontrado nas regras de preço.");
      return;
    }
  
    // Desestrutura as regras para facilitar o uso
    const { min_rates, extra_rate_per_block, block_minutes, daily_value, daily_minutes } = currentPatioRules;
  
    if (!entradaInput) {
      alert("Preencha a hora de entrada!");
      return;
    }
  
    const entradaDate = new Date(entradaInput);
    let saidaDate;
  
    if (!saidaInput) {
      saidaDate = new Date();
      // Para garantir que a data atual seja refletida no input se o usuário não preencheu
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      document.getElementById("saida").value = `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
      saidaDate = new Date(saidaInput);
    }
  
    const diffMs = saidaDate.getTime() - entradaDate.getTime();
  
    if (diffMs < 0) {
      alert("A hora de saída não pode ser antes da hora de entrada!");
      return;
    }
  
    // Tempo total em minutos (arredondado para cima, já que não há tolerância)
    const totalDiffMinutes = Math.ceil(diffMs / 60000); // 60000 ms em 1 minuto
  
    let valorTotal = 0;
    let displayDiariasCobradas = 0; // Para exibição no resultado
  
    if (totalDiffMinutes <= 0) {
      valorTotal = 0;
      displayDiariasCobradas = 0;
    } else if (totalDiffMinutes <= daily_minutes) { // Até 24 horas (inclusive)
      // Aplica a tabela por minutos e limita o valor ao daily_value
      valorTotal = Math.min(calcularTarifaPorMinutos(totalDiffMinutes, min_rates, extra_rate_per_block, block_minutes), daily_value);
      displayDiariasCobradas = 1; // Considera como 1 diária para exibição, mesmo que seja por minutos
    } else if (totalDiffMinutes < (2 * daily_minutes)) { // De 24h01m até 47h59m
      valorTotal = daily_value; // Valor fixo da primeira diária
      displayDiariasCobradas = 1; // Continua sendo 1 diária
    } else { // De 48h00m em diante
      // Calcula o número de diárias com base nos blocos completos de 24 horas
      displayDiariasCobradas = Math.floor(totalDiffMinutes / daily_minutes);
      valorTotal = displayDiariasCobradas * daily_value;
    }
    
    // Cálculo para exibição do tempo total
    const displayHours = Math.floor(totalDiffMinutes / 60);
    const displayMinutes = totalDiffMinutes % 60;
  
    // Exibir resultado
    const resultadoDiv = document.getElementById("resultado");
    resultadoDiv.innerHTML = `
      <p><strong>Pátio:</strong> ${document.getElementById("patio").options[document.getElementById("patio").selectedIndex].text}</p>
      <p><strong>Tempo total:</strong> ${displayHours}h ${displayMinutes}min</p>
      <p><strong>Diárias cobradas:</strong> ${displayDiariasCobradas}</p>
      <p><strong>Valor a pagar:</strong> R\$ ${valorTotal.toFixed(2)}</p>
    `;
  }