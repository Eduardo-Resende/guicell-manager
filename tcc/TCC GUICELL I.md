TCC Guicell Manager
Um sistema ERP para assistencia técnica de celulares e vendas de acessorios


Para um **TCC I de Engenharia de Software**, cujo tema é:

# Desenvolvimento de um Sistema de Gestão de Assistência Técnica de Celulares com Controle de Estoque, Vendas e Caixa

o aluno **não deveria desenvolver o sistema completo ainda**.

O objetivo do TCC I é demonstrar:

* entendimento do problema;
* levantamento de requisitos;
* fundamentação teórica;
* modelagem da solução;
* planejamento do desenvolvimento.

O desenvolvimento propriamente dito deve ocorrer predominantemente no **TCC II**.

---

# 📌 O que deve ser entregue no TCC I

## 1. Introdução

Apresentação do problema.

Exemplo:

Muitas assistências técnicas utilizam:

* cadernos;
* planilhas;
* controles manuais;

gerando:

* perda de informações;
* erros de estoque;
* inconsistências financeiras;
* dificuldade de acompanhamento dos serviços.

---

## 2. Problema de Pesquisa

Exemplo:

> Como um sistema integrado de gestão pode melhorar o controle operacional, financeiro e de estoque de uma assistência técnica de celulares?

---

## 3. Objetivos

### Objetivo Geral

Desenvolver uma proposta de sistema de gestão para assistência técnica de celulares integrando:

* ordens de serviço;
* estoque;
* vendas;
* fluxo de caixa.

---

### Objetivos Específicos

* Levantar requisitos funcionais;
* Levantar requisitos não funcionais;
* Modelar banco de dados;
* Modelar casos de uso;
* Modelar arquitetura do sistema;
* Definir tecnologias;
* Elaborar protótipo das telas.

---

# 📚 4. Fundamentação Teórica

O aluno deve pesquisar:

## Engenharia de Software

* Pressman
* Sommerville

---

## Levantamento de Requisitos

* requisitos funcionais;
* requisitos não funcionais.

---

## Banco de Dados

* MER
* Modelo Relacional
* Normalização

---

## Sistemas ERP

* conceitos;
* gestão empresarial.

---

## Gestão de Estoque

* entrada;
* saída;
* inventário.

---

## Gestão Financeira

* fluxo de caixa;
* contas a pagar;
* contas a receber.

---

## Assistência Técnica

* ordem de serviço;
* garantia;
* acompanhamento de reparo.

---

# 📋 5. Levantamento de Requisitos

Esta é uma das partes mais importantes.

---

## Requisitos Funcionais

Exemplo:

RF01 – Cadastrar clientes

RF02 – Cadastrar aparelhos

RF03 – Abrir ordem de serviço

RF04 – Atualizar status do reparo

RF05 – Registrar peças utilizadas

RF06 – Controlar estoque

RF07 – Registrar vendas

RF08 – Controlar caixa

RF09 – Emitir relatórios

RF10 – Controlar usuários

---

## Requisitos Não Funcionais

RNF01 – Sistema web

RNF02 – Login obrigatório

RNF03 – Backup automático

RNF04 – Banco MySQL

RNF05 – Interface responsiva

---

# 📊 6. Modelagem UML

## Casos de Uso

Atores:

* Atendente
* Técnico
* Gerente

---

Casos:

* Abrir OS
* Consultar OS
* Fechar OS
* Controlar estoque
* Registrar venda
* Emitir relatório

---

## Diagrama de Classes

Classes:

* Cliente
* Aparelho
* OrdemServico
* Produto
* Estoque
* Venda
* Caixa
* Usuario

---

## Diagrama de Atividades

Fluxo:

Receber aparelho
↓
Cadastrar cliente
↓
Abrir OS
↓
Diagnóstico
↓
Aprovação
↓
Conserto
↓
Entrega

---

# 🗄️ 7. Modelagem do Banco de Dados

O TCC I deve apresentar o MER.

---

## Tabelas sugeridas

### Clientes

* id_cliente
* nome
* telefone
* email

---

### Aparelhos

* id_aparelho
* marca
* modelo
* imei

---

### OrdemServico

* id_os
* id_cliente
* id_aparelho
* defeito
* status
* valor

---

### Produtos

* id_produto
* descricao
* estoque
* valor

---

### Caixa

* id_caixa
* data
* entrada
* saida

---

### Vendas

* id_venda
* data
* valor

---

# 🎨 8. Protótipos de Tela

Ferramentas:

* Figma
* Draw.io
* Pencil
* Canva

---

Telas mínimas:

### Login

### Dashboard

### Clientes

### Ordens de Serviço

### Estoque

### Vendas

### Caixa

### Relatórios

---

# 🏗️ 9. Arquitetura do Sistema

Exemplo:

Arquitetura em 3 Camadas

```text
Interface
↓
Regras de Negócio
↓
Banco de Dados
```

ou

MVC

```text
Model
View
Controller
```

---

# 📅 10. Cronograma do TCC II

O aluno deve apresentar:

| Etapa          | Mês      |
| -------------- | -------- |
| Banco de Dados | Agosto   |
| Backend        | Setembro |
| Frontend       | Outubro  |
| Testes         | Novembro |
| Ajustes        | Novembro |
| Defesa         | Dezembro |

---

# 🎯 O que eu exigiria como orientador no TCC I

## Documento

✔️ Introdução

✔️ Problema

✔️ Objetivos

✔️ Fundamentação

✔️ Requisitos

✔️ UML

✔️ MER

✔️ Protótipos

✔️ Arquitetura

✔️ Cronograma

---

## Entregáveis Técnicos

✔️ Diagrama de Casos de Uso

✔️ Diagrama de Classes

✔️ DER/MER

✔️ Protótipo das telas

✔️ Dicionário de Dados

✔️ Documento de Requisitos

---