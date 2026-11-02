# Documentação Técnica e Operacional: Módulo Gestão de Usuários (`UsuariosView.vue`)

> **Documento de Arquitetura, Regras de Negócio e Manual Operacional**  
> **Status:** Atualizado com criptografia Bcrypt, perfis base, telefone para recuperação via WhatsApp e inativação lógica segura.

---

## 1. Visão Geral e Propósito

O módulo de **Gestão de Usuários** gerencia os colaboradores e operadores com acesso ao **Guicell Manager**.

Seus principais objetivos são:
- Cadastrar e manter a equipe técnica e de atendimento da loja.
- Atribuir o perfil base de acesso: **Gerente**, **Atendente** ou **Técnico**.
- Armazenar credenciais de contato (**Telefone com WhatsApp** e **E-mail**) que servem como destino para os códigos de recuperação de senha.
- Garantir a integridade do banco de dados através da **inativação lógica** (`ativo = false`), impedindo que a exclusão física de um colaborador quebre históricos de vendas, ordens de serviço ou lançamentos de caixa anteriores.
- Proteger o sistema contra bloqueios acidentais (um gerente não pode desativar o próprio usuário se estiver logado).

---

## 2. Interface do Usuário (`UsuariosView.vue`)

A tela é acessível exclusivamente por operadores com a permissão `usuarios.gerenciar`:

### 2.1. Listagem de Colaboradores
- **Cards / Tabela de Usuários:**
  - Avatar identificador com iniciais
  - Nome completo e Login de acesso único
  - Perfil de cargo com badge estilizado (Gerente, Atendente ou Técnico)
  - Telefone / WhatsApp e E-mail cadastrados
  - Status operacional (Ativo / Inativo)
  - Data de criação do acesso
- **Ações Rápidas:**
  - Editar dados e redefinir senha
  - Alternar status (Ativar / Desativar)

### 2.2. Modal de Cadastro e Edição de Usuário
- **Nome Completo:** Identificação nominal do colaborador.
- **Login de Usuário:** Nome de usuário exclusivo para autenticação (sem espaços).
- **Senha Inicial:** Campo com visualização opcional. No backend, a senha é processada com salt e criptografada via algoritmo **BcryptJS** antes de persistir em `senha_hash`.
- **Perfil do Sistema:**
  - *Gerente:* Acesso irrestrito a todas as áreas, relatórios e configurações financeiras.
  - *Atendente:* Foco em recepção, abertura de OS, vendas de balcão e conferência de caixa.
  - *Técnico:* Foco estrito em bancada, diagnóstico e execução de reparos.
- **Telefone / WhatsApp:** Número com DDD, utilizado para envio do código de 4 dígitos na recuperação de acesso.
- **E-mail:** E-mail pessoal ou corporativo para envio de códigos de recuperação e avisos.

---

## 3. Regras de Negócio e Segurança

1. **Unicidade de Login:** O sistema rejeita o cadastro de logins duplicados através de constraint única (`UNIQUE`) no MySQL.
2. **Inativação Lógica:** Um usuário inativo (`ativo = 0`) tem seu login bloqueado imediatamente no endpoint de autenticação (`HTTP 401: Usuário inativo`). Seus vínculos com ordens de serviço concluídas, vendas e auditorias permanecem 100% preservados para consultas históricas.
3. **Criptografia Unidirecional:** As senhas nunca são salvas em texto puro. O sistema utiliza `bcrypt.hash(senha, 10)`.
4. **Proteção de Autoexclusão:** O sistema impede que o usuário autenticado alterne seu próprio status para inativo.

---

## 4. Integração com o Backend

### Principais Endpoints:
- **`GET /api/usuarios`** — Listagem de todos os usuários cadastrados.
- **`POST /api/usuarios`** — Cadastro de novo usuário com hash de senha.
- **`PUT /api/usuarios/:id`** — Atualização de dados cadastrais e senha opcional.
- **`DELETE /api/usuarios/:id`** ou **`PATCH /api/usuarios/:id/status`** — Inativação lógica do usuário.

---

## 5. Matriz de Permissões (RBAC) de Usuários

| Permissão | Finalidade | Gerente | Atendente | Técnico |
| :--- | :--- | :---: | :---: | :---: |
| `usuarios.gerenciar` | Cadastrar colaboradores, alterar senhas e inativar contas. | Sim | Não | Não |

