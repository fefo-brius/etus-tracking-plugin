# Configuração do Google Apps Script

Este guia explica como configurar o Google Apps Script necessário para conectar o plugin Figma à sua planilha de tracking.

## 1. Acessar o Google Apps Script

1. Acesse [Google Apps Script](https://script.google.com)
2. Clique em "Novo projeto" para criar um novo script

## 2. Colar o Código do Script

1. Apague todo o código padrão existente no editor
2. Copie e cole o código abaixo (também disponível no arquivo `docs/google_apps_script.gs`):

```javascript
// Google Apps Script para integração com o plugin de tracking do Figma
// Este script deve ser implantado como um Web App no Google Apps Script

// ID da planilha - substitua pelo ID da sua planilha
const SHEET_ID = "SEU_ID_DA_PLANILHA_AQUI";
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
    return output;
  } catch (error) {
    // Em caso de erro, retornar mensagem de erro
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({ success: false, message: error.toString() }));
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
```

3. **Importante**: Substitua o valor de `SHEET_ID` pelo ID da sua planilha (conforme mostrado em "Configuração da Planilha do Google Sheets")

## 3. Salvar o Projeto

1. Clique no ícone de disquete ou use o atalho Ctrl+S (Cmd+S no Mac)
2. Dê um nome ao projeto, como "Tracking Plusdin API"

## 4. Implementar como Web App

1. Clique em "Implantar" > "Nova implantação"
2. Selecione o tipo "Web app"
3. Preencha os campos:
   - **Descrição**: Tracking Plusdin API
   - **Executar como**: Sua conta (recomendado)
   - **Quem tem acesso**: "Qualquer pessoa, mesmo anônima" (para desenvolvimento)
4. Clique em "Implantar"
5. **Importante**: Copie a URL da Web App que será exibida - você precisará inserir esta URL no arquivo `code.ts` do plugin

## 5. Configurar Permissões

Na primeira vez que você implementar, o Google Apps Script solicitará permissões:

1. Clique em "Autorizar acesso"
2. Selecione sua conta
3. Na tela "O Google não verificou este app", clique em "Avançado" e depois em "Acessar Tracking Plusdin API (não seguro)"
4. Clique em "Permitir" para todas as permissões solicitadas

## 6. Testar a API

1. Acesse a URL da Web App em uma nova aba do navegador
2. Você deve ver uma resposta JSON semelhante a `[]` ou uma mensagem de erro que ajudará a diagnosticar problemas
3. Para testar completamente, você pode adicionar parâmetros à URL, como:
   ```
   https://sua-url-do-web-app?action=list
   ```

## 7. Atualizar o Plugin

1. No arquivo `code.ts` do seu plugin, localize a linha:
   ```typescript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/a/macros/brius.com.br/s/AKfycbwrecOaPalyEH4iLeh4SPxOAKNgVnjdwthvY2oj-0Xpd3r84e8oSfuvJoQ9J2adtmOPIg/exec';
   ```

2. Substitua a URL pelo endereço do seu Web App (que você copiou no passo 4)

## 8. Notas sobre Segurança

- Para ambientes de produção, considere restringir o acesso ao Web App apenas para usuários específicos
- Você pode adicionar validação adicional de tokens/chaves no script se necessário
- Lembre-se que Web Apps públicos podem ser acessados por qualquer pessoa que conheça a URL 