# Sobre o Plugin
Tem o objetivo de facilitar e padronizar o mapeamento de eventos de tracking das telas do app Plusdin. Ele tem como foco principal automatizar a extração de informações sobre elementos interativos (botões, inputs, links, etc.), gerar identificadores padronizados e enviar essas informações automaticamente para uma planilha do Google Sheets.
O objetivo é garantir que toda nova tela ou alteração de UI feita pelo time de produto e design tenha o mapeamento de trackeamento definido e documentado de forma padronizada — sem esforço manual e com rastreabilidade completa.

# Abertura do Plugin
Ao abrir o plugin o usuário deverá ver 2 opções: Criar um novo evento ou Adicionar um evento existente. Ao selecionar uma opção o usuário deverá seguir para uma das duas funcionalidades. 

# **Funcionalidade 1:** Criar um novo evento

## 1. Exibir o formulário 
O plugin abre e apresenta a interface para o usuário exibindo um formulário parcialmente completo levando em consideração o componente que o usuário tem selecionado.

### Campos 
1. **Tipo de evento** *(select)*: Possui as opções 'interaction', 'app_screen_view', 'msg_view', 'answer_quiz', 'quiz_success', 'cta_click', 'ad_view' ou 'ad_click' na (planilha)[### Preencher a planilha] este campo preenche a coluna 'Event Name';
2. **Screen Name** *(Nome do frame principal)*: A ideia é que esse campo seja preenchido com o frame da tela em que o elemento selecionado se encontra. Por exemplo: se eu selecionei um card dentro do frame da home, o meu Screen Name deve ser Home;
3. **Screen Type** *(string)*: Campo aberto que virá vazio;
4. **Component** *(componente selecionado)*: Deverá trazer o nome do elemento selecionado naquele momento, ou seja, se eu selecionei um botão, este campo deverá ser preenchido com 'button';
5. **Element Text** *(string do componente formatada)*: Se o elemento selecionado tiver alguma layer de texto, esse campo deverá trazer o que está escrito no formato snake_case;
6. **Descrição** *(string)*: Text area com tamanho máximo de 300 caracteres que virá em branco.

### Requisitos 
* Todos as informações do formulário **exceto a descrição** devem ser escritos no formato snake case.
* Apesar de já virem preenchidos, todos os campos do formulário são editáveis e obrigatórios.

## 2. Preencher a planilha 
Após receber as informações do formulário, o plugin envia todas essas informações para uma planilha do Google Sheets, na qual seguirá a estrutura abaixo: 

| event_id | event_name | screen_name | screen_type | component | element_text | descrição | action | status |

Antes de preencher com os dados do formuário, o plugin precisa verificar se já existe um evento com o mesmo event_name, screen_name, screen_type, component e element_text. Caso exista, precisamos perguntar ao usuário se ele quer adicionar esse evento existente. Caso o usuário aceite, o frame será adicionado com o event_id do evento existente.

### Campos 
A partir do formulário preenchido, as informações deverão ser trazidas da seguinte forma: 
1. event_id = {*gerado automaticamente pelo plugin*}
2. event_name = Tipo de evento
3. screen_name = Screen Name
4. screen_type = Screen Type
5. component = Component
6. element_text = Element Text
7. descrição = Descrição
8. action = {*Se o event_name contém a palavra "view" a action será "view", caso contrário será "click"*}
9. status = "Ready for dev"

### Requisitos 
* O próprio plugin deve criar o event_id. O event_id é um ID sequencial, então o script deve ver qual é o último ID selecionado e criar a próxima linha com o número seguinte. 
* O event_id criado deve ser considerado na criação do frame no Figma.

## 3. Criar o frame no Figma 
Após incluir os dados na planilha do google sheets, o plugin deve inserir um frame arredondado com um texto com o event_id do evento criado. 

### Cores
Teremos cores de background diferentes para cada event_name, seguindo as regras abaixo: 
* interaction: #FFC700;
* app_screen_view: #00A3FF;
* msg_view: #EBFF00;
* answer_quiz: #D3AFEF;
* quiz_success:#FC82FF;
* cta_click: #FC82FF;
* ad_view: #82FF9D;
* ad_click: #26D14C.

### Requisitos
* É fundamental que o número dentro do frame seja o event_id do evento criado

# Funcionalidade 2: Adicionar um evento existente
## 1. Exibir a lista de trackings 
Ao selecionar essa opção, o usuário deve ver uma tabela com as mesmas colunas do google sheets com todos os eventos da planilha paginados de forma que ele consiga selecionar um dos eventos existentes e o event_id do evento selecionado seja incluido no canvas. 

### Requisitos 
* No topo da lisita precisaremos ter um campo de busca para facilitar a busca por event_id, screen_name ou screen_type.
* Caso seja necessário para melhorar a nossa performance, podemos fazer uma paginação na tabela. 

## 2. Criar o frame no Figma 
Após incluir os dados na planilha do google sheets, o plugin deve inserir um frame arredondado com um texto com o event_id do evento selecionado seguindo os mesmos padrões de cores descritos anteriormente. 

# Funcionalidades Adicionais Implementadas

## Formatação de ID
Os IDs de eventos são formatados para sempre terem pelo menos 3 dígitos, adicionando zeros à esquerda quando necessário. Por exemplo, o ID "1" é exibido como "001" e o ID "25" é exibido como "025".

## Detecção de Evento Duplicado
Quando o usuário tenta criar um evento com características que já existem na planilha (mesmo event_name, screen_name, screen_type, component e element_text), o plugin detecta essa duplicidade e exibe um diálogo com as seguintes opções:
1. **Usar Evento Existente**: Insere o ID do evento existente no canvas
2. **Criar Novo Mesmo Assim**: Ignora a duplicidade e cria um novo registro com um novo ID

Este diálogo exibe detalhes completos do evento duplicado para que o usuário possa tomar uma decisão informada.

## Busca com Autocomplete
A funcionalidade de busca de eventos existentes inclui:
- Busca em tempo real à medida que o usuário digita
- Autocomplete que mostra até 5 resultados mais relevantes
- Busca em todos os campos do evento (ID, nome, descrição, etc.)
- Visualização rápida dos detalhes principais do evento nos resultados

## Validação de Formulários
O plugin implementa validação de formulários que:
- Verifica se todos os campos obrigatórios foram preenchidos
- Destaca visualmente os campos com erro
- Impede o envio do formulário até que todos os erros sejam corrigidos
- Remove visualmente os erros quando o usuário começa a editar o campo

## Redimensionamento do Plugin
Um manipulador de redimensionamento no canto inferior direito permite ao usuário ajustar o tamanho da janela do plugin para acomodar mais informações ou economizar espaço na tela.

## Verificação Periódica de Seleção
O plugin verifica periodicamente a seleção atual do usuário no Figma (a cada 1 segundo) para atualizar automaticamente os campos do formulário com informações do elemento selecionado.

## Indicadores de Carregamento
Indicadores visuais de carregamento são exibidos durante operações assíncronas, como:
- Criação de um novo evento
- Carregamento da lista de eventos existentes
- Verificação de duplicidade de eventos
- Inserção de eventos existentes

## Estilos e Design
O plugin implementa um sistema de design tokens para consistência visual, incluindo:
- Cores e tipografia padronizadas
- Espaçamento consistente
- Estados interativos para botões e campos
- Feedback visual para ações do usuário
- Cores específicas para cada tipo de evento

## Navegação por Abas
O plugin permite navegar facilmente entre as duas funcionalidades principais usando um sistema de abas na parte superior da interface.

## Rastreamento de Modificações do Usuário
Os campos do formulário são marcados como "modificados pelo usuário" quando editados, garantindo que a seleção automática não substitua os dados já inseridos intencionalmente pelo usuário.

