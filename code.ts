// Plugin para rastreamento de eventos do app Plusdin
// Permite criar novos eventos de rastreamento ou adicionar eventos existentes
// com registros em uma planilha Google Sheets

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { 
  width: 450, 
  height: 580, 
  themeColors: true 
});

// Google Apps Script web app URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby29g4wMjqRFcjGgIBFZLOn3rp4HU8xpgt9OJ2nvv_2LFmabiIBvJI5EdkEP9TKcIZ_Bg/exec';

// Cores para diferentes tipos de eventos
const EVENT_COLORS = {
  interaction: { r: 255/255, g: 199/255, b: 0/255 },    // #FFC700
  app_screen_view: { r: 0/255, g: 163/255, b: 255/255 }, // #00A3FF
  msg_view: { r: 235/255, g: 255/255, b: 0/255 },       // #EBFF00
  answer_quiz: { r: 211/255, g: 175/255, b: 239/255 },  // #D3AFEF
  quiz_success: { r: 252/255, g: 130/255, b: 255/255 }, // #FC82FF
  cta_click: { r: 252/255, g: 130/255, b: 255/255 },    // #FC82FF
  ad_view: { r: 130/255, g: 255/255, b: 157/255 },      // #82FF9D
  ad_click: { r: 0.149, g: 0.82, b: 0.298 }        // #26D14C
};

// Lista de tipos de eventos disponíveis
const EVENT_TYPES = [
  'interaction',
  'app_screen_view',
  'msg_view',
  'answer_quiz',
  'quiz_success',
  'cta_click',
  'ad_view',
  'ad_click'
];

// Função para converter texto para snake_case
function toSnakeCase(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '')
    .replace(/__+/g, '_');
}

// Carregar fontes necessárias
async function loadRequiredFonts() {
  try {
    await figma.loadFontAsync({ family: "Arial", style: "Bold" });
    await figma.loadFontAsync({ family: "Arial", style: "Regular" });
    return true;
  } catch (error) {
    console.error("Erro ao carregar fontes:", error);
    figma.notify("Erro ao carregar fontes necessárias", {error: true});
    return false;
  }
}

// Função para obter informações do elemento selecionado
function getSelectionInfo() {
  const selection = figma.currentPage.selection;
  
  if (!selection || selection.length === 0) {
    return null;
  }
  
  const selectedNode = selection[0];
  if (!selectedNode) {
    return null;
  }
  
  let elementText = '';
  let parentFrameName = '';
  let nodeType = selectedNode.type ? selectedNode.type.toLowerCase() : 'desconhecido';
  
  // Tenta extrair texto do nó
  if (selectedNode.type === 'TEXT') {
    try {
      elementText = (selectedNode as TextNode).characters || '';
    } catch (e) {
      elementText = '';
    }
  } else {
    // Procura por nós de texto dentro do nó selecionado
    if (typeof (selectedNode as any).findAll === 'function') {
      try {
        const textNodes = (selectedNode as any).findAll((node: SceneNode) => node && node.type === 'TEXT') || [];
        
        if (textNodes.length > 0) {
          elementText = textNodes
            .map((node: TextNode) => node ? (node.characters || '') : '')
            .filter((text: string) => text)
            .join(' ');
        }
      } catch (error) {
        console.error("Erro ao buscar nós de texto:", error);
      }
    }
  }
  
  // Encontra o frame pai
  let parent = selectedNode.parent;
  
  while (parent) {
    if (parent.type === 'FRAME' || parent.type === 'COMPONENT' || parent.type === 'INSTANCE') {
      parentFrameName = parent.name || '';
      break;
    }
    parent = parent.parent;
  }
  
  // Infere o tipo de componente com base no tipo do nó ou nome
  let componentType = nodeType;
  const nodeName = (selectedNode.name || '').toLowerCase();
  
  if (nodeName.includes('button') || nodeName.includes('botão')) {
    componentType = 'button';
  } else if (nodeName.includes('input') || nodeName.includes('field')) {
    componentType = 'input';
  } else if (nodeName.includes('card')) {
    componentType = 'card';
  } else if (nodeName.includes('link')) {
    componentType = 'link';
  }
  
  return {
    nodeName: selectedNode.name || 'Sem nome',
    nodeType: nodeType,
    elementText: elementText ? toSnakeCase(elementText) : '',
    parentFrame: parentFrameName || 'Sem frame pai',
    componentType: componentType
  };
}

