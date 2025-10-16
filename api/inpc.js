// Exporta a função para que a Vercel possa executá-la
export default async function handler(request, response) {
  // Pega o código da variável da URL (ex: ?variable=2265)
  const { variable } = request.query;

  // Validação básica para garantir que uma variável foi passada
  if (!variable) {
    return response.status(400).json({ error: 'O parâmetro "variable" é obrigatório.' });
  }

  // Monta a URL da API do IBGE com a variável desejada
  const ibgeApiUrl = `https://apisidra.ibge.gov.br/values/t/1737/n1/all/v/${variable}/p/all`;

  try {
    // Faz a chamada para a API do IBGE
    const fetchResponse = await fetch(ibgeApiUrl);

    // Se o IBGE retornar um erro, repassa o erro
    if (!fetchResponse.ok) {
      return response.status(fetchResponse.status).json({ error: 'Erro ao buscar dados do IBGE.' });
    }

    const data = await fetchResponse.json();
    
    // --- MÁGICA DO CORS ---
    // Define os cabeçalhos que permitem que seu site Webflow acesse esta função
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Retorna os dados do IBGE em formato JSON
    return response.status(200).json(data);

  } catch (error) {
    // Em caso de qualquer outro erro, retorna uma mensagem genérica
    return response.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
