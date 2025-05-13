"use strict";
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
// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).
// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 400, height: 550 });
// Google Apps Script web app URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby29g4wMjqRFcjGgIBFZLOn3rp4HU8xpgt9OJ2nvv_2LFmabiIBvJI5EdkEP9TKcIZ_Bg/exec';
// Cores para diferentes tipos de eventos
const EVENT_COLORS = {
    interaction: { r: 255 / 255, g: 199 / 255, b: 0 / 255 }, // #FFC700
    app_screen_view: { r: 0 / 255, g: 163 / 255, b: 255 / 255 }, // #00A3FF
    msg_view: { r: 235 / 255, g: 255 / 255, b: 0 / 255 }, // #EBFF00
    answer_quiz: { r: 211 / 255, g: 175 / 255, b: 239 / 255 }, // #D3AFEF
    quiz_success: { r: 252 / 255, g: 130 / 255, b: 255 / 255 }, // #FC82FF
    cta_click: { r: 252 / 255, g: 130 / 255, b: 255 / 255 }, // #FC82FF
    ad_view: { r: 130 / 255, g: 255 / 255, b: 157 / 255 }, // #82FF9D
    ad_click: { r: 38 / 255, g: 209 / 255, b: 76 / 255 } // #26D14C
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
// Flag para controlar se as fontes já foram carregadas
let fontsLoaded = false;
// Lista de fontes necessárias - usando Arial em vez de Inter
const REQUIRED_FONTS = [
    { family: "Arial", style: "Regular" },
    { family: "Arial", style: "Bold" }
];
// Função para carregar fontes necessárias - versão melhorada com garantias de sucesso
function loadRequiredFonts() {
    return __awaiter(this, void 0, void 0, function* () {
        if (fontsLoaded) {
            console.log("Fontes já foram carregadas anteriormente");
            return true;
        }
        console.log("Iniciando carregamento de fontes...");
        // Tenta carregar cada fonte com até 3 tentativas por fonte
        for (const font of REQUIRED_FONTS) {
            let loaded = false;
            let attempts = 0;
            while (!loaded && attempts < 3) {
                attempts++;
                try {
                    console.log(`Tentativa ${attempts} de carregar fonte: ${font.family} ${font.style}`);
                    yield figma.loadFontAsync(font);
                    loaded = true;
                    console.log(`Fonte ${font.family} ${font.style} carregada com sucesso`);
                }
                catch (error) {
                    console.error(`Falha ao carregar fonte (tentativa ${attempts}):`, font, error);
                    if (attempts >= 3) {
                        figma.notify(`Erro ao carregar fonte ${font.family} ${font.style}. Algumas operações podem falhar.`, { error: true });
                        return false;
                    }
                    // Espera um pouco antes da próxima tentativa
                    yield new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }
        console.log("Todas as fontes foram carregadas com sucesso");
        fontsLoaded = true;
        return true;
    });
}
// Carregar fontes logo no início do plugin - executar imediatamente
loadRequiredFonts().then(() => {
    console.log("Inicialização de fontes concluída");
});
// Função para obter informações do elemento selecionado
function getSelectionInfo() {
    const selection = figma.currentPage.selection;
    console.log("Seleção atual:", selection);
    if (!selection || selection.length === 0) {
        console.log("Nenhum elemento selecionado");
        return null;
    }
    const selectedNode = selection[0];
    if (!selectedNode) {
        console.log("Nó selecionado é nulo");
        return null;
    }
    let elementText = '';
    let parentFrameName = '';
    let nodeType = selectedNode.type ? selectedNode.type.toLowerCase() : 'desconhecido';
    console.log("Nó selecionado:", selectedNode.name || 'Sem nome', selectedNode.type);
    // Tenta extrair texto do nó
    if (selectedNode.type === 'TEXT') {
        try {
            elementText = selectedNode.characters || '';
        }
        catch (e) {
            console.error("Erro ao acessar caracteres do nó de texto:", e);
            elementText = '';
        }
        console.log("Texto extraído diretamente:", elementText);
    }
    else {
        // Procura por nós de texto dentro do nó selecionado
        const hasFindAll = typeof selectedNode.findAll === 'function';
        console.log("O nó tem método findAll?", hasFindAll);
        if (hasFindAll) {
            try {
                const textNodes = selectedNode.findAll((node) => node && node.type === 'TEXT') || [];
                console.log("Nós de texto encontrados:", textNodes.length);
                if (textNodes.length > 0) {
                    elementText = textNodes
                        .map((node) => {
                        try {
                            return node ? (node.characters || '') : '';
                        }
                        catch (e) {
                            console.error("Erro ao acessar caracteres:", e);
                            return '';
                        }
                    })
                        .filter((text) => text)
                        .join(' ');
                    console.log("Texto extraído dos nós filhos:", elementText);
                }
            }
            catch (error) {
                console.error("Erro ao buscar nós de texto:", error);
            }
        }
        else {
            console.log("O nó não suporta findAll para buscar texto interno");
        }
    }
    // Encontra o frame pai
    let parent = selectedNode.parent;
    let parentPath = [];
    while (parent) {
        try {
            parentPath.push(parent.type + ": " + (parent.name || 'Sem nome'));
            if (parent.type === 'FRAME' || parent.type === 'COMPONENT' || parent.type === 'INSTANCE') {
                parentFrameName = parent.name || '';
                break;
            }
            parent = parent.parent;
        }
        catch (e) {
            console.error("Erro ao acessar propriedades do pai:", e);
            break;
        }
    }
    console.log("Caminho de parentesco:", parentPath);
    console.log("Frame pai encontrado:", parentFrameName);
    // Infere o tipo de componente com base no tipo do nó ou nome
    let componentType = nodeType;
    const nodeName = (selectedNode.name || '').toLowerCase();
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
    const result = {
        nodeName: selectedNode.name || 'Sem nome',
        nodeType: nodeType,
        elementText: elementText ? toSnakeCase(elementText) : '',
        parentFrame: parentFrameName || 'Sem frame pai',
        componentType: componentType
    };
    console.log("Informações extraídas:", result);
    return result;
}
// Enviar informações da seleção para a UI quando o plugin inicia
const selectionInfo = getSelectionInfo();
console.log("Enviando informações iniciais para a UI:", selectionInfo);
figma.ui.postMessage({
    type: 'selection-info',
    info: selectionInfo
});
// Função para criar o frame com o ID do evento - Solução SEM TEXTO
function createEventFrame(eventId, eventType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Verificar parâmetros
            if (!eventId) {
                console.error("ID do evento inválido:", eventId);
                figma.notify("Erro: ID do evento inválido ou vazio", { error: true });
                return null;
            }
            if (!eventType) {
                console.warn("Tipo de evento não especificado, usando padrão 'interaction'");
                eventType = 'interaction';
            }
            console.log("Criando frame para evento:", eventId, "tipo:", eventType);

            // Carregar fontes necessárias antes de criar texto - Adicionado de volta
            const fontsAreLoaded = yield loadRequiredFonts();
            if (!fontsAreLoaded) {
                figma.notify("Fontes necessárias não puderam ser carregadas. O texto pode não aparecer.", { error: true });
                // Optionally, you could decide to not create the frame or use a fallback
            }

            // Criar um frame
            const frame = figma.createFrame();
            frame.name = `Event-${eventId} [${eventType}]`;
            // Definir tamanho e forma
            frame.resize(80, 80);
            frame.cornerRadius = 40; // Torna circular
            // Definir cor de fundo com base no tipo de evento
            const colorKey = eventType;
            frame.fills = [{
                    type: 'SOLID',
                    color: EVENT_COLORS[colorKey] || EVENT_COLORS.interaction // Cor padrão se não encontrar
                }];

            // Criar texto com o eventId - Lógica restaurada e modificada do code.ts
            const textNode = figma.createText();
            try {
                textNode.fontName = { family: "Arial", style: "Bold" }; // Certifique-se que esta fonte está carregada
                textNode.characters = eventId; // Alterado de "OOO" para eventId
                textNode.fontSize = calculateFontSize(eventId); // Ajustar dinamicamente
                textNode.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; // Preto
                
                // Centralizar texto
                textNode.textAlignHorizontal = 'CENTER';
                textNode.textAlignVertical = 'CENTER';
                
                // Ajustar tamanho e posicionar texto no centro
                textNode.resize(60, 40); // Ajuste o tamanho conforme necessário
                textNode.x = (frame.width - textNode.width) / 2;
                textNode.y = (frame.height - textNode.height) / 2;
                
                // Adicionar o texto ao frame
                frame.appendChild(textNode);
                console.log("Nó de texto criado e adicionado ao frame com eventId:", eventId);
            } catch (textError) {
                console.error("Erro ao criar ou configurar o nó de texto:", textError);
                figma.notify("Erro ao criar texto para o frame. Verifique se as fontes estão carregadas.", { error: true });
            }

            // Função auxiliar para calcular o tamanho da fonte
            function calculateFontSize(id) {
                const length = id.toString().length;
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
            }
            else {
                frame.x = figma.viewport.center.x - frame.width / 2;
                frame.y = figma.viewport.center.y - frame.height / 2;
            }
            // Selecionar o frame
            figma.currentPage.selection = [frame];
            figma.viewport.scrollAndZoomIntoView([frame]);
            console.log("Frame criado com sucesso:", frame.id);
            figma.notify(`Frame para evento ${eventId} criado com sucesso!`);
            return frame;
        }
        catch (error) {
            console.error('Erro ao criar frame:', error);
            figma.notify(`Erro ao criar frame: ${error.message}`, { error: true });
            return null;
        }
    });
}
// Ouvir mensagens da UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Mensagem recebida da UI:", msg);
    try {
        if (msg.type === 'check-selection') {
            // Enviar informações atualizadas da seleção para a UI
            const currentSelection = getSelectionInfo();
            console.log("Enviando atualização de seleção para a UI:", currentSelection);
            figma.ui.postMessage({
                type: 'selection-info',
                info: currentSelection
            });
        }
        else if (msg.type === 'create-event') {
            console.log("Iniciando criação de evento com dados:", msg.eventData);
            // Cria um novo evento a partir do formulário
            if (!msg.eventData) {
                figma.notify("Dados do evento não recebidos", { error: true });
                return;
            }
            // Validar dados do evento
            const eventData = msg.eventData;
            // Certificar-se de que todos os campos obrigatórios estão presentes
            const requiredFields = ['event_name', 'screen_name', 'screen_type', 'component', 'element_text', 'descricao'];
            for (const field of requiredFields) {
                if (!eventData[field]) {
                    figma.notify(`Campo obrigatório não preenchido: ${field}`, { error: true });
                    return;
                }
            }
            // Certifique-se de que temos permissão para acessar o currentUser
            if (!figma.currentUser) {
                figma.notify("Erro: Não foi possível obter informações do usuário. Verifique as permissões.", { error: true });
                throw new Error("Usuário não disponível - verifique permissões de currentuser no manifest.json");
            }
            try {
                // Determinar a ação com base no nome do evento
                const action = (eventData.event_name || '').includes('view') ? 'view' : 'click';
                // Vamos criar o evento diretamente sem verificar duplicatas
                console.log("Criando evento diretamente no Google Sheets...");
                // Construir URL para criar evento
                const createUrl = `${GOOGLE_SCRIPT_URL}?action=create&event_name=${encodeURIComponent(eventData.event_name)}&screen_name=${encodeURIComponent(eventData.screen_name)}&screen_type=${encodeURIComponent(eventData.screen_type)}&component=${encodeURIComponent(eventData.component)}&element_text=${encodeURIComponent(eventData.element_text)}&descricao=${encodeURIComponent(eventData.descricao)}&action=${encodeURIComponent(action)}`;
                console.log("URL de criação:", createUrl);
                // Usando fetch com tratamento de erro robusto
                console.log("Iniciando requisição fetch...");
                let response;
                try {
                    response = yield fetch(createUrl, {
                        method: 'GET',
                        cache: 'no-cache'
                    });
                    console.log("Resposta da requisição:", response.status, response.statusText);
                }
                catch (networkError) {
                    console.error("Erro de rede na requisição:", networkError);
                    figma.notify("Erro de conexão. Verifique a URL e a conexão de rede.", { error: true });
                    // Tentar criar o frame mesmo assim como fallback
                    console.log("Criando frame de teste devido a erro de conexão");
                    yield createEventFrame("TEST", eventData.event_name);
                    figma.notify("Frame de teste criado, mas falha ao conectar à planilha.", { error: true });
                    return;
                }
                if (!response || !response.ok) {
                    console.error("Erro HTTP:", response ? `${response.status} ${response.statusText}` : "Resposta nula");
                    figma.notify(`Erro HTTP: ${response ? `${response.status} ${response.statusText}` : "Resposta inválida"}`, { error: true });
                    // Tentar criar o frame mesmo assim como fallback
                    console.log("Criando frame de teste devido a erro HTTP");
                    yield createEventFrame("TEST", eventData.event_name);
                    figma.notify("Frame de teste criado, mas erro ao comunicar com planilha.", { error: true });
                    return;
                }
                // Obter e processar a resposta
                console.log("Lendo resposta do servidor...");
                let responseText = "";
                try {
                    responseText = yield response.text();
                    console.log("Resposta texto:", responseText);
                }
                catch (readError) {
                    console.error("Erro ao ler resposta:", readError);
                    figma.notify("Erro ao ler resposta do servidor.", { error: true });
                    // Tentar criar o frame mesmo assim como fallback
                    console.log("Criando frame de teste devido a erro de leitura");
                    yield createEventFrame("TEST", eventData.event_name);
                    figma.notify("Frame de teste criado, mas erro ao ler resposta.", { error: true });
                    return;
                }
                // Verificar se a resposta está vazia
                if (!responseText || responseText.trim() === '') {
                    console.error("Resposta vazia do servidor");
                    figma.notify("Resposta vazia do servidor.", { error: true });
                    // Tentar criar o frame mesmo assim como fallback
                    console.log("Criando frame de teste devido a resposta vazia");
                    yield createEventFrame("TEST", eventData.event_name);
                    figma.notify("Frame de teste criado, mas resposta vazia do servidor.", { error: true });
                    return;
                }
                // Processar resposta JSON
                let result;
                try {
                    result = JSON.parse(responseText);
                    console.log("Resposta parseada:", result);
                }
                catch (parseError) {
                    console.error("Erro ao parsear JSON:", parseError, "Texto:", responseText);
                    figma.notify("Resposta inválida do servidor.", { error: true });
                    // Tentar criar o frame mesmo assim como fallback
                    console.log("Criando frame de teste devido a erro de formato");
                    yield createEventFrame("TEST", eventData.event_name);
                    figma.notify("Frame de teste criado, mas formato de resposta inválido.", { error: true });
                    return;
                }
                // Verificar sucesso
                if (!result || !result.success) {
                    const errorMsg = (result && result.message) ? result.message : "Erro desconhecido ao salvar na planilha";
                    console.error("Erro retornado pelo servidor:", errorMsg);
                    figma.notify(`Erro: ${errorMsg}`, { error: true });
                    // Tentar criar o frame mesmo assim como fallback
                    console.log("Criando frame de teste devido a erro de resultado");
                    yield createEventFrame("TEST", eventData.event_name);
                    figma.notify("Frame de teste criado, mas erro no processamento.", { error: true });
                    return;
                }
                // Verificar se o ID do evento foi retornado
                if (!result.event_id) {
                    console.error("ID do evento não retornado pelo servidor");
                    figma.notify("Erro: ID do evento não retornado.", { error: true });
                    // Tentar criar o frame mesmo assim como fallback
                    console.log("Criando frame de teste devido a falta de ID");
                    yield createEventFrame("TEST", eventData.event_name);
                    figma.notify("Frame de teste criado, mas ID não retornado.", { error: true });
                    return;
                }
                // Sucesso! Criar frame com o ID retornado
                console.log("Sucesso! Criando frame com ID:", result.event_id);
                const frame = yield createEventFrame(result.event_id.toString(), eventData.event_name);
                if (frame) {
                    figma.notify(`Evento ${result.event_id} criado e registrado com sucesso!`);
                }
                else {
                    figma.notify("Evento registrado, mas houve problema ao criar o frame visual.", { error: true });
                }
            }
            catch (error) {
                console.error("Erro geral na operação:", error);
                figma.notify(`Erro: ${error.message || 'Erro desconhecido'}`, { error: true });
                // Enviar erro para a UI
                figma.ui.postMessage({
                    type: 'error',
                    message: error.message || 'Erro desconhecido'
                });
                // Tentar criar frame de teste como último recurso
                try {
                    console.log("Tentando criar frame de teste como último recurso");
                    yield createEventFrame("ERROR", eventData.event_name || 'error');
                    figma.notify("Frame de teste criado devido a erro geral.", { error: true });
                }
                catch (frameError) {
                    console.error("Falha até mesmo ao criar frame de teste:", frameError);
                }
            }
        }
        else if (msg.type === 'use-existing-event') {
            // Adiciona um frame com o ID do evento existente
            if (!msg.event) {
                figma.notify("Dados do evento não recebidos", { error: true });
                return;
            }
            // Verificar se o evento tem um ID
            if (!msg.event.event_id) {
                figma.notify("Evento sem ID válido", { error: true });
                return;
            }
            const frame = yield createEventFrame(msg.event.event_id.toString(), msg.event.event_name || 'event');
            if (frame) {
                figma.notify(`Frame para evento existente ${msg.event.event_id} adicionado!`);
            }
            else {
                figma.notify("Erro ao criar frame para evento existente.", { error: true });
            }
        }
        else if (msg.type === 'list-events') {
            // Obter lista de eventos da planilha
            try {
                const response = yield fetch(`${GOOGLE_SCRIPT_URL}?action=list`, {
                    method: 'GET'
                });
                if (!response || !response.ok) {
                    throw new Error(`Erro na resposta: ${response ? `${response.status} ${response.statusText}` : "Resposta inválida"}`);
                }
                const responseText = yield response.text();
                if (!responseText || responseText.trim() === '') {
                    throw new Error("Resposta vazia do servidor");
                }
                let events;
                try {
                    events = JSON.parse(responseText);
                }
                catch (e) {
                    throw new Error("Formato de resposta inválido");
                }
                // Enviar lista de eventos para a UI
                figma.ui.postMessage({
                    type: 'events-list',
                    events: events || []
                });
            }
            catch (error) {
                console.error('Erro ao obter lista de eventos:', error);
                figma.notify(`Erro ao obter lista de eventos: ${error.message || 'Erro desconhecido'}`, { error: true });
                // Enviar erro para a UI
                figma.ui.postMessage({
                    type: 'events-list-error',
                    error: error.message || 'Erro desconhecido'
                });
            }
        }
        else if (msg.type === 'add-existing-event') {
            // Adicionar frame com ID de evento existente
            if (!msg.eventId) {
                figma.notify("ID do evento não recebido", { error: true });
                return;
            }
            const frame = yield createEventFrame(msg.eventId.toString(), msg.eventType || 'event');
            if (frame) {
                figma.notify(`Frame para evento ${msg.eventId} adicionado com sucesso!`);
            }
            else {
                figma.notify("Erro ao criar frame para evento.", { error: true });
            }
        }
        else if (msg.type === 'close-plugin') {
            figma.closePlugin();
        }
    }
    catch (error) {
        console.error('Erro:', error);
        figma.notify(`Erro: ${error.message}`, { error: true });
        // Enviar erro para a UI
        figma.ui.postMessage({
            type: 'error',
            message: error.message
        });
    }
});
