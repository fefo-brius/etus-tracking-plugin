// Plugin para rastreamento de eventos do app Plusdin
// Permite criar novos eventos de rastreamento ou adicionar eventos existentes
// com registros em uma planilha Google Sheets
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).
// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 400, height: 550, themeColors: true });
// Google Apps Script web app URL
var GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby29g4wMjqRFcjGgIBFZLOn3rp4HU8xpgt9OJ2nvv_2LFmabiIBvJI5EdkEP9TKcIZ_Bg/exec';
// Cores para diferentes tipos de eventos (valores hexadecimais)
var EVENT_COLOR_HEX = {
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
function hexToRgb(hex) {
    // Remover o # se existir
    hex = hex.replace(/^#/, '');
    // Converter para RGB
    var bigint = parseInt(hex, 16);
    var r = ((bigint >> 16) & 255) / 255;
    var g = ((bigint >> 8) & 255) / 255;
    var b = (bigint & 255) / 255;
    return { r: r, g: g, b: b };
}
// Converter cores hex para o formato RGB do Figma
var EVENT_COLORS = {};
for (var key in EVENT_COLOR_HEX) {
    if (EVENT_COLOR_HEX.hasOwnProperty(key)) {
        var hexValue = EVENT_COLOR_HEX[key];
        EVENT_COLORS[key] = hexToRgb(hexValue);
    }
}
// Lista de tipos de eventos disponíveis
var EVENT_TYPES = [
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
function toSnakeCase(text) {
    if (!text)
        return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w_]/g, '')
        .replace(/__+/g, '_');
}
// Carregar fontes necessárias
function loadRequiredFonts() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, figma.loadFontAsync({ family: "Arial", style: "Bold" })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, figma.loadFontAsync({ family: "Arial", style: "Regular" })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    error_1 = _a.sent();
                    console.error("Erro ao carregar fontes:", error_1);
                    figma.notify("Erro ao carregar fontes necessárias", { error: true });
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Função para obter informações do elemento selecionado
function getSelectionInfo() {
    var selection = figma.currentPage.selection;
    if (!selection || selection.length === 0) {
        return null;
    }
    var selectedNode = selection[0];
    if (!selectedNode) {
        return null;
    }
    var elementText = '';
    var parentFrameName = '';
    var nodeType = selectedNode.type ? selectedNode.type.toLowerCase() : 'desconhecido';
    // Tenta extrair texto do nó
    if (selectedNode.type === 'TEXT') {
        try {
            elementText = selectedNode.characters || '';
        }
        catch (e) {
            elementText = '';
        }
    }
    else {
        // Procura por nós de texto dentro do nó selecionado
        if (typeof selectedNode.findAll === 'function') {
            try {
                var textNodes = selectedNode.findAll(function (node) { return node && node.type === 'TEXT'; }) || [];
                if (textNodes.length > 0) {
                    elementText = textNodes
                        .map(function (node) { return node ? (node.characters || '') : ''; })
                        .filter(function (text) { return text; })
                        .join(' ');
                }
            }
            catch (error) {
                console.error("Erro ao buscar nós de texto:", error);
            }
        }
    }
    // Encontra o frame pai
    var parent = selectedNode.parent;
    while (parent) {
        if (parent.type === 'FRAME' || parent.type === 'COMPONENT' || parent.type === 'INSTANCE') {
            parentFrameName = parent.name || '';
            break;
        }
        parent = parent.parent;
    }
    // Infere o tipo de componente com base no tipo do nó ou nome
    var componentType = nodeType;
    var nodeName = (selectedNode.name || '').toLowerCase();
    if (nodeName.includes('button') || nodeName.includes('botão')) {
        componentType = 'button';
    }
    else if (nodeName.includes('input') || nodeName.includes('field')) {
        componentType = 'input';
    }
    else if (nodeName.includes('card')) {
        componentType = 'card';
    }
    else if (nodeName.includes('link')) {
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
function createEventFrame(eventId, eventType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Verificar parâmetros
            if (!eventId) {
                figma.notify("Erro: ID do evento inválido ou vazio", { error: true });
                return null;
            }
            
            // Log para debug
            console.log(`Criando frame para evento ${eventId} do tipo: ${eventType}`);
            
            // Carregar fontes necessárias antes de criar texto
            yield loadRequiredFonts();
            
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
            function calculateFontSize(id) {
                const length = id.length;
                if (length <= 3)
                    return 28;
                if (length <= 5)
                    return 20;
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
            }
            else {
                frame.x = figma.viewport.center.x - frame.width / 2;
                frame.y = figma.viewport.center.y - frame.height / 2;
            }
            
            // Selecionar o frame
            figma.currentPage.selection = [frame];
            figma.viewport.scrollAndZoomIntoView([frame]);
            
            figma.notify(`Frame para evento ${eventId} criado com sucesso!`);
            return frame;
        }
        catch (error) {
            console.error('Erro ao criar frame:', error);
            figma.notify(`Erro ao criar frame: ${error}`, { error: true });
            return null;
        }
    });
}
// Função para verificar duplicidade de evento
function checkEventExists(eventData) {
    return __awaiter(this, void 0, void 0, function () {
        var queryParams, url, response, result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    queryParams = [
                        "action=check",
                        "event_name=".concat(encodeURIComponent(eventData.event_name)),
                        "screen_name=".concat(encodeURIComponent(eventData.screen_name)),
                        "screen_type=".concat(encodeURIComponent(eventData.screen_type)),
                        "component=".concat(encodeURIComponent(eventData.component)),
                        "element_text=".concat(encodeURIComponent(eventData.element_text))
                    ].join('&');
                    url = "".concat(GOOGLE_SCRIPT_URL, "?").concat(queryParams);
                    return [4 /*yield*/, fetch(url, { method: 'GET', cache: 'no-cache' })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Erro HTTP: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 3:
                    error_3 = _a.sent();
                    console.error("Erro ao verificar evento:", error_3);
                    return [2 /*return*/, { exists: false, error: true }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Função para criar um novo evento
function createNewEvent(eventData) {
    return __awaiter(this, void 0, void 0, function () {
        var action, queryParams, url, response, result, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    action = eventData.event_name.includes('view') ? 'view' : 'click';
                    queryParams = [
                        "action=create",
                        "event_name=".concat(encodeURIComponent(eventData.event_name)),
                        "screen_name=".concat(encodeURIComponent(eventData.screen_name)),
                        "screen_type=".concat(encodeURIComponent(eventData.screen_type)),
                        "component=".concat(encodeURIComponent(eventData.component)),
                        "element_text=".concat(encodeURIComponent(eventData.element_text)),
                        "descricao=".concat(encodeURIComponent(eventData.descricao)),
                        "action=".concat(encodeURIComponent(action))
                    ].join('&');
                    url = "".concat(GOOGLE_SCRIPT_URL, "?").concat(queryParams);
                    return [4 /*yield*/, fetch(url, { method: 'GET', cache: 'no-cache' })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Erro HTTP: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    result = _a.sent();
                    if (!result.success) {
                        throw new Error(result.message || "Erro desconhecido");
                    }
                    return [2 /*return*/, result];
                case 3:
                    error_4 = _a.sent();
                    console.error("Erro ao criar evento:", error_4);
                    throw error_4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Função para obter lista de eventos existentes
function getExistingEvents() {
    return __awaiter(this, void 0, void 0, function () {
        var url, response, result, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    url = "".concat(GOOGLE_SCRIPT_URL, "?action=list");
                    return [4 /*yield*/, fetch(url, { method: 'GET', cache: 'no-cache' })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Erro HTTP: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, result];
                case 3:
                    error_5 = _a.sent();
                    console.error("Erro ao listar eventos:", error_5);
                    throw error_5;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Enviar informações da seleção para a UI quando o plugin inicia
var selectionInfo = getSelectionInfo();
figma.ui.postMessage({
    type: 'selection-info',
    info: selectionInfo
});
// Função para gerar um ID de evento
function generateEventId() {
    // Gera um número aleatório entre 1 e 999
    return Math.floor(Math.random() * 999 + 1).toString();
}
// Ouvir mensagens da UI
figma.ui.onmessage = function (msg) {
    return __awaiter(this, void 0, void 0, function* () {
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
                        const checkResult = yield checkEventExists(msg.eventData);
                        
                        if (checkResult.exists) {
                            // Se existe, enviar para a UI para confirmar
                            figma.ui.postMessage({ 
                                type: 'event-exists',
                                existingEvent: checkResult.event
                            });
                            return;
                        }
                        
                        // Se não existe, continuar com a criação
                        const result = yield createNewEvent(msg.eventData);
                        if (!result.success) {
                            throw new Error(result.message || "Falha ao salvar evento no Google Sheets");
                        }
                        
                        // Usar o ID retornado do Google Sheets em vez de gerar um aleatório
                        const eventId = result.event_id || generateEventId();
                        
                        // Se salvou com sucesso, criar o frame visual com o ID real
                        const frame = yield createEventFrame(eventId, msg.eventType || (msg.eventData && msg.eventData.event_name) || 'interaction');
                        if (frame) {
                            // Notificar a UI que o evento foi criado
                            figma.ui.postMessage({ type: 'event-created' });
                            figma.notify("Evento criado com sucesso!");
                        }
                    } catch (error) {
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
                    const existingFrame = yield createEventFrame(msg.eventId, msg.eventType);
                    if (existingFrame) {
                        // Notificar a UI que o evento foi inserido
                        figma.ui.postMessage({ type: 'event-inserted' });
                        figma.notify("Evento existente inserido com sucesso!");
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
                        const existingFrame = yield createEventFrame(
                            msg.event.event_id.toString(), 
                            msg.event.event_name || 'interaction'
                        );
                        
                        if (existingFrame) {
                            figma.notify(`Evento existente adicionado com sucesso!`);
                            figma.ui.postMessage({ type: 'event-inserted' });
                        }
                    } catch (error) {
                        console.error("Erro ao adicionar evento existente:", error);
                        figma.notify(`Erro: ${error.message || String(error)}`, {error: true});
                    }
                    break;
                case 'create-anyway':
                    try {
                        // Continuar com a criação mesmo com duplicidade
                        const result = yield createNewEvent(msg.eventData);
                        if (!result.success) {
                            throw new Error(result.message || "Falha ao salvar evento no Google Sheets");
                        }
                        
                        // Usar o ID retornado
                        const eventId = result.event_id || generateEventId();
                        
                        // Criar o frame visual
                        const frame = yield createEventFrame(eventId, msg.eventType || (msg.eventData && msg.eventData.event_name) || 'interaction');
                        if (frame) {
                            figma.ui.postMessage({ type: 'event-created' });
                            figma.notify("Novo evento criado com sucesso!");
                        }
                    } catch (error) {
                        console.error("Erro ao criar evento:", error);
                        figma.notify(`Erro: ${error.message || String(error)}`, {error: true});
                    }
                    break;
                default:
                    console.log("Mensagem não reconhecida:", msg);
            }
        }
        catch (error) {
            console.error("Erro ao processar mensagem:", error);
            figma.ui.postMessage({
                type: 'error',
                message: error.message
            });
        }
    });
};
// Função para formatar o ID do evento com padding de zeros
function formatEventIdWithPadding(id) {
    const idStr = id.toString();
    if (idStr.length >= 3) return idStr;
    
    // Adicionar zeros à esquerda
    if (idStr.length === 1) return '00' + idStr;
    if (idStr.length === 2) return '0' + idStr;
    
    return idStr;
}
