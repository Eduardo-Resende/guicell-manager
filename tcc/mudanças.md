# Mudanças em Relação ao TCC Original

Este documento registra todas as alterações, adaptações e melhorias de escopo realizadas no Guicell Manager em relação ao documento original do TCC (`TCC_I_Guicell_Manager.docx`).

---

## 1. Código de Barras
- Adicionado o campo `codigo_barras` na tabela `produtos` e suporte a leitura/busca rápida no PDV (Vendas) e Estoque.

## 2. Nova Estrutura Relacional de Categorias e Subcategorias
- **O que mudou**: A especificação do TCC previa apenas um campo texto `categoria` dentro da tabela `produtos` (Tabela 9).
- **Implementação**: Foi criada uma tabela própria `categorias` com auto-relacionamento (`id_pai`), permitindo criar uma árvore hierárquica infinita de categorias e subcategorias.

## 3. Destino de Uso das Categorias (`tipo_uso`)
- **O que mudou**: Adicionado um controle para definir se os produtos daquela categoria pertencem ao PDV, ao módulo de Ordens de Serviço (OS), ou a ambos.
- **Implementação**: Campo `tipo_uso` (ENUM: `'Venda'`, `'OS'`, `'Ambos'`) adicionado à tabela `categorias`. O PDV filtra e exibe apenas produtos de venda/ambos, e o módulo de OS filtra apenas peças/ambos.

## 4. Reuso de Aparelhos no Cadastro de Ordens de Serviço
- **O que mudou**: No fluxo original, abrir uma OS exigia sempre preencher novos dados de aparelho.
- **Implementação**: Adicionado um seletor inteligente na abertura de OS que lista os aparelhos já cadastrados do cliente selecionado. Se o aparelho for o mesmo de um serviço anterior, o usuário pode apenas selecioná-lo, evitando duplicação e facilitando o histórico de reparos do aparelho.

## 5. Normalização de IMEI Opcional (Permitir múltiplos aparelhos sem IMEI)
- **O que mudou**: A tabela `aparelhos` possuía uma chave UNIQUE para a coluna `imei` (Tabela 6), o que impedia cadastrar mais de um celular sem IMEI (pois strings vazias `""` colidiam no banco de dados).
- **Implementação**: Ajustado o backend para normalizar campos vazios de IMEI convertendo-os em `NULL`. No MySQL/Sequelize, valores `NULL` não colidem em constraints UNIQUE, permitindo criar múltiplos aparelhos sem IMEI sem gerar erro de conflito.

## 6. Edição de Usuários (RF12)
- **O que mudou**: O TCC previa cadastro e gerenciamento.
- **Implementação**: Adicionado suporte completo a edição de dados cadastrais (Nome, Login de usuário e Perfil) dos colaboradores.

## 7. Salvamento de Peças em OS em Andamento (RF05)
- **O que mudou**: O fluxo original do TCC apenas descrevia o faturamento e débito do estoque no encerramento (RF14).
- **Implementação**: Permitido salvar peças e componentes utilizados em Ordens de Serviço antes do fechamento (ex: no status "Em Reparo"). O estoque é atualizado em tempo real no banco através de transações SQL seguras (debitando na inclusão da peça e estornando caso a peça seja removida da OS).

## 8. Persistência de Histórico de Movimentações de Estoque (RF06 / RF20)
- **O que mudou**: Persistência do histórico de movimentações exibido no painel de Estoque.
- **Implementação**: Criado um sistema de persistência no navegador (`localStorage`) para registrar e compartilhar as entradas e saídas de estoque geradas por vendas no PDV, atualizações em Ordens de Serviço, e compras/criação de produtos. A lógica foi refinada para contabilizar corretamente as quantidades e deduções de peças repetidas em uma mesma OS, espelhando com precisão o backend.

## 9. Edição da Mão de Obra Estimada
- **O que mudou**: O TCC indicava um `valor_orcado` na abertura da OS, mas sem especificar que ele poderia mudar com o diagnóstico ao longo do reparo.
- **Implementação**: A Mão de Obra (`valor_orcado`) passou a ser editável na modal de Gestão da OS e salva retroativamente no banco de dados, recalculando e refletindo o Total da Ordem de Serviço em tempo real (mesmo antes da conclusão/entrega).

## 10. Proteção contra Fechamento Duplo de OS (Modal Somente Leitura)
- **O que mudou**: O sistema não impedia que o modal de gestão da OS fosse salvo múltiplas vezes para uma OS já finalizada, o que gerava entradas duplicadas no Caixa (ex: R$120 sendo lançado duas vezes) e inconsistências entre o valor exibido na lista de OS e o Caixa do Dia.
- **Implementação**:
  - **Frontend**: Ao abrir o modal de detalhes, o status atual do banco é salvo em `originalStatus` (campo imutável durante a sessão do modal). Um computed `isClosed` verifica se `originalStatus` é `'Entregue'` ou `'Cancelado'`. Quando verdadeiro: todos os campos (peças, mão de obra, status, pagamento) são desabilitados; o botão "Salvar Alterações" é ocultado e substituído por "Fechar"; e um banner de aviso laranja é exibido no topo do modal.
  - **Backend**: Proteção adicional em `fechar()` — antes de criar o lançamento no Caixa, verifica se já existe uma entrada com o mesmo `id_os`. Se existir, atualiza o valor em vez de criar duplicata. Também corrigido o retorno do endpoint para devolver o `updatedOS` (objeto pós-commit) ao invés do objeto pré-atualização.

## 11. Registro de Data de Conclusão para Status 'Concluído' (Corrige Dashboard)
- **O que mudou**: O campo `data_fechamento` só era preenchido ao entregar a OS (`fechar()`). O Dashboard filtrava "OS Concluídas Hoje" usando `data_fechamento`, excluindo OSs com status `'Concluído'` (reparo finalizado, mas aguardando retirada do cliente) — fazendo o contador mostrar zero mesmo com OSs concluídas no dia.
- **Implementação**: Na função `atualizarStatus()`, ao mudar o status para `'Concluído'`, o campo `data_fechamento` é preenchido com a data atual. Se o status voltar para andamento (ex: `'Em Reparo'`, `'Aguardando Peça'`), o campo é limpo (`null`). Ao finalizar via `fechar()` (status `'Entregue'`), o campo é sobrescrito com a data real de entrega ao cliente.