// Função para criar o frame com o ID do evento
async function createEventFrame(eventId: string, eventType: string) {
  try {
    // Verificar parâmetros
    if (!eventId) {
      figma.notify("Erro: ID do evento inválido ou vazio", {error: true});
      return null;
    }
    
    // Carregar fontes necessárias antes de criar texto
    await loadRequiredFonts();
    
    // Criar um frame
    const frame = figma.createFrame();
    frame.name = `Event-${eventId} [${eventType}]`;
    
    // Definir tamanho e forma
    frame.resize(80, 80);
    frame.cornerRadius = 40; // Torna circular
    
    // Definir cor amarela para todos os frames
    frame.fills = [{
      type: 'SOLID',
      color: { r: 1, g: 1, b: 0 } // Amarelo
    }];
    
    // Criar texto com o eventId
    const textNode = figma.createText();
    textNode.fontName = { family: "Arial", style: "Bold" };
    textNode.characters = eventId;
    textNode.fontSize = calculateFontSize(eventId);
    textNode.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; // Preto
    
    // Centralizar texto
    textNode.textAlignHorizontal = 'CENTER';
    textNode.textAlignVertical = 'CENTER';
    
    // Ajustar tamanho e posicionar texto no centro
    textNode.resize(60, 40);
    textNode.x = (frame.width - textNode.width) / 2;
    textNode.y = (frame.height - textNode.height) / 2;
    
    // Adicionar o texto ao frame
    frame.appendChild(textNode);
    
    // Função auxiliar para calcular o tamanho da fonte
    function calculateFontSize(id: string): number {
      const length = id.length;
      if (length <= 3) return 28;
      if (length <= 5) return 20;
      return 16; // Para IDs mais longos
    }
    
    // Posicionar o frame próximo ao elemento selecionado ou no centro da viewport
    const selection = figma.currentPage.selection;
    if (selection && selection.length > 0) {
      const selectedNode = selection[0];
      frame.x = selectedNode.x + selectedNode.width + 10;
      frame.y = selectedNode.y;
    } else {
      frame.x = figma.viewport.center.x - frame.width / 2;
      frame.y = figma.viewport.center.y - frame.height / 2;
    }
    
    // Selecionar o frame
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);
    
    figma.notify(`Frame para evento ${eventId} criado com sucesso!`);
    return frame;
  } catch (error) {
    console.error('Erro ao criar frame:', error);
    figma.notify(`Erro ao criar frame: ${error}`, {error: true});
    return null;
  }
}

// Função para verificar duplicidade de evento
async function checkEventExists(eventData: {
  event_name: string;
  screen_name: string;
  screen_type: string;
  component: string;
  element_text: string;
}) {
  try {
    // Construir query params manualmente
    const queryParams = [
      `action=check`,
      `event_name=${encodeURIComponent(eventData.event_name)}`,
      `screen_name=${encodeURIComponent(eventData.screen_name)}`,
      `screen_type=${encodeURIComponent(eventData.screen_type)}`,
      `component=${encodeURIComponent(eventData.component)}`,
      `element_text=${encodeURIComponent(eventData.element_text)}`
    ].join('&');
    
    const url = `${GOOGLE_SCRIPT_URL}?${queryParams}`;
    const response = await fetch(url, { method: 'GET', cache: 'no-cache' });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao verificar evento:", error);
    return { exists: false, error: true };
  }
}

// Função para criar um novo evento
async function createNewEvent(eventData: {
  event_name: string;
  screen_name: string;
  screen_type: string;
  component: string;
  element_text: string;
  descricao: string;
}) {
  try {
    // Determinar a ação com base no nome do evento
    const action = eventData.event_name.includes('view') ? 'view' : 'click';
    
    // Construir query params manualmente
    const queryParams = [
      `action=create`,
      `event_name=${encodeURIComponent(eventData.event_name)}`,
      `screen_name=${encodeURIComponent(eventData.screen_name)}`,
      `screen_type=${encodeURIComponent(eventData.screen_type)}`,
      `component=${encodeURIComponent(eventData.component)}`,
      `element_text=${encodeURIComponent(eventData.element_text)}`,
      `descricao=${encodeURIComponent(eventData.descricao)}`,
      `action=${encodeURIComponent(action)}`
    ].join('&');
    
    const url = `${GOOGLE_SCRIPT_URL}?${queryParams}`;
    const response = await fetch(url, { method: 'GET', cache: 'no-cache' });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || "Erro desconhecido");
    }
    
    return result;
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    throw error;
  }
}

