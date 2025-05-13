# Configuração da Planilha do Google Sheets

Para que o plugin de tracking funcione corretamente, você precisa criar e configurar uma planilha no Google Sheets seguindo estas instruções:

## 1. Criar a Planilha

1. Acesse [Google Sheets](https://sheets.google.com) e crie uma nova planilha
2. Renomeie a primeira aba para "Eventos" (este nome deve corresponder ao valor de `SHEET_NAME` no script)
3. Na primeira linha, adicione os seguintes cabeçalhos:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| **event_id** | **event_name** | **screen_name** | **screen_type** | **component** | **element_text** | **descrição** | **action** | **status** |

4. Formate a primeira linha (cabeçalho) para destacá-la (negrito, cor de fundo, etc.)
5. **Importante**: Mantenha a coluna A (event_id) como números inteiros sequenciais

## 2. Obter o ID da Planilha

O ID da planilha é a parte da URL entre `/d/` e `/edit`. Por exemplo:

```
https://docs.google.com/spreadsheets/d/1ABC123-exemplo-id-da-sua-planilha/edit#gid=0
                                      ↑                         ↑
                                      └─────── SHEET_ID ────────┘
```

Você precisará deste ID para configurar o Google Apps Script.

## 3. Configurar Permissões da Planilha

1. Clique no botão "Compartilhar" no canto superior direito
2. Configure o acesso adequado:
   - **Para desenvolvimento**: "Qualquer pessoa com o link" com acesso de editor
   - **Para produção**: Conceda acesso de editor apenas à conta que executará o Google Apps Script

## 4. Exemplo de Uso

Uma vez configurada, a planilha registrará os eventos de tracking desta forma:

| event_id | event_name | screen_name | screen_type | component | element_text | descrição | action | status |
|----------|------------|-------------|-------------|-----------|--------------|-----------|--------|--------|
| 1 | interaction | home | main | button | entrar | Botão de login na home | click | Ready for dev |
| 2 | app_screen_view | profile | user | frame | null | Visualização da tela de perfil | view | Ready for dev |
| 3 | cta_click | products | list | card | ver_detalhes | Card de produto na listagem | click | Ready for dev |

## 5. Manutenção

- **NÃO** exclua ou modifique os event_ids manualmente para manter a integridade
- Você pode adicionar novas colunas no final se precisar de campos extras (mas isso exigirá alterações no código)
- Recomenda-se criar fórmulas em outras abas para análises e relatórios, mantendo a aba principal apenas para dados brutos 