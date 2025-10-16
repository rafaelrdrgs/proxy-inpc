// Mapeamento dos códigos de variáveis do IBGE para os códigos de séries do Banco Central
const fallbackMap = {
  '2265': '188',  // INPC Acumulado 12 meses
  '66': '191',    // INPC Acumulado no ano
};

// Função principal que a Vercel executa
export default async function handler(request, response) {
  // Define os cabeçalhos de permissão (CORS) em todas as respostas
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manipulador para a requisição "preflight" do CORS
  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  const { variable: ibgeVariable } = request.query;
  if (!ibgeVariable) {
    return response.status(400).json({ error: 'O parâmetro "variable" é obrigatório.' });
  }

  try {
    // --- TENTATIVA 1: IBGE (Fonte Principal) ---
    console.log(`Tentando buscar dados no IBGE para a variável: ${ibgeVariable}`);
    const ibgeData = await fetchFromIBGE(ibgeVariable);
    console.log('Sucesso ao buscar no IBGE.');
    return response.status(200).json(ibgeData);

  } catch (ibgeError) {
    console.warn(`Falha ao buscar no IBGE: ${ibgeError.message}. Tentando fallback no Banco Central...`);
    
    // --- TENTATIVA 2: BANCO CENTRAL (Fonte Secundária) ---
    const bcbSeriesCode = fallbackMap[ibgeVariable];
    if (bcbSeriesCode) {
      try {
        const bcbData = await fetchFromBCB(bcbSeriesCode);
        console.log('Sucesso ao buscar no Banco Central.');
        return response.status(200).json(bcbData);
      } catch (bcbError) {
        console.error(`Falha ao buscar no Banco Central: ${bcbError.message}`);
        return response.status(500).json({ error: 'Ambas as fontes de dados (IBGE e BCB) falharam.' });
      }
    } else {
      // Se não houver um fallback mapeado, retorna o erro original do IBGE
      return response.status(500).json({ error: ibgeError.message });
    }
  }
}

// Função para buscar e formatar dados do IBGE
async function fetchFromIBGE(variable) {
  const url = `https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/${variable}/p/all`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IBGE respondeu com status ${res.status}`);
  return await res.json();
}

// Função para buscar e formatar dados do Banco Central
async function fetchFromBCB(seriesCode) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados/ultimos/1?formato=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`BCB respondeu com status ${res.status}`);
  
  const data = await res.json();
  if (!data || data.length === 0) throw new Error('BCB não retornou dados.');

  // Converte a resposta do BCB para o mesmo formato do IBGE que o site espera
  const ultimoDado = data[0];
  const [dia, mes, ano] = ultimoDado.data.split('/');
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const nomeMes = meses[parseInt(mes, 10) - 1];

  return [
    {}, // Mantém a estrutura de array do IBGE
    {
      V: ultimoDado.valor,
      D3C: `${nomeMes} ${ano}`
    }
  ];
}
