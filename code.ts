// Plugin para rastreamento de eventos do app Plusdin
// Permite criar novos eventos de rastreamento ou adicionar eventos existentes
// com registros em uma planilha Google Sheets

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 400, height: 550, themeColors: true });

// Google Apps Script web app URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby29g4wMjqRFcjGgIBFZLOn3rp4HU8xpgt9OJ2nvv_2LFmabiIBvJI5EdkEP9TKcIZ_Bg/exec';

// Cores para diferentes tipos de eventos (valores hexadecimais)
const EVENT_COLOR_HEX = {
  interaction: '#FFC700',
  app_screen_view: '#00A3FF',
  msg_view: '#EBFF00',
  answer_quiz: '#D3AFEF',
  quiz_success: '#FC82FF',
  cta_click: '#FC82FF',
  ad_view: '#82FF9D',
  ad_click: '#26D14C'
};

// Função para converter hex para RGB (0-1)
function hexToRgb(hex: string) {
  // Remover o # se existir
  hex = hex.replace(/^#/, '');
  
  // Converter para RGB
  const bigint = parseInt(hex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  
  return { r, g, b };
}

// Converter cores hex para o formato RGB do Figma
const EVENT_COLORS: Record<string, { r: number, g: number, b: number }> = {};
for (const key in EVENT_COLOR_HEX) {
  if (EVENT_COLOR_HEX.hasOwnProperty(key)) {
    const hexValue = EVENT_COLOR_HEX[key as keyof typeof EVENT_COLOR_HEX];
    EVENT_COLORS[key] = hexToRgb(hexValue);
  }
}

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
    
    // Log para debug
    console.log(`Criando frame para evento ${eventId} do tipo: ${eventType}`);
    
    // Carregar fontes necessárias antes de criar texto
    await loadRequiredFonts();
    
    // Criar um frame
    const frame = figma.createFrame();
    frame.name = `Event-${eventId} [${eventType}]`;
    
    // Definir tamanho e forma
    frame.resize(80, 80);
    frame.cornerRadius = 40; // Torna circular
    
    // Normalizar o tipo de evento para matching
    const normalizedEventType = eventType.toLowerCase().trim();
    console.log(`Tipo de evento normalizado: ${normalizedEventType}`);
    
    // Determinar a cor com base no tipo de evento
    let colorKey = 'interaction'; // Cor padrão caso não encontre correspondência
    
    // Verificar correspondência exata primeiro
    for (const type of EVENT_TYPES) {
      if (normalizedEventType === type) {
        colorKey = type;
        console.log(`Correspondência exata encontrada: ${colorKey}`);
        break;
      }
    }
    
    // Se não encontrou correspondência exata, procurar contém
    if (colorKey === 'interaction' && normalizedEventType !== 'interaction') {
      for (const type of EVENT_TYPES) {
        if (normalizedEventType.includes(type)) {
          colorKey = type;
          console.log(`Correspondência parcial encontrada: ${colorKey}`);
          break;
        }
      }
    }
    
    // Obtém o valor RGB para esse tipo de evento
    const color = EVENT_COLORS[colorKey] || EVENT_COLORS.interaction;
    console.log(`Evento '${eventType}' mapeado para chave '${colorKey}' com cor:`, color);
    
    // Aplicar a cor específica do tipo de evento
    frame.fills = [{
      type: 'SOLID',
      color: color
    }];
    
    // Criar texto com o eventId
    const textNode = figma.createText();
    textNode.fontName = { family: "Arial", style: "Bold" };
    
    // Formatar o ID para sempre ter 3 dígitos (padding com zeros à esquerda)
    const paddedEventId = formatEventIdWithPadding(eventId);
    textNode.characters = paddedEventId;
    
    textNode.fontSize = calculateFontSize(paddedEventId);
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
      
      // Obter a posição visual do elemento selecionado
      // Posicionar no lado direito visível do elemento
      const visibleBounds = selectedNode.absoluteBoundingBox;
      if (visibleBounds) {
        frame.x = visibleBounds.x + visibleBounds.width + 4; // 4px à direita da borda visível
        frame.y = visibleBounds.y;
      } else {
        // Fallback para o método anterior
        frame.x = selectedNode.x + selectedNode.width + 4;
        frame.y = selectedNode.y;
      }
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

// Função para gerar um ID de evento
function generateEventId(): string {
  // Gera um número aleatório entre 1 e 999
  return Math.floor(Math.random() * 999 + 1).toString();
}

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
        
      case 'resize':
        // Handle window resize request
        if (msg.width && msg.height) {
          figma.ui.resize(msg.width, msg.height);
        }
        break;  
      
      case 'create-event':
        // Criar novo evento de tracking
        try {
          // Primeiro verificar se o evento já existe
          const checkResult = await checkEventExists(msg.eventData);
          
          if (checkResult.exists) {
            // Se existe, enviar para a UI para confirmar
            figma.ui.postMessage({ 
              type: 'event-exists',
              existingEvent: checkResult.event
            });
            return;
          }
          
          // Se não existe, continuar com a criação
          const result = await createNewEvent(msg.eventData);
          if (!result.success) {
            throw new Error(result.message || "Falha ao salvar evento no Google Sheets");
          }
          
          // Usar o ID retornado do Google Sheets em vez de gerar um aleatório
          const eventId = result.event_id || generateEventId();
          
          // Se salvou com sucesso, criar o frame visual com o ID real
          const newFrame = await createEventFrame(eventId, msg.eventType || (msg.eventData && msg.eventData.event_name) || 'interaction');
          if (newFrame) {
            // Notificar a UI que o evento foi criado
            figma.ui.postMessage({ type: 'event-created' });
            figma.notify("Evento criado com sucesso!");
          }
        } catch (error: any) {
          console.error("Erro ao criar evento:", error);
          figma.notify(`Erro ao salvar evento: ${error.message || String(error)}`, {error: true});
          figma.ui.postMessage({ 
            type: 'error',
            message: `Falha ao salvar evento: ${error.message || String(error)}`
          });
        }
        break;
        
      case 'insert-existing-event':
        // Inserir um evento existente
        const insertedFrame = await createEventFrame(msg.eventId, msg.eventType);
        if (insertedFrame) {
          // Notificar a UI que o evento foi inserido
          figma.ui.postMessage({ type: 'event-inserted' });
          figma.notify("Evento existente inserido com sucesso!");
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
        
        // Log para debug do tipo de evento
        console.log(`Adicionando evento existente com tipo: ${msg.eventType || 'interaction'}`);
        
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
        
        try {
          // Criar frame com o ID do evento existente
          const existingFrame = await createEventFrame(
            msg.event.event_id.toString(), 
            msg.event.event_name || 'interaction'
          );
          
          if (existingFrame) {
            figma.notify(`Evento existente adicionado com sucesso!`);
            figma.ui.postMessage({ type: 'event-inserted' });
          }
        } catch (error: any) {
          console.error("Erro ao adicionar evento existente:", error);
          figma.notify(`Erro: ${error.message || String(error)}`, {error: true});
        }
        break;
        
      case 'create-anyway':
        try {
          // Continuar com a criação mesmo com duplicidade
          const result = await createNewEvent(msg.eventData);
          if (!result.success) {
            throw new Error(result.message || "Falha ao salvar evento no Google Sheets");
          }
          
          // Usar o ID retornado
          const eventId = result.event_id || generateEventId();
          
          // Criar o frame visual
          const newFrame = await createEventFrame(eventId, msg.eventType || (msg.eventData && msg.eventData.event_name) || 'interaction');
          if (newFrame) {
            figma.ui.postMessage({ type: 'event-created' });
            figma.notify("Novo evento criado com sucesso!");
          }
        } catch (error: any) {
          console.error("Erro ao criar evento:", error);
          figma.notify(`Erro: ${error.message || String(error)}`, {error: true});
        }
        break;
        
      case 'close-plugin':
        figma.closePlugin();
        break;
        
      default:
        console.log("Mensagem não reconhecida:", msg);
    }
  } catch (error: any) {
    console.error("Erro ao processar mensagem:", error);
    figma.ui.postMessage({
      type: 'error',
      message: error.message
    });
  }
};

// Função para formatar o ID do evento com padding de zeros
function formatEventIdWithPadding(id: string): string {
  const idStr = id.toString();
  if (idStr.length >= 3) return idStr;
  
  // Adicionar zeros à esquerda
  if (idStr.length === 1) return '00' + idStr;
  if (idStr.length === 2) return '0' + idStr;
  
  return idStr;
}
