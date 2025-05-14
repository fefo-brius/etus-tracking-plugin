// Google Apps Script para integração com o plugin de tracking do Figma
// Este script deve ser implantado como um Web App no Google Apps Script

// ID da planilha - substitua pelo ID da sua planilha
const SHEET_ID = "1w-10aNxQzXM_a-AU9xfSgiUetPB7nkvrKpV990rI4p8";
const SHEET_NAME = "Eventos"; // Nome da aba na planilha

// Função principal que processa as solicitações do plugin
function doGet(e) {
  try {
    // Definir resposta como JSON
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Obter parâmetros da requisição
    const params = e.parameter;
    const action = params.action || "create"; // Padrão é criar
    
    let result;
    
    // Executar ação com base no parâmetro 'action'
    switch (action) {
      case "create":
        result = createEvent(params);
        break;
      case "check":
        result = checkEventExists(params);
        break;
      case "list":
        result = listEvents();
        break;
      default:
        result = { success: false, message: "Ação desconhecida" };
    }
    
    // Retornar resultado como JSON
    output.setContent(JSON.stringify(result));
    output.withHeaders({'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type'});
    return output;
  } catch (error) {
    // Em caso de erro, retornar mensagem de erro
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({ success: false, message: error.toString() }));
    output.withHeaders({'Access-Control-Allow-Origin': '*'});
    return output;
  }
}

// Cria um novo evento na planilha
function createEvent(params) {
  // Abrir planilha
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  
  // Validar parâmetros necessários
  if (!params.event_name || !params.screen_name || !params.screen_type || 
      !params.component || !params.element_text) {
    return { success: false, message: "Parâmetros insuficientes" };
  }
  
  // Gerar próximo ID sequencial
  const lastRow = sheet.getLastRow();
  let nextId = 1; // Valor padrão para primeira linha
  
  if (lastRow > 1) { // Se não for a primeira linha (cabeçalho)
    const lastId = sheet.getRange(lastRow, 1).getValue();
    nextId = parseInt(lastId) + 1;
  }
  
  // Determinar ação com base no nome do evento
  const action = params.event_name.includes("view") ? "view" : "click";
  
  // Adicionar linha na planilha
  sheet.appendRow([
    nextId, // event_id
    params.event_name, // event_name
    params.screen_name, // screen_name
    params.screen_type, // screen_type
    params.component, // component
    params.element_text, // element_text
    params.descricao || "", // descrição
    action, // action
    "Ready for dev" // status
  ]);
  
  // Retornar sucesso e ID gerado
  return { 
    success: true, 
    event_id: nextId
  };
}

// Verifica se já existe um evento com as mesmas características
function checkEventExists(params) {
  // Abrir planilha
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  
  // Obter todos os dados
  const data = sheet.getDataRange().getValues();
  
  // Pular cabeçalho
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Verificar se os campos principais são iguais
    if (row[1] === params.event_name && 
        row[2] === params.screen_name && 
        row[3] === params.screen_type && 
        row[4] === params.component && 
        row[5] === params.element_text) {
      
      // Retornar que existe e os dados do evento
      return { 
        exists: true, 
        event: {
          event_id: row[0],
          event_name: row[1],
          screen_name: row[2],
          screen_type: row[3],
          component: row[4],
          element_text: row[5],
          descricao: row[6],
          action: row[7],
          status: row[8]
        }
      };
    }
  }
  
  // Se não encontrou, retornar que não existe
  return { exists: false };
}

// Lista todos os eventos da planilha
function listEvents() {
  // Abrir planilha
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  
  // Obter todos os dados
  const data = sheet.getDataRange().getValues();
  const header = data[0]; // Primeira linha é o cabeçalho
  
  const events = [];
  
  // Converter linhas em objetos
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const event = {
      event_id: row[0],
      event_name: row[1],
      screen_name: row[2],
      screen_type: row[3],
      component: row[4],
      element_text: row[5],
      descricao: row[6],
      action: row[7],
      status: row[8]
    };
    
    events.push(event);
  }
  
  return events;
}

// Function to handle OPTIONS preflight requests
function doOptions(e) {
  return ContentService.createTextOutput('')
      .withHeaders({
        'Access-Control-Allow-Origin': '*', // Or 'null'
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // Add other methods if needed
        'Access-Control-Allow-Headers': 'Content-Type, Authorization' // Add other headers your client might send
      });
} 