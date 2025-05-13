// This plugin will create a circular frame with a user-defined number inside
// and log the number to a Google Sheet

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 300, height: 250 });

// Google Apps Script web app URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/a/macros/brius.com.br/s/AKfycbwrecOaPalyEH4iLeh4SPxOAKNgVnjdwthvY2oj-0Xpd3r84e8oSfuvJoQ9J2adtmOPIg/exec';

// Listen for messages from the UI
figma.ui.onmessage = async (msg: {type: string, number?: string, saveToSheet?: boolean}) => {
  if (msg.type === 'create-component') {
    try {
      // Get the number from the UI (with fallback to "000")
      const numberText = msg.number || "000";
      
      // Criar um frame em vez de um componente
      const frame = figma.createFrame();
      frame.name = "Event" + numberText;
      
      // Make it circular
      frame.resize(100, 100);
      frame.cornerRadius = 50; // Makes it a circle
      
      // Set background to blue
      frame.fills = [{
        type: 'SOLID',
        color: { r: 0/255, g: 149/255, b: 246/255 } // Azul da imagem de referência
      }];
      
      // Create text layer
      const text = figma.createText();
      
      // Load both font styles before setting text properties
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      await figma.loadFontAsync({ family: "Inter", style: "Bold" });
      
      // Set text properties with the user's number
      text.characters = numberText;
      text.fontSize = 32;
      text.fontName = { family: "Inter", style: "Bold" };
      text.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]; // Black text
      
      // Center text in the frame
      frame.appendChild(text);
      
      // Position text in center of frame
      text.x = (frame.width - text.width) / 2;
      text.y = (frame.height - text.height) / 2;
      
      // Position the frame in the viewport
      frame.x = figma.viewport.center.x - frame.width / 2;
      frame.y = figma.viewport.center.y - frame.height / 2;
      
      // Select the frame
      figma.currentPage.selection = [frame];
      figma.viewport.scrollAndZoomIntoView([frame]);
      
      // Salvar no Google Sheets se a opção estiver marcada
      if (msg.saveToSheet) {
        try {
          // Certifique-se de que temos permissão para acessar o currentUser
          if (!figma.currentUser) {
            figma.notify("Erro: Não foi possível obter informações do usuário. Verifique as permissões.", {error: true});
            throw new Error("Usuário não disponível - verifique permissões de currentuser no manifest.json");
          }
          
          // Obtém o nome do arquivo e do usuário
          const fileName = figma.root.name || "Sem nome";
          const userName = figma.currentUser.name || "Usuário desconhecido";
          
          // Data atual em formato ISO
          const currentDate = new Date().toISOString();
          
          console.log("Enviando dados para a planilha:", {
            number: numberText,
            fileName: fileName,
            userName: userName,
            date: currentDate
          });
          
          // Enviar dados para o Google Sheets via Apps Script
          const response = await fetch(`${GOOGLE_SCRIPT_URL}?number=${encodeURIComponent(numberText)}&fileName=${encodeURIComponent(fileName)}&userName=${encodeURIComponent(userName)}&date=${encodeURIComponent(currentDate)}`, {
            method: 'GET'
          });
          
          // Verificar se a resposta foi bem-sucedida
          if (!response.ok) {
            throw new Error(`Erro na resposta: ${response.status} ${response.statusText}`);
          }
          
          // Tenta analisar a resposta como JSON
          const responseData = await response.text();
          console.log("Resposta do servidor:", responseData);
          
          figma.notify(`Tracking "${numberText}" criado e registrado na planilha com sucesso!`);
        } catch (sheetError: any) {
          console.error('Erro ao salvar na planilha:', sheetError);
          figma.notify(`Frame criado, mas houve um erro ao salvar na planilha: ${sheetError.message}`, {error: true});
        }
      } else {
        figma.notify(`Tracking "${numberText}" criado com sucesso!`);
      }
    } catch (error: any) {
      // Mostrar o erro no console e notificar o usuário
      console.error('Erro ao criar frame:', error);
      figma.notify(`Erro: ${error.message}`, {error: true});
    } finally {
      // Feche o plugin após conclusão
      setTimeout(() => {
        figma.closePlugin();
      }, 2000); // Aguarde 2 segundos para que as notificações sejam vistas
    }
  }
};
