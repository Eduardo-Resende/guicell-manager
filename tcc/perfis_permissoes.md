# Documentação Técnica e Operacional: Módulo Perfis de Acesso & Permissões RBAC (`PerfilAcessoView.vue`)

> **Documento de Arquitetura, Regras de Negócio e Manual Operacional**  
> **Status:** Atualizado com arquitetura RBAC dinâmica, matriz granular de 28 chaves de permissão, herança por cargo e sobrescrita individual por usuário.

---

## 1. Visão Geral e Propósito

O módulo de **Perfis de Acesso & Permissões** implementa a arquitetura de segurança baseada em funções (**RBAC - Role-Based Access Control**) do **Guicell Manager**.

Seus principais objetivos são:
- Oferecer uma gestão visual, centralizada e dinâmica dos privilégios de cada usuário no sistema.
- Permitir a configuração de permissões por **Perfil Base** (Gerente, Atendente e Técnico) ou com **sobrescrita individual personalizada** por colaborador.
- Proteger o sistema tanto no **Frontend** (ocultando botões, menus e ações não autorizadas) quanto no **Backend** (bloqueando endpoints da API através do middleware `checkPermission`).
- Permitir ao Gerente restringir funções sensíveis (como faturamento líquido, cancelamento de vendas, aprovação de quebra de caixa e exclusão de OS) sem necessidade de alterar código-fonte.
- Prover a restauração rápida para os padrões de fábrica do sistema com um clique.

---

## 2. Interface do Usuário (`PerfilAcessoView.vue`)

A tela de configuração é exclusiva para operadores com a permissão `permissoes.configurar`:

### 2.1. Seletor de Escopo de Configuração
Permite ao Gerente alternar entre dois modos de ajuste:
1. **Configuração por Perfil:** Ajusta a regra padrão para todos os colaboradores daquele cargo (ex: definir o que todo *Atendente* pode fazer por padrão).
2. **Configuração por Usuário Específico:** Permite selecionar um funcionário nominalmente (ex: "Carlos Técnico") e conceder ou revogar permissões exclusivas que prevalecem sobre o cargo base.

### 2.2. Matriz Granular de Permissões por Módulo
A interface organiza as permissões em blocos temáticos com interruptores (*toggles*) reativos:

```
[✓] Dashboard & Indicadores
    [✓] Visualizar Dashboard (dashboard.ver)
    [ ] Visualizar Faturamento do Dia (dashboard.faturamento)

[✓] Ordens de Serviço
    [✓] Visualizar Ordens de Serviço (os.ver)
    [✓] Abrir Novas Ordens de Serviço (os.criar)
    [✓] Alterar Diagnóstico e Peças (os.editar)
    [✓] Mudar Status no Kanban (os.status)
    [ ] Cancelar Ordens de Serviço (os.excluir)
    [✓] Imprimir e Enviar por WhatsApp (os.imprimir)
```

### 2.3. Ações de Salvamento e Restauração
- **Salvar Alterações:** Persiste a nova matriz JSON no banco de dados. O backend aplica as alterações imediatamente em todas as novas requisições.
- **Restaurar Padrões:** Recarrega a configuração recomendada de fábrica para aquele perfil, desfazendo personalizações.

---

## 3. Matriz Completa de Permissões do Sistema (28 Chaves)