// Função para obter lista de eventos existentes
async function getExistingEvents() {
  try {
    const url = `${GOOGLE_SCRIPT_URL}?action=list`;
    const response = await fetch(url, { method: 'GET', cache: 'no-cache' });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Erro ao listar eventos:", error);
    throw error;
  }
}

// Enviar informações da seleção para a UI quando o plugin inicia
const selectionInfo = getSelectionInfo();
figma.ui.postMessage({ 
  type: 'selection-info', 
  info: selectionInfo 
});

// Ouvir mensagens da UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'check-selection':
        // Enviar informações atualizadas da seleção para a UI
        const currentSelection = getSelectionInfo();
        figma.ui.postMessage({ 
          type: 'selection-info', 
          info: currentSelection 
        });
        break;
        
      case 'create-event':
        // Criar novo evento
        if (!msg.eventData) {
          figma.notify("Dados do evento não fornecidos", {error: true});
          return;
        }
        
        // Validar campos obrigatórios
        const requiredFields = ['event_name', 'screen_name', 'screen_type', 'component', 'element_text', 'descricao'];
        for (const field of requiredFields) {
          if (!msg.eventData[field]) {
            figma.notify(`Campo obrigatório não preenchido: ${field}`, {error: true});
            figma.ui.postMessage({ 
              type: 'validation-error', 
              field: field 
            });
            return;
          }
        }
        
        // Verificar se evento já existe
        if (!msg.eventData.force) {
          const existingCheck = await checkEventExists(msg.eventData);
          if (existingCheck.exists) {
            figma.ui.postMessage({ 
              type: 'event-exists', 
              existingEvent: existingCheck.event 
            });
            return;
          }
        }
        
        try {
          // Criar evento
          const result = await createNewEvent(msg.eventData);
          
          // Criar frame para o evento
          if (result.event_id) {
            const frame = await createEventFrame(result.event_id.toString(), msg.eventData.event_name);
            
            if (frame) {
              figma.notify(`Evento ${result.event_id} criado e registrado com sucesso!`);
              figma.ui.postMessage({ 
                type: 'event-created', 
                eventId: result.event_id 
              });
            }
          }
        } catch (error: any) {
          figma.notify(`Erro ao criar evento: ${error.message || String(error)}`, {error: true});
          figma.ui.postMessage({ 
            type: 'error', 
            message: error.message || String(error)
          });
        }
        break;
        
      case 'list-events':
        // Listar eventos existentes
        try {
          const events = await getExistingEvents();
          figma.ui.postMessage({ 
            type: 'events-list', 
            events: events || [] 
          });
        } catch (error: any) {
          figma.notify(`Erro ao listar eventos: ${error.message || String(error)}`, {error: true});
          figma.ui.postMessage({ 
            type: 'events-list-error', 
            error: error.message || String(error)
          });
        }
        break;
        
      case 'add-existing-event':
        // Adicionar frame para evento existente
        if (!msg.eventId) {
          figma.notify("ID do evento não fornecido", {error: true});
          return;
        }
        
        const frame = await createEventFrame(msg.eventId.toString(), msg.eventType || 'interaction');
        
        if (frame) {
          figma.notify(`Frame para evento ${msg.eventId} adicionado com sucesso!`);
          figma.ui.postMessage({ 
            type: 'event-added', 
            eventId: msg.eventId 
          });
        }
        break;
        
      case 'use-existing-event':
        // Usar evento existente
        if (!msg.event || !msg.event.event_id) {
          figma.notify("Evento inválido", {error: true});
          return;
        }
        
        const existingFrame = await createEventFrame(
          msg.event.event_id.toString(), 
          msg.event.event_name || 'interaction'
        );
        
        if (existingFrame) {
          figma.notify(`Frame para evento existente ${msg.event.event_id} adicionado!`);
          figma.ui.postMessage({ 
            type: 'event-added', 
            eventId: msg.event.event_id 
          });
        }
        break;
        
      case 'close-plugin':
        figma.closePlugin();
        break;
        
      default:
        console.log("Mensagem desconhecida:", msg);
    }
  } catch (error: any) {
    console.error("Erro ao processar mensagem:", error);
    figma.notify(`Erro: ${error.message || String(error)}`, {error: true});
    figma.ui.postMessage({ 
      type: 'error', 
      message: error.message || String(error)
    });
  }
};
