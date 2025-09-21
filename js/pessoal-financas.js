document.addEventListener('DOMContentLoaded', () => {
    // Mapeamento de ícones para categorias conhecidas
    const iconMap = {
        'salário': 'fas fa-money-bill',
        'alimentação': 'fas fa-utensils',
        'transporte': 'fas fa-car',
        'lazer': 'fas fa-gamepad',
        'outros': 'fas fa-ellipsis-h'
    };

    // Função para formatar valores monetários
    function formatarMoeda(valor) {
        if (typeof valor !== 'number') {
            valor = 0;
        }
        return `R$ ${valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }

    // Função para carregar os dados do localStorage
    function carregarDadosFinanceiros() {
        const dadosSalvos = localStorage.getItem('financeiro-widget');
        if (!dadosSalvos) {
            console.warn('Nenhum dado financeiro encontrado no localStorage.');
            return null;
        }

        try {
            const dados = JSON.parse(dadosSalvos);
            // Converte as datas de string para objetos Date
            if (dados.transacoes && Array.isArray(dados.transacoes)) {
                dados.transacoes = dados.transacoes.map(t => ({
                    ...t,
                    data: new Date(t.data)
                }));
            }
            return dados;
        } catch (error) {
            console.error('Erro ao parsear dados financeiros:', error);
            return null;
        }
    }

    // Função principal para atualizar a interface
    function atualizarDashboard() {
        const dados = carregarDadosFinanceiros();

        if (!dados) {
            // Define valores padrão se não houver dados
            document.getElementById('pessoal-saldo-inicial').textContent = formatarMoeda(0);
            document.getElementById('pessoal-despesas-mes').textContent = formatarMoeda(0);
            document.getElementById('pessoal-valor-disponivel').textContent = formatarMoeda(0);
            document.getElementById('pessoal-melhor-dia').innerHTML = '<strong>Melhor dia para comprar:</strong> Não disponível';
            document.getElementById('pessoal-valor-recomendado').innerHTML = '<strong>Valor recomendado para gastar:</strong> Não disponível';
            document.getElementById('pessoal-lista-categorias').innerHTML = '<li>Nenhuma categoria encontrada.</li>';
            return;
        }

        // 1. Atualizar Saldo Inicial
        const saldoInicial = dados.saldoInicial || 0;
        document.getElementById('pessoal-saldo-inicial').textContent = formatarMoeda(saldoInicial);

        // 2. Calcular e Atualizar Despesas do Mês
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        const despesasMes = dados.transacoes
            .filter(t => t.tipo === 'saida' && t.data >= primeiroDiaMes && t.data <= ultimoDiaMes)
            .reduce((total, t) => total + t.valor, 0);
        document.getElementById('pessoal-despesas-mes').textContent = formatarMoeda(despesasMes);

        // 3. Calcular e Atualizar Valor Disponível (Saldo Atual)
        let saldoAtual = saldoInicial;
        dados.transacoes.forEach(t => {
            if (t.data <= hoje) {
                saldoAtual += (t.tipo === 'entrada' ? t.valor : -t.valor);
            }
        });
        document.getElementById('pessoal-valor-disponivel').textContent = formatarMoeda(saldoAtual);

        // 4. Listar Categorias
        const listaCategoriasEl = document.getElementById('pessoal-lista-categorias');
        listaCategoriasEl.innerHTML = ''; // Limpa a lista
        if (dados.categorias && dados.categorias.length > 0) {
            dados.categorias.forEach(cat => {
                const iconClass = iconMap[cat.nome.toLowerCase()] || 'fas fa-tag';
                const li = document.createElement('li');
                li.innerHTML = `<i class="${iconClass}"></i> ${cat.nome}`;
                listaCategoriasEl.appendChild(li);
            });
        } else {
            listaCategoriasEl.innerHTML = '<li>Nenhuma categoria cadastrada.</li>';
        }

        // 5. Calcular e exibir recomendações
        calcularEMostrarMelhorDia(dados);
    }

    function calcularEMostrarMelhorDia(dados) {
        const hoje = new Date();
        const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        let melhorDia = null;
        let maiorPontuacao = -Infinity;
        let valorDisponivelParaGasto = 0;
        let valorRecomendado = 0;

        // Função auxiliar para calcular o saldo em um dia específico
        const calcularSaldoDia = (data) => {
            const dataFimDia = new Date(data);
            dataFimDia.setHours(23, 59, 59, 999);
            let saldo = dados.saldoInicial;
            for (const transacao of dados.transacoes) {
                if (transacao.data <= dataFimDia) {
                    saldo += (transacao.tipo === 'entrada' ? transacao.valor : -transacao.valor);
                }
            }
            return saldo;
        };
        
        // Itera sobre os dias restantes no mês
        for (let dia = new Date(hoje); dia <= fimDoMes; dia.setDate(dia.getDate() + 1)) {
            let saldoAteDia = calcularSaldoDia(dia);

            // Subtrai despesas futuras no mês para ter uma previsão realista
            const despesasFuturas = dados.transacoes
                .filter(t => t.tipo === 'saida' && t.data > dia && t.data.getMonth() === hoje.getMonth())
                .reduce((total, t) => total + t.valor, 0);

            const saldoFuturoConsiderado = saldoAteDia - despesasFuturas;
            
            // Considera um dia como bom se o saldo, após quitar despesas futuras, for de pelo menos R$ 200 de reserva
            if (saldoFuturoConsiderado >= 200) {
                if (saldoAteDia > maiorPontuacao) {
                    maiorPontuacao = saldoAteDia;
                    melhorDia = new Date(dia);
                    valorDisponivelParaGasto = saldoFuturoConsiderado - 200; // Reserva de 200
                    valorRecomendado = valorDisponivelParaGasto * 0.3; // Recomenda gastar 30% do disponível
                }
            }
        }
        
        // Atualiza a interface com a recomendação
        if (melhorDia) {
            const nomeMes = melhorDia.toLocaleString('pt-BR', { month: 'long' });
            document.getElementById('pessoal-melhor-dia').innerHTML = `<strong>Melhor dia para comprar:</strong> ${melhorDia.getDate()} de ${nomeMes}`;
            document.getElementById('pessoal-valor-recomendado').innerHTML = `<strong>Valor recomendado para gastar:</strong> ${formatarMoeda(valorRecomendado)}`;
        } else {
            document.getElementById('pessoal-melhor-dia').innerHTML = '<strong>Melhor dia para comprar:</strong> Saldo insuficiente para recomendações';
            document.getElementById('pessoal-valor-recomendado').innerHTML = '<strong>Valor recomendado para gastar:</strong> —';
        }
    }

    // Executa a função principal para atualizar o dashboard
    atualizarDashboard();
});
