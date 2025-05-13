# Plugin de Tracking Plusdin

Este plugin para Figma permite criar e gerenciar rastreamentos de eventos de interação do usuário no app Plusdin. 

## Funcionalidades

1. **Criar novos eventos de tracking**
   - Extrai automaticamente informações do elemento selecionado
   - Gera IDs sequenciais
   - Registra eventos na planilha do Google
   - Cria frames visuais coloridos por tipo de evento

2. **Adicionar eventos existentes**
   - Navega e busca em eventos já cadastrados
   - Adiciona facilmente frames de eventos existentes aos designs

## Configuração

### 1. Google Apps Script

Para que o plugin funcione, você precisa configurar um Web App no Google Apps Script:

1. Crie uma nova planilha no Google Sheets com as seguintes colunas:
   - event_id
   - event_name
   - screen_name
   - screen_type
   - component
   - element_text
   - descrição
   - action
   - status

2. Acesse [Google Apps Script](https://script.google.com)
3. Crie um novo projeto
4. Adicione o código do arquivo `docs/google_apps_script.gs` ao seu projeto
5. Substitua o valor de `SHEET_ID` pelo ID da sua planilha
6. Implante o script como um Web App:
   - Clique em "Implantar" > "Novo Implantação"
   - Selecione "Web App"
   - Defina quem pode acessar (recomendado: "Qualquer pessoa")
   - Copie a URL gerada

### 2. Configuração do Plugin

1. No arquivo `code.ts`, substitua o valor de `GOOGLE_SCRIPT_URL` pela URL do Web App que você criou
2. Compile o plugin:
   ```
   npm install
   npm run build
   ```
3. Carregue o plugin no Figma:
   - Abra o Figma
   - Vá para Plugins > Desenvolvimento > Importar plugin do manifesto
   - Selecione o arquivo `manifest.json` do projeto

## Uso

### Criar novo evento

1. Selecione um elemento no Figma
2. Abra o plugin
3. Clique em "Criar novo evento"
4. Preencha o formulário (grande parte será preenchido automaticamente)
5. Clique em "Criar Evento"

### Adicionar evento existente

1. Abra o plugin
2. Clique em "Adicionar evento existente"
3. Utilize a busca para encontrar o evento desejado
4. Clique no evento para adicioná-lo ao canvas

## Estrutura do código

- `code.ts`: Código principal do plugin
- `ui.html`: Interface do usuário
- `manifest.json`: Configurações do plugin
- `docs/google_apps_script.gs`: Código para o Google Apps Script

## Customização de cores

As cores dos frames são definidas por tipo de evento no arquivo `code.ts`. Você pode personalizar as cores editando o objeto `EVENT_COLORS`. 