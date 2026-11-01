<template>
  <div class="caixa-view">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="header-section">
      <div>
        <h1 class="page-title">Caixa & Gestão Financeira</h1>
        <p class="page-subtitle">Controle de saldos por conta (Gaveta, Cofre, Conta da loja), formas de pagamento, transferências e conferência de turnos.</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <template v-if="caixaAberto">
          <button v-if="$pode('caixa.transferir')" class="btn btn-secondary" @click="abrirModalTransferencia">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>Transferência / Cofre</span>
          </button>
          <button v-if="$pode('caixa.movimentar')" class="btn" @click="abrirModalManual">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Lançar Movimentação</span>
          </button>
          <button v-if="$pode('caixa.abrir_fechar')" class="btn btn-danger-solid" @click="abrirModalFechamento">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Fechar Caixa</span>
          </button>
        </template>
        <template v-else>
          <button v-if="$pode('caixa.abrir_fechar')" class="btn btn-success" @click="abrirModalAbertura">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 1 1 9.9-1" />
            </svg>
            <span>Abrir Caixa</span>
          </button>
        </template>
      </div>
    </div>

    <!-- ── Abas de Navegação ────────────────────────────────────────────────── -->
    <div class="tabs-container">
      <button :class="['tab-btn', { active: activeTab === 'fluxo' }]" @click="activeTab = 'fluxo'">
        Fluxo do Dia & Saldos
      </button>
      <button v-if="$pode('caixa.transferir') || $pode('caixa.ver')" :class="['tab-btn', { active: activeTab === 'transferencias' }]" @click="goToTransferencias">
        Transferências & Cofre
      </button>
      <button v-if="$pode('caixa.ver')" :class="['tab-btn', { active: activeTab === 'sessoes' }]" @click="goToSessoes">
        Sessões e Turnos
      </button>
    </div>

    <!-- ====================================================================== -->
    <!--  TAB 1: FLUXO DO DIA & SALDOS                                          -->
    <!-- ====================================================================== -->
    <div v-if="activeTab === 'fluxo'" class="tab-content">
      <!-- ── Estado: Caixa Fechado ────────────────────────────────────────── -->
      <div v-if="!caixaAberto && !loading" class="card caixa-fechado-card mb-4">
        <div class="caixa-fechado-content">
          <div class="caixa-fechado-icon">🔒</div>
          <h3>Caixa Fechado</h3>
          <p v-if="$pode('caixa.abrir_fechar')" class="text-muted">
            Informe o dinheiro contado na gaveta para abrir a sessão de trabalho.
          </p>
          <p v-else class="text-muted">O turno de caixa ainda não foi aberto.</p>
          <button v-if="$pode('caixa.abrir_fechar')" class="btn mt-4" @click="abrirModalAbertura">
            Abrir Caixa
          </button>
        </div>
      </div>

      <!-- ── Estado: Aberto mas sem caixa.ver ─────────────────────────────── -->
      <div v-if="caixaAberto && !$pode('caixa.ver') && !loading" class="card caixa-fechado-card mb-4">
        <div class="caixa-fechado-content">
          <div class="caixa-fechado-icon">🔓</div>
          <h3>Turno de Caixa Aberto</h3>
          <p class="text-muted">
            Operador: <strong>{{ sessaoAtual?.operador || '—' }}</strong> &bull;
            Aberto às: {{ formatarHora(sessaoAtual?.data_abertura) }}
          </p>
          <div class="flex gap-2 mt-4">
            <button v-if="$pode('caixa.movimentar')" class="btn" @click="abrirModalManual">
              Lançar Movimentação
            </button>
            <button v-if="$pode('caixa.transferir')" class="btn btn-secondary" @click="abrirModalTransferencia">
              Transferência / Cofre
            </button>
            <button v-if="$pode('caixa.abrir_fechar')" class="btn btn-danger-solid" @click="abrirModalFechamento">
              Fechar Caixa
            </button>
          </div>
        </div>
      </div>

      <!-- ── Seção de Saldos por Localização & Formas de Pagamento ──────────── -->
      <div v-if="$pode('caixa.ver')" class="mb-4">
        <div class="grid-saldos">
          <!-- Card 1: Saldo Total da Loja -->
          <div class="card saldo-card card-total">
            <div class="saldo-card-header">
              <span class="saldo-tag">Consolidado</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="saldo-icon">
                <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/>
              </svg>
            </div>
            <div class="saldo-title">Saldo Total da Loja</div>
            <div class="saldo-valor text-primary font-bold">R$ {{ fmt(saldos.total) }}</div>
            <div class="saldo-meta text-muted">Dinheiro Físico + Conta Eletrônica</div>
          </div>

          <!-- Card 2: Dinheiro Físico Total -->
          <div class="card saldo-card card-dinheiro">
            <div class="saldo-card-header">
              <span class="saldo-tag tag-dinheiro">Espécie</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="saldo-icon">
                <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <div class="saldo-title">Dinheiro Físico Total</div>
            <div class="saldo-valor text-success font-bold">R$ {{ fmt(saldos.dinheiro_fisico) }}</div>
            <div class="saldo-subdetalhes">
              <div class="sub-item">
                <span class="text-muted">Caixa (gaveta):</span>
                <span class="font-semibold text-white">R$ {{ fmt(saldos.gaveta) }}</span>
              </div>
              <div class="sub-item">
                <span class="text-muted">Cofre:</span>
                <span class="font-semibold text-warning">R$ {{ fmt(saldos.cofre) }}</span>
              </div>
            </div>
          </div>

          <!-- Card 3: Conta da Loja (Eletrônica) -->
          <div class="card saldo-card card-eletronico">
            <div class="saldo-card-header">
              <span class="saldo-tag tag-eletronico">Eletrônico</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="saldo-icon">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div class="saldo-title">Conta da Loja (Eletrônica)</div>
            <div class="saldo-valor text-info font-bold">R$ {{ fmt(saldos.loja) }}</div>
            <div class="saldo-subdetalhes">
              <div class="sub-item" v-for="f in formasEletronicas" :key="f.codigo">
                <span class="text-muted">{{ f.nome }}:</span>
                <span class="font-semibold text-white">R$ {{ fmt(f.saldo) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Extrato / Tabela de Movimentações ──────────────────────────────── -->
      <div v-if="$pode('caixa.ver')" class="card">
        <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h3>Movimentações do Caixa</h3>
            <p class="text-muted text-sm">Histórico detalhado de entradas, saídas, transferências e conferências.</p>
          </div>
          <!-- Filtros rápidos -->
          <div class="flex gap-2 flex-wrap items-center">
            <select v-model="filtroNatureza" class="input-control select-control input-sm" style="width:160px">
              <option value="todas">Todas as Naturezas</option>
              <option value="operacional">Operacionais (Receitas/Despesas)</option>
              <option value="transferencia">Transferências</option>
              <option value="ajuste_conferencia">Ajustes de Conferência</option>
            </select>
            <select v-model="filtroConta" class="input-control select-control input-sm" style="width:150px">
              <option value="">Todas as Contas</option>
              <option value="gaveta">Caixa (gaveta)</option>
              <option value="cofre">Cofre</option>
              <option value="loja">Conta da loja</option>
            </select>
            <button class="btn btn-secondary btn-sm" @click="fetchCaixa" title="Atualizar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon-sm">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Descrição / Favorecido</th>
                <th>Categoria / Origem</th>
                <th>Forma / Conta</th>
                <th>Natureza</th>
                <th>Valor</th>
                <th>Operador</th>
                <th class="text-right" v-if="$pode('caixa.estornar')">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logsFiltrados" :key="log.id_caixa" :class="{ 'row-estornado': log.estornado }">
                <td class="text-muted font-mono text-sm">{{ formatarHora(log.data) }}</td>
                <td>
                  <div class="font-semibold text-white">{{ log.descricao }}</div>
                  <div v-if="log.favorecido" class="text-xs text-muted">Favorecido: {{ log.favorecido }}</div>
                  <div v-if="log.estorno" class="text-xs text-warning">Estorno do lançamento #{{ log.id_lancamento_origem }}</div>
                  <div v-if="log.estornado" class="text-xs text-danger">⚠️ Lançamento estornado</div>
                  <div v-if="log.fora_sessao" class="text-xs text-info">Auditado: fora da sessão de caixa</div>
                </td>
                <td>
                  <span class="badge badge-muted">{{ log.categoria || log.origem || 'Geral' }}</span>
                </td>
                <td>
                  <!-- Exibição de Forma e Conta -->
                  <div v-if="log.pagamentos && log.pagamentos.length > 0">
                    <div v-for="(p, i) in log.pagamentos" :key="i" class="pagamento-tag">
                      <span class="font-medium text-white">{{ p.forma?.nome || '—' }}</span>
                      <span class="text-xs text-muted"> &bull; {{ p.conta?.nome || '—' }}</span>
                      <span v-if="log.pagamentos.length > 1" class="text-xs font-mono ml-1">({{ fmt(p.valor) }})</span>
                    </div>
                  </div>
                  <div v-else-if="log.transferencia">
                    <span class="text-xs">{{ log.transferencia.origem }} &rarr; {{ log.transferencia.destino }}</span>
                  </div>
                  <span v-else class="text-muted text-xs">—</span>
                </td>
                <td>
                  <span v-if="log.natureza === 'transferencia'" class="badge badge-transferencia">
                    Transferência
                  </span>
                  <span v-else-if="log.natureza === 'ajuste_conferencia'" class="badge badge-warning">
                    Ajuste Conferência
                  </span>
                  <span v-else-if="log.tipo === 'entrada'" class="badge badge-success">
                    Receita
                  </span>
                  <span v-else class="badge badge-danger">
                    Despesa
                  </span>
                </td>
                <td class="font-bold" :class="log.natureza === 'transferencia' ? 'text-primary' : (log.tipo === 'entrada' ? 'text-success' : 'text-danger')" :style="log.estornado ? 'text-decoration: line-through; opacity: 0.6;' : ''">
                  {{ log.tipo === 'entrada' ? '+' : '-' }} R$ {{ fmt(log.valor) }}
                </td>
                <td class="text-muted text-sm">{{ log.usuario?.nome || '—' }}</td>
                <td class="text-right" v-if="$pode('caixa.estornar')">
                  <button
                    v-if="log.natureza === 'operacional' && log.origem === 'manual' && !log.estornado && !log.estorno"
                    class="btn btn-secondary btn-xs"
                    @click="abrirModalEstorno(log)"
                    title="Estornar lançamento manual"
                  >
                    Estornar
                  </button>
                </td>
              </tr>
              <tr v-if="logsFiltrados.length === 0">
                <td colspan="8" class="text-center text-muted py-6">Nenhuma movimentação encontrada para os filtros aplicados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!--  TAB 2: TRANSFERÊNCIAS & COFRE                                         -->
    <!-- ====================================================================== -->
    <div v-else-if="activeTab === 'transferencias'" class="tab-content">
      <div class="card mb-4">
        <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h3>Transferências entre Contas & Cofre</h3>
            <p class="text-muted text-sm">
              Movimente valores entre a Gaveta, o Cofre e a Conta da loja sem alterar o saldo total da empresa.
            </p>
          </div>
          <button v-if="$pode('caixa.transferir')" class="btn" @click="abrirModalTransferencia">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>Nova Transferência</span>
          </button>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data / Hora</th>
                <th>Origem &rarr; Destino</th>
                <th>Valor</th>
                <th>Descrição / Justificativa</th>
                <th>Responsável</th>
                <th>Status</th>
                <th class="text-right" v-if="$pode('caixa.transferir')">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in transferencias" :key="t.id_transferencia">
                <td class="font-mono text-muted text-sm">#{{ t.id_transferencia }}</td>
                <td>{{ formatarDataHora(t.data_hora) }}</td>
                <td>
                  <span class="font-semibold text-white">{{ t.origem?.nome }}</span>
                  <span class="text-muted mx-2">&rarr;</span>
                  <span class="font-semibold text-white">{{ t.destino?.nome }}</span>
                </td>
                <td class="font-bold text-primary">R$ {{ fmt(t.valor) }}</td>
                <td>
                  <span>{{ t.descricao || '—' }}</span>
                  <div v-if="t.motivo_cancelamento" class="text-xs text-danger mt-1">
                    Cancelada: {{ t.motivo_cancelamento }}
                  </div>
                </td>
                <td class="text-muted text-sm">{{ t.usuario || '—' }}</td>
                <td>
                  <span :class="['badge', t.status === 'efetivada' ? 'badge-success' : 'badge-danger']">
                    {{ t.status === 'efetivada' ? 'Efetivada' : 'Cancelada' }}
                  </span>
                </td>
                <td class="text-right" v-if="$pode('caixa.transferir')">
                  <button
                    v-if="t.status === 'efetivada' && !t.id_transferencia_estornada"
                    class="btn btn-danger btn-xs"
                    @click="abrirModalCancelarTransferencia(t)"
                  >
                    Cancelar
                  </button>
                </td>
              </tr>
              <tr v-if="transferencias.length === 0">
                <td colspan="8" class="text-center text-muted py-6">Nenhuma transferência realizada.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ====================================================================== -->
    <!--  TAB 3: SESSÕES E TURNOS                                               -->
    <!-- ====================================================================== -->
    <div v-else-if="activeTab === 'sessoes'" class="tab-content">
      <div class="card mb-4">
        <div class="mb-4">
          <h3>Histórico de Sessões de Caixa</h3>
          <p class="text-muted text-sm">Conferências de abertura e fechamento de cada turno de trabalho da loja.</p>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Sessão</th>
                <th>Abertura</th>
                <th>Fechamento</th>
                <th>Esperado Abertura</th>
                <th>Contado Abertura</th>
                <th>Dif. Abertura</th>
                <th>Esperado Fechamento</th>
                <th>Contado Fechamento</th>
                <th>Dif. Fechamento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sessoes" :key="s.id_sessao">
                <td class="font-mono text-muted text-sm">#{{ s.id_sessao }}</td>
                <td>
                  <div>{{ formatarDataHora(s.data_abertura) }}</div>
                  <div class="text-xs text-muted">{{ s.operador_abertura }}</div>
                </td>
                <td>
                  <div v-if="s.data_fechamento">
                    {{ formatarDataHora(s.data_fechamento) }}
                    <div class="text-xs text-muted">{{ s.operador_fechamento }}</div>
                  </div>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>{{ s.valor_esperado_abertura !== null ? 'R$ ' + fmt(s.valor_esperado_abertura) : '—' }}</td>
                <td class="font-semibold text-white">R$ {{ fmt(s.valor_abertura) }}</td>
                <td>
                  <span v-if="s.diferenca_abertura && s.diferenca_abertura !== 0" :class="s.diferenca_abertura > 0 ? 'text-success' : 'text-danger'">
                    {{ s.diferenca_abertura > 0 ? '+' : '' }}R$ {{ fmt(s.diferenca_abertura) }}
                  </span>
                  <span v-else class="text-muted">R$ 0,00</span>
                </td>
                <td>{{ s.valor_sistema !== null ? 'R$ ' + fmt(s.valor_sistema) : '—' }}</td>
                <td class="font-semibold text-white">{{ s.valor_contado !== null ? 'R$ ' + fmt(s.valor_contado) : '—' }}</td>
                <td>
                  <span v-if="s.diferenca && s.diferenca !== 0" :class="s.diferenca > 0 ? 'text-success' : 'text-danger'">
                    {{ s.diferenca > 0 ? '+' : '' }}R$ {{ fmt(s.diferenca) }}
                  </span>
                  <span v-else class="text-muted">{{ s.status === 'fechado' ? 'R$ 0,00' : '—' }}</span>
                </td>
                <td>
                  <span :class="['badge', s.status === 'aberto' ? 'badge-success' : 'badge-muted']">
                    {{ s.status === 'aberto' ? 'Em Aberto' : 'Encerrada' }}
                  </span>
                </td>
              </tr>
              <tr v-if="sessoes.length === 0">
                <td colspan="10" class="text-center text-muted py-6">Nenhuma sessão registrada.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!--  MODAL: ABERTURA DE CAIXA COM CONFERÊNCIA                             -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="showAbrirModal" class="modal-overlay">
      <div class="modal-content" style="max-width: 520px;">
        <div class="modal-header">
          <h3>🔓 Abertura de Sessão de Caixa</h3>
          <button class="close-btn" @click="showAbrirModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitAbrirCaixa">
          <div class="modal-body">
            <div class="conferencia-box mb-4">
              <div class="conferencia-item">
                <span class="text-muted">Saldo esperado na gaveta (fechamento anterior):</span>
                <span class="font-bold text-white text-lg">R$ {{ fmt(infoAberturaData.saldo_esperado) }}</span>
              </div>
              <div v-if="infoAberturaData.ultima_sessao" class="text-xs text-muted mt-1">
                Fechamento anterior por {{ infoAberturaData.ultima_sessao.operador || 'Operador' }} em {{ formatarDataHora(infoAberturaData.ultima_sessao.data_fechamento) }}
              </div>
              <div v-else class="text-xs text-info mt-1">
                Primeira abertura do sistema: o valor contado iniciará o saldo da gaveta.
              </div>
            </div>

            <div class="form-group">
              <label>Dinheiro Contado na Gaveta (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                v-model.number="formAbertura.valor_contado"
                required
                class="input-control text-lg font-bold"
                placeholder="0,00"
                autofocus
              />
            </div>

            <!-- Apuração da divergência em tempo real -->
            <div v-if="temDiferencaAbertura" class="divergencia-alerta mb-4" :class="diferencaAberturaVal > 0 ? 'alerta-sobra' : 'alerta-falta'">
              <strong>{{ diferencaAberturaVal > 0 ? 'Sobra de Caixa (+)' : 'Falta de Caixa (-)' }}:</strong>
              R$ {{ fmt(Math.abs(diferencaAberturaVal)) }}
              <div class="text-xs mt-1">
                Uma justificativa é obrigatória para registrar a divergência de conferência.
              </div>
            </div>

            <div v-if="temDiferencaAbertura" class="form-group">
              <label>Justificativa da Divergência *</label>
              <textarea
                v-model="formAbertura.justificativa"
                required
                rows="2"
                class="input-control textarea-control"
                placeholder="Explique o motivo da sobra ou falta de dinheiro..."
              ></textarea>
            </div>

            <!-- Autorização do Gerente caso exceda limite e operador não tenha caixa.aprovar -->
            <div v-if="precisaAutorizacaoAbertura" class="autorizacao-box mb-4">
              <div class="text-warning font-semibold mb-2">
                ⚠️ Diferença acima do limite (R$ {{ fmt(infoAberturaData.limite_divergencia) }}). Requer autorização de um Gerente:
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="form-group m-0">
                  <label>Login do Gerente *</label>
                  <input type="text" v-model="formAbertura.autorizador_login" required class="input-control" placeholder="Login" />
                </div>
                <div class="form-group m-0">
                  <label>Senha *</label>
                  <input type="password" v-model="formAbertura.autorizador_senha" required class="input-control" placeholder="••••••" />
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAbrirModal = false">Cancelar</button>
            <button type="submit" class="btn btn-success" :disabled="abrindo">
              {{ abrindo ? 'Abrindo...' : '🔓 Confirmar Abertura' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!--  MODAL: FECHAMENTO DE CAIXA COM CONFERÊNCIA                           -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="showFecharModal" class="modal-overlay">
      <div class="modal-content" style="max-width: 560px;">
        <div class="modal-header">
          <h3>🔒 Fechamento e Conferência de Caixa</h3>
          <button class="close-btn" @click="showFecharModal = false">&times;</button>
        </div>
        <form @submit.prevent="confirmarFechamento">
          <div class="modal-body">
            <!-- Demonstrativo de Conferência -->
            <div class="fechamento-resumo mb-4">
              <div class="resumo-row">
                <span class="text-muted">Fundo Inicial da Gaveta</span>
                <span>R$ {{ fmt(fechamentoPreviaData.resumo?.saldo_inicial) }}</span>
              </div>
              <div class="resumo-row">
                <span class="text-success">(+) Entradas em Dinheiro</span>
                <span class="text-success">+ R$ {{ fmt(fechamentoPreviaData.resumo?.entradas_dinheiro) }}</span>
              </div>
              <div class="resumo-row">
                <span class="text-danger">(-) Saídas em Dinheiro</span>
                <span class="text-danger">- R$ {{ fmt(fechamentoPreviaData.resumo?.saidas_dinheiro) }}</span>
              </div>
              <div class="resumo-row">
                <span class="text-muted">(+) Transferências do Cofre &rarr; Gaveta</span>
                <span>+ R$ {{ fmt(fechamentoPreviaData.resumo?.transferencias_recebidas) }}</span>
              </div>
              <div class="resumo-row">
                <span class="text-muted">(-) Transferências da Gaveta &rarr; Cofre</span>
                <span>- R$ {{ fmt(fechamentoPreviaData.resumo?.transferencias_enviadas) }}</span>
              </div>
              <div class="resumo-row resumo-total">
                <span class="font-bold">Saldo Esperado na Gaveta:</span>
                <span class="font-bold text-primary text-lg">R$ {{ fmt(fechamentoPreviaData.resumo?.saldo_esperado) }}</span>
              </div>
            </div>

            <div class="form-group">
              <label>Dinheiro Efetivamente Contado na Gaveta (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                v-model.number="formFechamento.valor_contado"
                required
                class="input-control text-lg font-bold"
                placeholder="0,00"
                autofocus
              />
            </div>

            <!-- Apuração da divergência em tempo real -->
            <div v-if="temDiferencaFechamento" class="divergencia-alerta mb-4" :class="diferencaFechamentoVal > 0 ? 'alerta-sobra' : 'alerta-falta'">
              <strong>{{ diferencaFechamentoVal > 0 ? 'Sobra de Caixa (+)' : 'Falta de Caixa (-)' }}:</strong>
              R$ {{ fmt(Math.abs(diferencaFechamentoVal)) }}
              <div class="text-xs mt-1">
                Uma justificativa é obrigatória para registrar a divergência sem distorcer as vendas/despesas.
              </div>
            </div>

            <div v-if="temDiferencaFechamento" class="form-group">
              <label>Justificativa da Divergência *</label>
              <textarea
                v-model="formFechamento.justificativa"
                required
                rows="2"
                class="input-control textarea-control"
                placeholder="Descreva o motivo da divergência apurada na conferência..."
              ></textarea>
            </div>

            <!-- Autorização do Gerente caso exceda limite -->
            <div v-if="precisaAutorizacaoFechamento" class="autorizacao-box mb-4">
              <div class="text-warning font-semibold mb-2">
                ⚠️ Diferença acima do limite (R$ {{ fmt(fechamentoPreviaData.limite_divergencia) }}). Requer autorização de um Gerente:
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="form-group m-0">
                  <label>Login do Gerente *</label>
                  <input type="text" v-model="formFechamento.autorizador_login" required class="input-control" placeholder="Login" />
                </div>
                <div class="form-group m-0">
                  <label>Senha *</label>
                  <input type="password" v-model="formFechamento.autorizador_senha" required class="input-control" placeholder="••••••" />
                </div>
              </div>
            </div>

            <div class="form-group m-0">
              <label>Observação do Turno (opcional)</label>
              <input type="text" v-model="formFechamento.observacao" class="input-control" placeholder="Observações gerais sobre a operação de hoje" />
            </div>

            <p class="text-muted mt-3" style="font-size:0.8rem;">
              ℹ️ O fechamento encerra a sessão de trabalho e preserva o dinheiro na gaveta para o próximo turno. Para guardar no cofre, use a função Transferência.
            </p>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showFecharModal = false">Cancelar</button>
            <button type="submit" class="btn btn-danger-solid" :disabled="fechando">
              {{ fechando ? 'Fechando...' : '🔒 Encerrar Turno' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!--  MODAL: LANÇAMENTO MANUAL (DESPESAS COM DIVISÃO)                      -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content" style="max-width: 580px;">
        <div class="modal-header">
          <h3>Lançar Movimentação Manual</h3>
          <button class="close-btn" @click="showAddModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitMovimentacao">
          <div class="modal-body">
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="form-group m-0">
                <label>Tipo de Lançamento *</label>
                <select v-model="formManual.tipo" required class="input-control select-control">
                  <option value="saida">Saída (Despesa)</option>
                  <option value="entrada">Entrada (Receita)</option>
                </select>
              </div>
              <div class="form-group m-0">
                <label>Valor Total (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  v-model.number="formManual.valor"
                  required
                  class="input-control font-bold"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Descrição *</label>
              <input type="text" v-model="formManual.descricao" required class="input-control" placeholder="Ex: Material de limpeza / Venda avulsa" />
            </div>

            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="form-group m-0">
                <label>Categoria</label>
                <select v-model="formManual.categoria" class="input-control select-control">
                  <option value="Serviços">Serviços / OS</option>
                  <option value="Vendas">Venda de Acessórios</option>
                  <option value="Infraestrutura">Aluguel / Água / Energia</option>
                  <option value="Fornecedores">Pagamento de Fornecedor</option>
                  <option value="Retirada">Retirada (Sangria)</option>
                  <option value="Outros">Outras despesas</option>
                </select>
              </div>
              <div class="form-group m-0">
                <label>Favorecido / Destino</label>
                <input type="text" v-model="formManual.favorecido" class="input-control" placeholder="Nome do recebedor/cliente" />
              </div>
            </div>

            <!-- Formas de Pagamento / Divisão -->
            <div class="divisao-section mt-4">
              <div class="flex justify-between items-center mb-2">
                <label class="font-bold text-white text-sm">
                  {{ formManual.tipo === 'saida' ? 'Formas de Pagamento & Contas de Origem' : 'Forma de Pagamento Recebida' }}
                </label>
                <button
                  type="button"
                  class="btn btn-secondary btn-xs"
                  @click="adicionarFormaManual"
                  v-if="formManual.tipo === 'saida'"
                >
                  + Adicionar Forma
                </button>
              </div>

              <div v-for="(p, idx) in formManual.pagamentos" :key="idx" class="pagamento-linha mb-2">
                <div class="grid grid-cols-12 gap-2 items-center">
                  <div :class="formManual.tipo === 'saida' ? 'col-span-4' : 'col-span-6'">
                    <select v-model="p.forma" @change="onFormaManualChange(p)" required class="input-control select-control input-sm">
                      <option v-for="f in formasCadastradas" :key="f.codigo" :value="f.codigo">
                        {{ f.nome }}
                      </option>
                    </select>
                  </div>
                  <div v-if="formManual.tipo === 'saida'" class="col-span-4">
                    <select v-model="p.conta" required class="input-control select-control input-sm">
                      <option v-for="c in contasCompativeis(p.forma)" :key="c.codigo" :value="c.codigo">
                        {{ c.nome }}
                      </option>
                    </select>
                  </div>
                  <div :class="formManual.tipo === 'saida' ? 'col-span-3' : 'col-span-5'">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      v-model.number="p.valor"
                      required
                      class="input-control input-sm font-bold"
                      placeholder="Valor R$"
                    />
                  </div>
                  <div class="col-span-1 text-right" v-if="formManual.pagamentos.length > 1 && formManual.tipo === 'saida'">
                    <button type="button" class="btn btn-danger btn-xs btn-icon-only" @click="removerFormaManual(idx)">
                      &times;
                    </button>
                  </div>
                </div>
              </div>

              <!-- Totalizador de Divisão -->
              <div v-if="formManual.tipo === 'saida'" class="divisao-totalizador mt-2">
                <div class="flex justify-between text-xs">
                  <span class="text-muted">Total Distribuído:</span>
                  <span class="font-bold text-white">R$ {{ fmt(totalDistribuidoManual) }}</span>
                </div>
                <div class="flex justify-between text-xs mt-1">
                  <span class="text-muted">Restante a Distribuir:</span>
                  <span :class="restanteManual === 0 ? 'text-success' : 'text-danger font-bold'">
                    R$ {{ fmt(restanteManual) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAddModal = false">Cancelar</button>
            <button type="submit" class="btn" :disabled="salvandoManual || (formManual.tipo === 'saida' && restanteManual !== 0)">
              {{ salvandoManual ? 'Salvando...' : 'Salvar Movimentação' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!--  MODAL: TRANSFERÊNCIA ENTRE CONTAS (GAVETA <-> COFRE ETC)            -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="showTransferenciaModal" class="modal-overlay">
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3>Nova Transferência Financeira</h3>
          <button class="close-btn" @click="showTransferenciaModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitTransferencia">
          <div class="modal-body">
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="form-group m-0">
                <label>Conta de Origem (Sai de) *</label>
                <select v-model="formTransferencia.conta_origem" required class="input-control select-control">
                  <option v-for="c in contasCadastradas" :key="c.codigo" :value="c.codigo" :disabled="c.codigo === formTransferencia.conta_destino">
                    {{ c.nome }} (R$ {{ fmt(saldoConta(c.codigo)) }})
                  </option>
                </select>
              </div>
              <div class="form-group m-0">
                <label>Conta de Destino (Entra em) *</label>
                <select v-model="formTransferencia.conta_destino" required class="input-control select-control">
                  <option v-for="c in contasCadastradas" :key="c.codigo" :value="c.codigo" :disabled="c.codigo === formTransferencia.conta_origem">
                    {{ c.nome }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Valor a Transferir (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                v-model.number="formTransferencia.valor"
                required
                class="input-control text-lg font-bold"
                placeholder="0,00"
              />
              <div class="text-xs text-muted mt-1">
                Disponível na conta de origem: R$ {{ fmt(saldoConta(formTransferencia.conta_origem)) }}
              </div>
            </div>

            <div class="form-group m-0">
              <label>Descrição / Observação</label>
              <input
                type="text"
                v-model="formTransferencia.descricao"
                class="input-control"
                placeholder="Ex: Sangria para o cofre / Reforço de troco"
              />
            </div>

            <div class="text-xs text-muted mt-3">
              ℹ️ A transferência não afeta receitas nem despesas: apenas altera a localização do dinheiro na loja.
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showTransferenciaModal = false">Cancelar</button>
            <button type="submit" class="btn" :disabled="transferindo">
              {{ transferindo ? 'Transferindo...' : 'Efetivar Transferência' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!--  MODAL: ESTORNO DE LANÇAMENTO MANUAL                                  -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="showEstornoModal" class="modal-overlay">
      <div class="modal-content" style="max-width: 460px;">
        <div class="modal-header">
          <h3>Estornar Lançamento</h3>
          <button class="close-btn" @click="showEstornoModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitEstorno">
          <div class="modal-body">
            <p class="text-white mb-2">
              Deseja estornar o lançamento <strong>"{{ lancamentoParaEstornar?.descricao }}"</strong> de <strong>R$ {{ fmt(lancamentoParaEstornar?.valor) }}</strong>?
            </p>
            <p class="text-muted text-xs mb-3">
              O sistema criará uma movimentação inversa preservando exatamente as formas de pagamento e contas originais. O histórico será mantido.
            </p>
            <div class="form-group m-0">
              <label>Motivo do Estorno *</label>
              <textarea
                v-model="motivoEstorno"
                required
                rows="3"
                class="input-control textarea-control"
                placeholder="Informe o motivo deste estorno..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEstornoModal = false">Voltar</button>
            <button type="submit" class="btn btn-danger-solid" :disabled="estornando">
              {{ estornando ? 'Estornando...' : 'Confirmar Estorno' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!--  MODAL: CANCELAMENTO DE TRANSFERÊNCIA                                 -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="showCancelarTransfModal" class="modal-overlay">
      <div class="modal-content" style="max-width: 460px;">
        <div class="modal-header">
          <h3>Cancelar Transferência #{{ transfParaCancelar?.id_transferencia }}</h3>
          <button class="close-btn" @click="showCancelarTransfModal = false">&times;</button>
        </div>
        <form @submit.prevent="submitCancelarTransferencia">
          <div class="modal-body">
            <p class="text-white mb-2">
              Valor: <strong>R$ {{ fmt(transfParaCancelar?.valor) }}</strong> (de {{ transfParaCancelar?.origem?.nome }} para {{ transfParaCancelar?.destino?.nome }}).
            </p>
            <p class="text-muted text-xs mb-3">
              O cancelamento gerará automaticamente uma transferência inversa para devolver o saldo à conta de origem. O histórico será preservado.
            </p>
            <div class="form-group m-0">
              <label>Motivo do Cancelamento *</label>
              <textarea
                v-model="motivoCancelarTransf"
                required
                rows="3"
                class="input-control textarea-control"
                placeholder="Informe o motivo do cancelamento..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCancelarTransfModal = false">Voltar</button>
            <button type="submit" class="btn btn-danger-solid" :disabled="cancelandoTransf">
              {{ cancelandoTransf ? 'Cancelando...' : 'Confirmar Cancelamento' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { caixaService } from '../services/index.js';
import { pode } from '../composables/usePermissoes';

export default defineComponent({
  name: 'CaixaView',
  setup() {
    const loading = ref(true);
    const activeTab = ref('fluxo');
    const caixaAberto = ref(false);
    const sessaoAtual = ref(null);

    // Cadastros
    const formasCadastradas = ref([]);
    const contasCadastradas = ref([]);

    // Saldos
    const saldos = ref({
      total: 0,
      dinheiro_fisico: 0,
      gaveta: 0,
      cofre: 0,
      loja: 0,
      contas: [],
      formas: [],
    });

    // Extrato
    const logs = ref([]);
    const filtroNatureza = ref('todas');
    const filtroConta = ref('');

    // Transferências
    const transferencias = ref([]);
    const showTransferenciaModal = ref(false);
    const transferindo = ref(false);
    const formTransferencia = ref({ conta_origem: 'gaveta', conta_destino: 'cofre', valor: '', descricao: '' });

    // Cancelar Transferência
    const showCancelarTransfModal = ref(false);
    const transfParaCancelar = ref(null);
    const motivoCancelarTransf = ref('');
    const cancelandoTransf = ref(false);

    // Sessões
    const sessoes = ref([]);

    // Abertura
    const showAbrirModal = ref(false);
    const abrindo = ref(false);
    const infoAberturaData = ref({ saldo_esperado: 0, primeira_abertura: false, limite_divergencia: 10, ultima_sessao: null });
    const formAbertura = ref({ valor_contado: '', justificativa: '', autorizador_login: '', autorizador_senha: '' });

    // Fechamento
    const showFecharModal = ref(false);
    const fechando = ref(false);
    const fechamentoPreviaData = ref({ sessao: null, resumo: null, limite_divergencia: 10 });
    const formFechamento = ref({ valor_contado: '', justificativa: '', observacao: '', autorizador_login: '', autorizador_senha: '' });

    // Lançamento Manual (Despesas com divisão)
    const showAddModal = ref(false);
    const salvandoManual = ref(false);
    const formManual = ref({
      tipo: 'saida',
      valor: '',
      descricao: '',
      categoria: 'Outros',
      favorecido: '',
      pagamentos: [{ forma: 'dinheiro', conta: 'gaveta', valor: '' }],
    });

    // Estorno Manual
    const showEstornoModal = ref(false);
    const lancamentoParaEstornar = ref(null);
    const motivoEstorno = ref('');
    const estornando = ref(false);

    const fmt = (val) => Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatarHora = (dataStr) => dataStr ? new Date(dataStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—';
    const formatarDataHora = (dataStr) => dataStr ? new Date(dataStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

    // ── Carregar Dados ────────────────────────────────────────────────────────
    const fetchCadastros = async () => {
      try {
        const data = await caixaService.formasPagamento();
        formasCadastradas.value = data.formas || [];
        contasCadastradas.value = data.contas || [];
      } catch (err) {
        console.error('Erro ao carregar formas de pagamento:', err);
      }
    };

    const fetchCaixa = async () => {
      loading.value = true;
      try {
        const resumoData = await caixaService.resumo();
        caixaAberto.value = resumoData.caixaAberto;
        sessaoAtual.value = resumoData.sessao;
        if (resumoData.saldos) {
          saldos.value = resumoData.saldos;
        }

        if (pode('caixa.ver')) {
          const listData = await caixaService.listar({ limite: 300 });
          logs.value = listData;
        } else {
          logs.value = [];
        }
      } catch (err) {
        console.error('Erro ao carregar resumo de caixa:', err);
      } finally {
        loading.value = false;
      }
    };

    const fetchTransferencias = async () => {
      try {
        transferencias.value = await caixaService.transferencias();
      } catch (err) {
        console.error('Erro ao carregar transferências:', err);
      }
    };

    const fetchSessoes = async () => {
      try {
        sessoes.value = await caixaService.sessoes();
      } catch (err) {
        console.error('Erro ao carregar sessões:', err);
      }
    };

    const goToTransferencias = () => {
      activeTab.value = 'transferencias';
      fetchTransferencias();
    };

    const goToSessoes = () => {
      activeTab.value = 'sessoes';
      fetchSessoes();
    };

    // ── Computados de Apoio ───────────────────────────────────────────────────
    const formasEletronicas = computed(() => {
      return (saldos.value.formas || []).filter(f => f.codigo !== 'dinheiro');
    });

    const saldoConta = (codigoConta) => {
      const c = (saldos.value.contas || []).find(item => item.codigo === codigoConta);
      return c ? c.saldo : 0;
    };

    const logsFiltrados = computed(() => {
      return logs.value.filter(l => {
        if (filtroNatureza.value !== 'todas' && l.natureza !== filtroNatureza.value) return false;
        if (filtroConta.value) {
          const temNaConta = (l.pagamentos || []).some(p => p.conta?.codigo === filtroConta.value);
          const eTransf = l.transferencia && (l.transferencia.origem === filtroConta.value || l.transferencia.destino === filtroConta.value);
          if (!temNaConta && !eTransf) return false;
        }
        return true;
      });
    });

    // ── Regras de Conferência Abertura ────────────────────────────────────────
    const diferencaAberturaVal = computed(() => {
      const contado = Number(formAbertura.value.valor_contado || 0);
      const esperado = Number(infoAberturaData.value.saldo_esperado || 0);
      return Math.round((contado - esperado) * 100) / 100;
    });

    const temDiferencaAbertura = computed(() => {
      if (formAbertura.value.valor_contado === '') return false;
      return diferencaAberturaVal.value !== 0 && !infoAberturaData.value.primeira_abertura;
    });

    const precisaAutorizacaoAbertura = computed(() => {
      if (!temDiferencaAbertura.value) return false;
      if (pode('caixa.aprovar')) return false;
      const limite = Number(infoAberturaData.value.limite_divergencia || 10);
      return Math.abs(diferencaAberturaVal.value) > limite;
    });

    const abrirModalAbertura = async () => {
      try {
        infoAberturaData.value = await caixaService.aberturaInfo();
        formAbertura.value = {
          valor_contado: infoAberturaData.value.saldo_esperado,
          justificativa: '',
          autorizador_login: '',
          autorizador_senha: '',
        };
        showAbrirModal.value = true;
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao consultar saldo esperado de abertura.');
      }
    };

    const submitAbrirCaixa = async () => {
      if (temDiferencaAbertura.value && (!formAbertura.value.justificativa || formAbertura.value.justificativa.trim().length < 5)) {
        alert('Por favor, informe uma justificativa válida para a divergência de valores (mínimo de 5 caracteres).');
        return;
      }
      if (precisaAutorizacaoAbertura.value && (!formAbertura.value.autorizador_login || !formAbertura.value.autorizador_senha)) {
        alert('A divergência excede o limite. Informe o login e senha de um Gerente para autorizar.');
        return;
      }

      abrindo.value = true;
      try {
        const payload = {
          valor_contado: Number(formAbertura.value.valor_contado),
          justificativa: formAbertura.value.justificativa || null,
          autorizador: precisaAutorizacaoAbertura.value ? {
            login: formAbertura.value.autorizador_login,
            senha: formAbertura.value.autorizador_senha,
          } : null,
        };
        await caixaService.abrir(payload);
        showAbrirModal.value = false;
        await fetchCaixa();
        alert('✅ Caixa aberto com sucesso!');
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao abrir o caixa.');
      } finally {
        abrindo.value = false;
      }
    };

    // ── Regras de Conferência Fechamento ───────────────────────────────────────
    const diferencaFechamentoVal = computed(() => {
      const contado = Number(formFechamento.value.valor_contado || 0);
      const esperado = Number(fechamentoPreviaData.value.resumo?.saldo_esperado || 0);
      return Math.round((contado - esperado) * 100) / 100;
    });

    const temDiferencaFechamento = computed(() => {
      if (formFechamento.value.valor_contado === '') return false;
      return diferencaFechamentoVal.value !== 0;
    });

    const precisaAutorizacaoFechamento = computed(() => {
      if (!temDiferencaFechamento.value) return false;
      if (pode('caixa.aprovar')) return false;
      const limite = Number(fechamentoPreviaData.value.limite_divergencia || 10);
      return Math.abs(diferencaFechamentoVal.value) > limite;
    });

    const abrirModalFechamento = async () => {
      try {
        fechamentoPreviaData.value = await caixaService.fechamentoPrevia();
        formFechamento.value = {
          valor_contado: fechamentoPreviaData.value.resumo?.saldo_esperado ?? 0,
          justificativa: '',
          observacao: '',
          autorizador_login: '',
          autorizador_senha: '',
        };
        showFecharModal.value = true;
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao carregar prévia de fechamento.');
      }
    };

    const confirmarFechamento = async () => {
      if (temDiferencaFechamento.value && (!formFechamento.value.justificativa || formFechamento.value.justificativa.trim().length < 5)) {
        alert('Por favor, informe uma justificativa válida para a divergência apurada (mínimo de 5 caracteres).');
        return;
      }
      if (precisaAutorizacaoFechamento.value && (!formFechamento.value.autorizador_login || !formFechamento.value.autorizador_senha)) {
        alert('A divergência excede o limite. Informe o login e senha de um Gerente para autorizar.');
        return;
      }

      fechando.value = true;
      try {
        const payload = {
          valor_contado: Number(formFechamento.value.valor_contado),
          justificativa: formFechamento.value.justificativa || null,
          observacao: formFechamento.value.observacao || null,
          autorizador: precisaAutorizacaoFechamento.value ? {
            login: formFechamento.value.autorizador_login,
            senha: formFechamento.value.autorizador_senha,
          } : null,
        };
        const res = await caixaService.fechar(payload);
        showFecharModal.value = false;
        await fetchCaixa();
        alert(`✅ Caixa fechado com sucesso!\n\nConferência da gaveta:\n• Saldo Esperado: R$ ${fmt(res.resumo?.saldo_esperado)}\n• Saldo Contado: R$ ${fmt(payload.valor_contado)}\n• Diferença: R$ ${fmt(diferencaFechamentoVal.value)}`);
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao fechar o caixa.');
      } finally {
        fechando.value = false;
      }
    };

    // ── Lançamento Manual com Divisão ─────────────────────────────────────────
    const contasCompativeis = (codigoForma) => {
      if (codigoForma === 'dinheiro') {
        return contasCadastradas.value.filter(c => c.tipo === 'fisica');
      }
      return contasCadastradas.value.filter(c => c.tipo === 'eletronica');
    };

    const onFormaManualChange = (p) => {
      if (p.forma === 'dinheiro') p.conta = 'gaveta';
      else p.conta = 'loja';
    };

    const abrirModalManual = () => {
      formManual.value = {
        tipo: 'saida',
        valor: '',
        descricao: '',
        categoria: 'Outros',
        favorecido: '',
        pagamentos: [{ forma: 'dinheiro', conta: 'gaveta', valor: '' }],
      };
      showAddModal.value = true;
    };

    const adicionarFormaManual = () => {
      formManual.value.pagamentos.push({
        forma: 'pix',
        conta: 'loja',
        valor: restanteManual.value > 0 ? restanteManual.value : '',
      });
    };

    const removerFormaManual = (idx) => {
      formManual.value.pagamentos.splice(idx, 1);
    };

    const totalDistribuidoManual = computed(() => {
      return formManual.value.pagamentos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    });

    const restanteManual = computed(() => {
      const total = Number(formManual.value.valor) || 0;
      return Math.round((total - totalDistribuidoManual.value) * 100) / 100;
    });

    watch(() => formManual.value.valor, (newVal) => {
      if (formManual.value.pagamentos.length === 1 && formManual.value.pagamentos[0].valor === '') {
        formManual.value.pagamentos[0].valor = newVal;
      }
    });

    const submitMovimentacao = async () => {
      if (!formManual.value.valor || Number(formManual.value.valor) <= 0) {
        alert('Informe um valor válido maior que zero.');
        return;
      }
      if (formManual.value.tipo === 'saida' && restanteManual.value !== 0) {
        alert(`A soma das formas de pagamento (R$ ${fmt(totalDistribuidoManual.value)}) deve ser exatamente igual ao valor total da despesa (R$ ${fmt(formManual.value.valor)}).`);
        return;
      }

      salvandoManual.value = true;
      try {
        const payload = {
          tipo: formManual.value.tipo,
          valor: Number(formManual.value.valor),
          descricao: formManual.value.descricao,
          categoria: formManual.value.categoria,
          favorecido: formManual.value.favorecido || null,
          pagamentos: formManual.value.pagamentos.map(p => ({
            forma: p.forma,
            conta: p.conta,
            valor: Number(p.valor),
          })),
        };
        await caixaService.registrarManual(payload);
        showAddModal.value = false;
        await fetchCaixa();
        alert('✅ Movimentação registrada com sucesso!');
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao registrar movimentação.');
      } finally {
        salvandoManual.value = false;
      }
    };

    // ── Estorno de Lançamento Manual ──────────────────────────────────────────
    const abrirModalEstorno = (log) => {
      lancamentoParaEstornar.value = log;
      motivoEstorno.value = '';
      showEstornoModal.value = true;
    };

    const submitEstorno = async () => {
      if (!motivoEstorno.value || motivoEstorno.value.trim().length < 3) {
        alert('Informe o motivo do estorno.');
        return;
      }
      estornando.value = true;
      try {
        await caixaService.estornar(lancamentoParaEstornar.value.id_caixa, motivoEstorno.value.trim());
        showEstornoModal.value = false;
        await fetchCaixa();
        alert('✅ Lançamento estornado com sucesso!');
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao estornar lançamento.');
      } finally {
        estornando.value = false;
      }
    };

    // ── Transferências ────────────────────────────────────────────────────────
    const abrirModalTransferencia = () => {
      formTransferencia.value = {
        conta_origem: 'gaveta',
        conta_destino: 'cofre',
        valor: '',
        descricao: '',
      };
      showTransferenciaModal.value = true;
    };

    const submitTransferencia = async () => {
      if (!formTransferencia.value.valor || Number(formTransferencia.value.valor) <= 0) {
        alert('Informe um valor de transferência válido.');
        return;
      }
      if (formTransferencia.value.conta_origem === formTransferencia.value.conta_destino) {
        alert('A conta de origem e destino devem ser diferentes.');
        return;
      }
      const disponivel = saldoConta(formTransferencia.value.conta_origem);
      if (Number(formTransferencia.value.valor) > disponivel) {
        alert(`Saldo insuficiente na conta de origem (Disponível: R$ ${fmt(disponivel)}).`);
        return;
      }

      transferindo.value = true;
      try {
        await caixaService.criarTransferencia({
          conta_origem: formTransferencia.value.conta_origem,
          conta_destino: formTransferencia.value.conta_destino,
          valor: Number(formTransferencia.value.valor),
          descricao: formTransferencia.value.descricao || null,
        });
        showTransferenciaModal.value = false;
        await fetchCaixa();
        if (activeTab.value === 'transferencias') await fetchTransferencias();
        alert('✅ Transferência efetivada com sucesso!');
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao realizar transferência.');
      } finally {
        transferindo.value = false;
      }
    };

    const abrirModalCancelarTransferencia = (t) => {
      transfParaCancelar.value = t;
      motivoCancelarTransf.value = '';
      showCancelarTransfModal.value = true;
    };

    const submitCancelarTransferencia = async () => {
      if (!motivoCancelarTransf.value || motivoCancelarTransf.value.trim().length < 3) {
        alert('Informe o motivo do cancelamento.');
        return;
      }
      cancelandoTransf.value = true;
      try {
        await caixaService.cancelarTransferencia(transfParaCancelar.value.id_transferencia, motivoCancelarTransf.value.trim());
        showCancelarTransfModal.value = false;
        await fetchTransferencias();
        await fetchCaixa();
        alert('✅ Transferência cancelada! O saldo foi revertido para a conta de origem.');
      } catch (err) {
        alert(err.response?.data?.error || 'Erro ao cancelar transferência.');
      } finally {
        cancelandoTransf.value = false;
      }
    };

    onMounted(async () => {
      await fetchCadastros();
      await fetchCaixa();
    });

    return {
      loading, activeTab, caixaAberto, sessaoAtual, saldos, formasCadastradas, contasCadastradas,
      formasEletronicas, saldoConta, logsFiltrados, filtroNatureza, filtroConta,
      transferencias, sessoes,
      showAbrirModal, abrindo, infoAberturaData, formAbertura, temDiferencaAbertura, diferencaAberturaVal, precisaAutorizacaoAbertura,
      showFecharModal, fechando, fechamentoPreviaData, formFechamento, temDiferencaFechamento, diferencaFechamentoVal, precisaAutorizacaoFechamento,
      showAddModal, salvandoManual, formManual, totalDistribuidoManual, restanteManual,
      showTransferenciaModal, transferindo, formTransferencia,
      showEstornoModal, lancamentoParaEstornar, motivoEstorno, estornando,
      showCancelarTransfModal, transfParaCancelar, motivoCancelarTransf, cancelandoTransf,
      fmt, formatarHora, formatarDataHora,
      goToTransferencias, goToSessoes, fetchCaixa,
      abrirModalAbertura, submitAbrirCaixa,
      abrirModalFechamento, confirmarFechamento,
      abrirModalManual, adicionarFormaManual, removerFormaManual, onFormaManualChange, contasCompativeis, submitMovimentacao,
      abrirModalEstorno, submitEstorno,
      abrirModalTransferencia, submitTransferencia,
      abrirModalCancelarTransferencia, submitCancelarTransferencia,
    };
  },
});
</script>

<style scoped>
.caixa-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title { font-size: 2rem; margin-bottom: 4px; }
.page-subtitle { color: var(--text-muted); font-size: 0.95rem; }
.btn-icon { width: 18px; height: 18px; }
.btn-icon-sm { width: 14px; height: 14px; }

/* ── Tabs ───────────────────────────────────────────────────────────────── */
.tabs-container {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
}
.tab-btn {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid transparent;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.tab-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.04); }
.tab-btn.active {
  color: #fff;
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
}

/* ── Caixa Fechado ──────────────────────────────────────────────────────── */
.caixa-fechado-card {
  display: flex;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
}
.caixa-fechado-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.caixa-fechado-icon { font-size: 3rem; }

/* ── Grid de Saldos ─────────────────────────────────────────────────────── */
.grid-saldos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.saldo-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  position: relative;
}
.card-total { border-left: 4px solid var(--primary); }
.card-dinheiro { border-left: 4px solid var(--success); }
.card-eletronico { border-left: 4px solid #38bdf8; }

.saldo-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.saldo-tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary);
}
.tag-dinheiro { background: rgba(34, 197, 94, 0.15); color: var(--success); }
.tag-eletronico { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
.saldo-icon { width: 22px; height: 22px; color: var(--text-muted); opacity: 0.7; }

.saldo-title { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
.saldo-valor { font-size: 1.8rem; margin: 6px 0; font-family: var(--font-heading); }
.saldo-meta { font-size: 0.75rem; }

.saldo-subdetalhes {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sub-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

/* ── Fechamento Resumo ──────────────────────────────────────────────────── */
.fechamento-resumo {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.resumo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  font-size: 0.9rem;
  border-bottom: 1px solid var(--border);
}
.resumo-row:last-child { border-bottom: none; }
.resumo-total { background: rgba(255, 255, 255, 0.04); font-size: 0.95rem; }

/* ── Conferência & Divergências ─────────────────────────────────────────── */
.conferencia-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
}
.conferencia-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.divergencia-alerta {
  border-radius: 8px;
  padding: 12px;
  font-size: 0.9rem;
}
.alerta-falta {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
}
.alerta-sobra {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #86efac;
}
.autorizacao-box {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 8px;
  padding: 12px;
}

/* ── Divisão de Pagamento ───────────────────────────────────────────────── */
.divisao-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}
.divisao-totalizador {
  background: rgba(255, 255, 255, 0.04);
  padding: 8px 12px;
  border-radius: 6px;
}
.pagamento-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 6px;
  margin-right: 4px;
  margin-bottom: 2px;
  font-size: 0.75rem;
}

/* ── Badges ─────────────────────────────────────────────────────────────── */
.badge-transferencia {
  background: rgba(147, 51, 234, 0.15);
  color: #c084fc;
  border: 1px solid rgba(147, 51, 234, 0.3);
}

.row-estornado td {
  background: rgba(239, 68, 68, 0.03);
}

.btn-danger-solid {
  background: var(--danger);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn-danger-solid:hover { opacity: 0.85; }

@media (max-width: 968px) {
  .grid-saldos { grid-template-columns: 1fr; }
}
</style>
