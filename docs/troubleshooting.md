# Solução de Problemas do Plugin Tracking Plusdin

Este guia ajuda a identificar e resolver problemas comuns encontrados durante o uso do plugin.

## Problemas de Extração de Informações

### Os campos não são preenchidos automaticamente

**Possíveis causas:**
1. Nenhum elemento está selecionado no Figma
2. O elemento selecionado não tem as propriedades esperadas
3. A comunicação entre o plugin e a UI está falhando

**Soluções:**
1. Selecione um elemento no Figma antes de abrir o plugin
2. Verifique no console do desenvolvedor (Console > Desenvolvimento > Abrir Console) se há mensagens indicando problemas
3. Veja se o elemento selecionado contém texto ou está dentro de um frame
4. Tente selecionar um elemento mais simples, como um botão ou texto

### Os dados extraídos estão incorretos

**Possíveis causas:**
1. A hierarquia do elemento no Figma não segue o padrão esperado
2. O nome do elemento ou frame não segue convenções claras

**Soluções:**
1. Nomeie os frames e componentes de forma clara e consistente
2. Verifique a hierarquia de frames no Figma
3. O plugin funciona melhor com componentes nomeados explicitamente (ex: "Button-Login")

## Problemas de Comunicação com Google Sheets

### O botão "Criar Evento" não faz nada

**Possíveis causas:**
1. A URL do Google Apps Script está incorreta
2. O Google Apps Script não está implementado corretamente
3. As permissões de CORS estão bloqueando as requisições
4. A planilha não existe ou está configurada incorretamente

**Soluções:**
1. Verifique no console do desenvolvedor se há erros de rede ou mensagens de erro
2. Confirme que a URL do Google Script no `code.ts` está correta
3. Confirme que o ID da planilha no Google Apps Script está correto
4. Teste o Google Apps Script diretamente no navegador para confirmar que está funcionando
5. Verifique as permissões de acesso à planilha

### Erros ao salvar eventos

**Possíveis causas:**
1. O formato dos dados enviados não corresponde ao esperado pelo Google Apps Script
2. A planilha não tem as colunas corretas
3. Problemas de rede ou timeout

**Soluções:**
1. Verifique se a sua planilha tem exatamente as colunas descritas na documentação
2. Confirme que você renomeou a aba para "Eventos" (ou atualize o SHEET_NAME no script)
3. Tente usar um ID de evento mais simples para teste
4. Verifique no console do desenvolvedor a resposta exata do servidor

## Problemas Gerais

### O plugin não abre ou trava

**Possíveis causas:**
1. Conflitos com outros plugins ou código
2. Erros no código do plugin

**Soluções:**
1. Feche e reabra o Figma
2. Verifique se você tem a versão mais recente do plugin
3. Tente remover e readicionar o plugin

### Erros de console

Se você encontrar erros no console de desenvolvedor, os mais comuns são:

1. **CORS errors**: Indica problemas com as permissões de domínio. Verifique as configurações de domínio no manifest.json
2. **Null object references**: Geralmente ocorre quando elementos DOM não estão sendo encontrados. Verifique os IDs no HTML
3. **JSON parsing errors**: Ocorre quando a resposta do servidor não é um JSON válido. Verifique o formato da resposta

## Ativando Logs Avançados

Para depuração avançada, ative todos os logs:

1. Abra o console do desenvolvedor no Figma (Plugins > Desenvolvimento > Abrir Console)
2. Digite o seguinte comando para ver todos os logs, incluindo de rede:
   ```
   localStorage.setItem('figma-plugin-debug', 'true');
   ```
3. Recarregue o plugin

## Verificação da Planilha

Se estiver enfrentando problemas com a planilha:

1. Confirme que a aba se chama "Eventos" exatamente
2. Verifique se as colunas estão na ordem correta
3. Tente adicionar uma linha manualmente para verificar se a estrutura está correta
4. Confira se você tem permissões de edição na planilha

## Suporte

Se você continuar enfrentando problemas após tentar estas soluções, por favor entre em contato com o suporte do plugin com as seguintes informações:

1. Print do erro no console
2. Descrição exata do que você estava fazendo
3. Tipo de elemento que estava selecionado
4. Versão do Figma que está usando 