| Módulo | Chave de Permissão | Descrição / Ação Controlada |
| :--- | :--- | :--- |
| **Dashboard** | `dashboard.ver` | Visualizar contadores de OS, estoque crítico e gráficos. |
| | `dashboard.faturamento` | Visualizar o card financeiro "Caixa do Dia" com valores em R$. |
| **Clientes** | `clientes.ver` | Consultar listagem, histórico e fichas de clientes. |
| | `clientes.criar` | Cadastrar novos clientes na recepção. |
| | `clientes.editar` | Atualizar dados cadastrais de clientes. |
| | `clientes.excluir` | Excluir clientes sem movimentações. |
| **Aparelhos** | `aparelhos.gerenciar` | Cadastrar, alterar e vincular aparelhos a clientes. |
| **Ordens de Serviço** | `os.ver` | Consultar listagem e quadro Kanban de OS. |
| | `os.criar` | Abrir novas ordens de serviço. |
| | `os.editar` | Alterar diagnóstico técnico e lançar peças consumidas. |
| | `os.status` | Mover OS entre colunas de status no Kanban. |
| | `os.excluir` | Cancelar ordens de serviço. |
| | `os.imprimir` | Imprimir comprovante e disparar PDF por WhatsApp. |
| **Estoque** | `estoque.ver` | Consultar catálogo de produtos e saldos de prateleira. |
| | `estoque.criar_editar` | Cadastrar produtos, alterar custos e preços de venda. |
| | `estoque.ajustar` | Realizar ajustes manuais rápidos de entrada e saída. |
| | `estoque.categorias` | Gerenciar categorias e classificação de `tipo_uso`. |
| **Compras** | `compras.ver` | Consultar compras realizadas e fornecedores. |
| | `compras.criar` | Lançar compras e dar entrada em mercadorias. |
| | `compras.cancelar` | Cancelar compras com estorno de estoque. |
| | `compras.fornecedores`| Cadastrar e gerenciar fornecedores. |
| **Vendas** | `vendas.ver` | Consultar histórico de vendas e comprovantes. |
| | `vendas.criar` | Operar o PDV de balcão e registrar vendas. |
| | `vendas.desconto` | Aplicar descontos sobre o total da venda. |
| | `vendas.cancelar` | Cancelar vendas efetuadas com devolução de estoque. |
| **Caixa** | `caixa.ver` | Visualizar cards de saldos (Gaveta, Cofre, Loja) e extrato. |
| | `caixa.abrir_fechar` | Abrir e fechar turnos com contagem física. |
| | `caixa.movimentar` | Registrar receitas e despesas manuais avulsas. |
| | `caixa.transferir` | Realizar sangrias e transferências entre gaveta e cofre. |
| | `caixa.estornar` | Estornar lançamentos financeiros manuais. |
| | `caixa.aprovar` | Autorizar quebras de caixa acima do limite e exceções. |
| **Relatórios** | `relatorios.vendas` | Acessar e exportar o relatório analítico de vendas. |
| | `relatorios.os` | Acessar o relatório de OS por técnico e status. |
| | `relatorios.caixa` | Consultar fluxo de caixa detalhado e faturamento. |
| | `relatorios.estoque` | Acessar inventário e custos de produtos. |
| **Administração** | `usuarios.gerenciar` | Cadastrar e gerenciar colaboradores da equipe. |
| | `permissoes.configurar` | Configurar matrizes de permissão de perfis e usuários. |

---

## 4. Arquitetura do Backend e Resolução de Permissões

### Tabela no Banco: `permissoes`
- Armazena as regras em uma coluna `regras` do tipo `JSON`.
- Suporta registros por `perfil` (`UNIQUE`) ou por `id_usuario` (`UNIQUE`).

### Ordem de Precedência (Algoritmo de Resolução):
1. **Regra Individual do Usuário:** Se existir um registro em `permissoes` vinculado ao `id_usuario`, suas regras têm prioridade máxima.
2. **Regra do Perfil do Usuário:** Se não houver regra individual, o sistema busca o registro vinculado ao cargo (`perfil`).
3. **Padrão do Sistema (`PADROES_SISTEMA`):** Caso não haja nenhum registro customizado no banco, o sistema aplica a constante estática padrão segura do código.

### Middlewares de Proteção:
- No Backend: `checkPermission('chave.permissao')` intercepta cada rota e retorna `HTTP 403: Acesso negado` caso o usuário não possua a regra ativa.
- No Frontend: O composable `usePermissoes.js` disponibiliza o helper global `$pode('chave.permissao')` para condicionar diretivas `v-if` e `:disabled` no template.

---

## 5. Matriz de Permissões (RBAC) do Módulo

| Permissão | Finalidade | Gerente | Atendente | Técnico |
| :--- | :--- | :---: | :---: | :---: |
| `permissoes.configurar` | Acessar a tela e alterar permissões de perfis e usuários. | Sim | Não | Não |

