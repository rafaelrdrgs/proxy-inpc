// Exporta a função para que a Vercel possa executá-la
export default async function handler(request, response) {
  // --- CORREÇÃO CRÍTICA ---
  // Define os cabeçalhos de permissão em TODAS as respostas (sucesso ou erro)
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Adiciona um manipulador para a requisição "preflight" do CORS
  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

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

    if (!fetchResponse.ok) {
      // Se o IBGE retornar um erro, lança uma exceção para ser pega pelo catch
      throw new Error(`Erro ao buscar dados do IBGE: ${fetchResponse.statusText}`);
    }

    const data = await fetchResponse.json();
    return response.status(200).json(data);

  } catch (error) {
    console.error(error); // Loga o erro no console da Vercel para depuração
    return response.status(500).json({ error: 'Erro interno do servidor ao contatar o IBGE.' });
  }
}
