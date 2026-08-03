<template>
  <div class="os-viewer-overlay" @keydown.esc="$emit('close')" tabindex="0" ref="overlayRef">
    <!-- ── Barra superior (Padrão Guicell) ── -->
    <div class="osv-topbar">
      <!-- Logo / Marca -->
      <div class="osv-topbar-brand">
        <img src="/logo-new.png" alt="Guicell Logo" class="osv-brand-img" />
        <div class="osv-brand-text">
          <span class="osv-brand-name">GUICELL</span>
          <span class="osv-brand-sub">Assistência Técnica e Acessórios</span>
        </div>
      </div>

      <div class="osv-sep"></div>

      <!-- Título da OS + Status -->
      <div class="osv-doc-info">
        <span class="osv-doc-title">OS #{{ os?.numero?.toString().padStart(5, '0') }}</span>
        <span :class="['osv-badge', getBadgeClass(os?.status)]">{{ os?.status }}</span>
      </div>

      <div class="osv-flex1"></div>

      <!-- Controles de Zoom -->
      <div class="osv-zoom-group">
        <button class="osv-icon-btn" @click="zoomOut" title="Reduzir zoom (-)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <span class="osv-zoom-label">{{ zoom }}%</span>
        <button class="osv-icon-btn" @click="zoomIn" title="Aumentar zoom (+)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
      </div>

      <div class="osv-sep"></div>

      <!-- Ações Principais no Topo -->
      <button class="osv-action-btn osv-btn-email" @click="openEmail" title="Enviar por E-mail" :disabled="isSendingEmail">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <span>Enviar E-mail</span>
      </button>

      <button class="osv-action-btn osv-btn-whatsapp" @click="openWhatsapp" title="Enviar por WhatsApp" :disabled="isSendingWhatsapp">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        <span>WhatsApp</span>
      </button>

      <button class="osv-action-btn osv-btn-print" @click="handlePrint" title="Imprimir OS" :disabled="isGenerating">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        <span>Imprimir</span>
      </button>

      <button class="osv-action-btn osv-btn-download" @click="handleDownload" title="Baixar PDF" :disabled="isGenerating">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Baixar PDF</span>
      </button>

      <div class="osv-sep"></div>

      <!-- Botão Fechar -->
      <button class="osv-close-btn" @click="$emit('close')" title="Fechar visualizador (Esc)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- ── Área principal do Documento ── -->
    <div class="osv-body">
      <!-- Loading overlay -->
      <div v-if="isGenerating" class="osv-loading">
        <div class="osv-spinner"></div>
        <span>Gerando documento PDF...</span>
      </div>

      <div class="osv-doc-area">
        <div class="osv-paper-wrapper" :style="{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }">
          <!-- ═══ DOCUMENTO DE OS (Modelo Impressão A4) ═══ -->
          <div class="os-doc" ref="osDocRef">
            <!-- Cabeçalho com Logo do Guicell -->
            <div class="os-doc-header">
              <div class="os-doc-logo-area">
                <img src="/logo-new.png" alt="Guicell Logo" class="os-doc-logo-img" />
                <div>
                  <div class="os-doc-empresa">GUICELL</div>
                  <div class="os-doc-slogan">Assistência Técnica e Acessórios</div>
                </div>
              </div>
              <div class="os-doc-title-area">
                <div class="os-doc-main-title">Ordem de Serviço</div>
                <div class="os-doc-numero">#{{ os?.numero?.toString().padStart(5, '0') }}</div>
                <div class="os-doc-data">{{ dataAbertura }}</div>
              </div>
            </div>

            <!-- Status bar -->
            <div class="os-doc-status-bar">
              <div class="os-doc-status-item">
                <span class="os-doc-status-label">Status</span>
                <span :class="['os-doc-status-val', 'os-status-' + statusSlug]">{{ os?.status }}</span>
              </div>
              <div class="os-doc-status-item">
                <span class="os-doc-status-label">Técnico</span>
                <span class="os-doc-status-val">{{ os?.tecnico || 'Não atribuído' }}</span>
              </div>
              <div class="os-doc-status-item">
                <span class="os-doc-status-label">Prazo Estimado</span>
                <span class="os-doc-status-val">{{ os?.prazo || 'Não definido' }}</span>
              </div>
            </div>

            <!-- Grid: Cliente / Aparelho -->
            <div class="os-doc-grid2">
              <!-- Cliente -->
              <div class="os-doc-section">
                <div class="os-doc-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Dados do Cliente
                </div>
                <div class="os-doc-field"><span class="os-doc-field-label">Nome</span><span class="os-doc-field-val">{{ os?.cliente }}</span></div>
                <div class="os-doc-field" v-if="os.telefone_cliente"><span class="os-doc-field-label">Telefone</span><span class="os-doc-field-val">{{ os.telefone_cliente }}</span></div>
                <div class="os-doc-field" v-if="os.email_cliente"><span class="os-doc-field-label">E-mail</span><span class="os-doc-field-val">{{ os.email_cliente }}</span></div>
              </div>

              <!-- Aparelho -->
              <div class="os-doc-section">
                <div class="os-doc-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  Aparelho
                </div>
                <div class="os-doc-field"><span class="os-doc-field-label">Modelo</span><span class="os-doc-field-val os-doc-field-bold">{{ os?.aparelho }}</span></div>
              </div>
            </div>

            <!-- Defeito / Diagnóstico -->
            <div :class="isFinalized ? 'os-doc-grid2' : ''">
              <!-- Defeito: sempre visível -->
              <div class="os-doc-section">
                <div class="os-doc-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Defeito Relatado
                </div>
                <div class="os-doc-textarea-val">{{ os?.defeito || 'Não informado.' }}</div>
              </div>
              <!-- Diagnóstico: só quando finalizado -->
              <div class="os-doc-section" v-if="isFinalized">
                <div class="os-doc-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  Diagnóstico Técnico
                </div>
                <div class="os-doc-textarea-val">{{ os?.diagnostico || 'Sem diagnóstico registrado.' }}</div>
              </div>
            </div>

            <!-- Peças Utilizadas -->
            <div class="os-doc-section os-doc-section-full" v-if="os?.parts && os.parts.length > 0">
              <div class="os-doc-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Peças e Serviços Utilizados
              </div>
              <table class="os-doc-table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th class="text-center">Qtd</th>
                    <th class="text-right">Unitário</th>
                    <th class="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(part, i) in os.parts" :key="i">
                    <td>{{ part.descricao }}</td>
                    <td class="text-center">{{ part.qtd || 1 }}</td>
                    <td class="text-right">{{ formatMoney(part.preco) }}</td>
                    <td class="text-right">{{ formatMoney(part.preco * (part.qtd || 1)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totais -->
            <div class="os-doc-totais">
              <div class="os-doc-totais-row os-doc-totais-final">
                <span>{{ isFinalized ? 'TOTAL FINAL' : 'TOTAL PREVISTO' }}</span>
                <span class="os-doc-total-val">{{ formatMoney(valorFinal) }}</span>
              </div>
            </div>

            <!-- Assinaturas -->
            <div class="os-doc-assinaturas">
              <div class="os-doc-assinatura-box">
                <div class="os-doc-assinatura-line"></div>
                <div class="os-doc-assinatura-label">Assinatura do Técnico</div>
              </div>
              <div class="os-doc-assinatura-box">
                <div class="os-doc-assinatura-line"></div>
                <div class="os-doc-assinatura-label">Assinatura do Cliente</div>
              </div>
            </div>

            <!-- Rodapé -->
            <div class="os-doc-footer">
              <span>GUICELL Assistência Técnica e Acessórios</span>
              <span>•</span>
              <span>Emitido em {{ dataEmissao }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal de E-mail (Estilo Guicell) ── -->
    <div v-if="showEmailModal" class="osv-email-overlay" @click.self="showEmailModal = false">
      <div class="osv-email-modal">
        <div class="osv-email-modal-header">
          <div class="osv-email-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px;color:#008f39"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h3>Enviar OS por E-mail</h3>
        </div>
        <p class="osv-email-desc">
          A OS <strong>#{{ os?.numero }}</strong> será enviada em formato PDF para o endereço abaixo.
        </p>
        <div class="osv-email-field">
          <label>E-mail do Cliente</label>
          <input
            type="email"
            v-model="emailTo"
            placeholder="cliente@exemplo.com"
            class="osv-email-input"
            @keyup.enter="sendEmail"
          />
        </div>
        <div class="osv-email-actions">
          <button class="osv-email-cancel" @click="showEmailModal = false" :disabled="isSendingEmail">Cancelar</button>
          <button class="osv-email-send" @click="sendEmail" :disabled="isSendingEmail || !emailTo">
            <span v-if="isSendingEmail" class="osv-spinner-sm"></span>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {{ isSendingEmail ? 'Enviando...' : 'Enviar Agora' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal de WhatsApp ── -->
    <div v-if="showWhatsappModal" class="osv-email-overlay" @click.self="showWhatsappModal = false">
      <div class="osv-email-modal">
        <div class="osv-email-modal-header">
          <div class="osv-email-icon-wrap" style="background:#e8f9ef;color:#25d366">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </div>
          <h3>Enviar OS por WhatsApp</h3>
        </div>
        <p class="osv-email-desc">
          A OS <strong>#{{ os?.numero }}</strong> será enviada em formato PDF para o WhatsApp abaixo.
        </p>
        <div class="osv-email-field">
          <label>WhatsApp do Cliente (com DDD)</label>
          <input
            type="text"
            v-model="whatsappTo"
            placeholder="Ex: 62999999999"
            class="osv-email-input"
            @keyup.enter="sendWhatsapp"
          />
        </div>
        <div class="osv-email-actions">
          <button class="osv-email-cancel" @click="showWhatsappModal = false" :disabled="isSendingWhatsapp">Cancelar</button>
          <button class="osv-email-send" style="background:#25d366;border-color:#25d366" @click="sendWhatsapp" :disabled="isSendingWhatsapp || !whatsappTo">
            <span v-if="isSendingWhatsapp" class="osv-spinner-sm"></span>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {{ isSendingWhatsapp ? 'Enviando...' : 'Enviar Agora' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Toast de notificação ── -->
    <transition name="osv-toast">
      <div v-if="toast.show" :class="['osv-toast', 'osv-toast-' + toast.type]">
        <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import api from '../services/api.js';

// Carrega jsPDF + html2canvas via CDN se necessário
let jspdfLoaded = false;
let html2canvasLoaded = false;

async function loadJsPDF() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => resolve(window.jspdf.jsPDF);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadHtml2Canvas() {
  if (window.html2canvas) return window.html2canvas;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default defineComponent({
  name: 'OsViewer',
  emits: ['close'],
  props: {
    os: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    const overlayRef = ref(null);
    const osDocRef = ref(null);
    const zoom = ref(85);
    const isGenerating = ref(false);
    const showEmailModal = ref(false);
    const emailTo = ref(props.os?.email_cliente || '');
    const isSendingEmail = ref(false);

    const showWhatsappModal = ref(false);
    const whatsappTo = ref(props.os?.telefone_cliente || '');
    const isSendingWhatsapp = ref(false);

    const toast = ref({ show: false, message: '', type: 'success' });
    let toastTimer = null;

    const showToast = (message, type = 'success') => {
      clearTimeout(toastTimer);
      toast.value = { show: true, message, type };
      toastTimer = setTimeout(() => { toast.value.show = false; }, 3500);
    };

    const valorFinal = computed(() => {
      if (!props.os) return 0;
      const total = (props.os.maoObra || 0) + (props.os.partsTotal || 0);
      return Math.max(0, total - (props.os.desconto || 0));
    });

    const dataAbertura = computed(() => {
      if (!props.os) return '';
      const d = props.os.data_abertura_raw ? new Date(props.os.data_abertura_raw) : new Date();
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    });

    const dataEmissao = computed(() => {
      return new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    });

    const statusSlug = computed(() => {
      return (props.os?.status || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    });

    const isFinalized = computed(() => {
      return ['Concluído', 'Entregue'].includes(props.os?.status);
    });

    const formatMoney = (v) => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const getBadgeClass = (status) => {
      const map = {
        'Aguardando Diagnóstico': 'osv-badge-warning',
        'Aguardando Cliente': 'osv-badge-purple',
        'Aguardando Peça': 'osv-badge-danger',
        'Em Reparo': 'osv-badge-info',
        'Concluído': 'osv-badge-success',
        'Entregue': 'osv-badge-success',
        'Cancelado': 'osv-badge-muted',
      };
      return map[status] || 'osv-badge-muted';
    };

    const generatePdfBlob = async () => {
      isGenerating.value = true;
      try {
        const [JsPDF, html2canvas] = await Promise.all([loadJsPDF(), loadHtml2Canvas()]);
        const el = osDocRef.value;
        if (!el) throw new Error('Elemento não encontrado.');

        const savedZoom = zoom.value;
        zoom.value = 100;
        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });

        zoom.value = savedZoom;

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = 210;
        const pageH = 297;
        const imgW = pageW;
        const imgH = (canvas.height / canvas.width) * imgW;

        let yOffset = 0;
        let remaining = imgH;

        while (remaining > 0) {
          pdf.addImage(imgData, 'JPEG', 0, -yOffset, imgW, imgH);
          remaining -= pageH;
          if (remaining > 0) {
            pdf.addPage();
            yOffset += pageH;
          }
        }

        return pdf.output('blob');
      } finally {
        isGenerating.value = false;
      }
    };

    const handlePrint = async () => {
      try {
        const blob = await generatePdfBlob();
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) {
          win.onload = () => { win.focus(); win.print(); };
        } else {
          showToast('Permita popups para imprimir.', 'error');
        }
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } catch (e) {
        console.error(e);
        showToast('Erro ao gerar documento para impressão.', 'error');
      }
    };

    const handleDownload = async () => {
      try {
        const blob = await generatePdfBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OS-${props.os?.numero?.toString().padStart(5, '0')}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        showToast('PDF baixado com sucesso!');
      } catch (e) {
        console.error(e);
        showToast('Erro ao gerar o PDF para download.', 'error');
      }
    };

    const openWhatsapp = () => {
      whatsappTo.value = props.os?.telefone_cliente || '';
      showWhatsappModal.value = true;
    };

    const sendWhatsapp = async () => {
      if (!whatsappTo.value) return showToast('Informe o WhatsApp de destino.', 'error');
      isSendingWhatsapp.value = true;
      try {
        const blob = await generatePdfBlob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        try {
          await api.post('/ordens-servico/enviar-whatsapp', {
            id_os: props.os.id_os,
            telefone: whatsappTo.value,
            numero_os: props.os.numero,
            pdf_base64: base64,
          });
          showToast('WhatsApp enviado com sucesso!');
        } catch (apiErr) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `OS-${props.os?.numero?.toString().padStart(5, '0')}.pdf`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          showToast('Erro ao enviar via API. PDF baixado.', 'error');
        }

        showWhatsappModal.value = false;
      } catch (e) {
        console.error(e);
        showToast('Erro ao processar envio de WhatsApp.', 'error');
      } finally {
        isSendingWhatsapp.value = false;
      }
    };

    const openEmail = () => {
      emailTo.value = props.os?.email_cliente || '';
      showEmailModal.value = true;
    };

    const sendEmail = async () => {
      if (!emailTo.value) return showToast('Informe o e-mail de destino.', 'error');
      isSendingEmail.value = true;
      try {
        const blob = await generatePdfBlob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        try {
          await api.post('/ordens-servico/enviar-email', {
            id_os: props.os.id_os,
            email: emailTo.value,
            numero_os: props.os.numero,
            pdf_base64: base64,
          });
          showToast('E-mail enviado com sucesso!');
        } catch (apiErr) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `OS-${props.os?.numero?.toString().padStart(5, '0')}.pdf`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          window.open(`mailto:${emailTo.value}?subject=Ordem+de+Servi%C3%A7o+%23${props.os?.numero}&body=Ol%C3%A1%2C+segue+em+anexo+a+OS+%23${props.os?.numero}.+O+PDF+foi+baixado+automaticamente.`);
          showToast('PDF baixado. Anexe ao e-mail manualmente.');
        }

        showEmailModal.value = false;
      } catch (e) {
        console.error(e);
        showToast('Erro ao processar envio de e-mail.', 'error');
      } finally {
        isSendingEmail.value = false;
      }
    };

    const zoomIn = () => { zoom.value = Math.min(zoom.value + 10, 150); };
    const zoomOut = () => { zoom.value = Math.max(zoom.value - 10, 40); };

    const handleKey = (e) => {
      if (e.key === 'Escape') emit('close');
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    };

    onMounted(() => {
      overlayRef.value?.focus();
      window.addEventListener('keydown', handleKey);
      loadJsPDF().catch(() => {});
      loadHtml2Canvas().catch(() => {});
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(toastTimer);
    });

    return {
      overlayRef,
      osDocRef,
      zoom,
      isGenerating,
      showEmailModal,
      emailTo,
      isSendingEmail,
      showWhatsappModal,
      whatsappTo,
      isSendingWhatsapp,
      toast,
      valorFinal,
      isFinalized,
      dataAbertura,
      dataEmissao,
      statusSlug,
      formatMoney,
      getBadgeClass,
      handlePrint,
      handleDownload,
      openEmail,
      sendEmail,
      openWhatsapp,
      sendWhatsapp,
      zoomIn,
      zoomOut,
    };
  }
});
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   OsViewer — Layout alinhado com o Design System Guicell
═══════════════════════════════════════════════════ */
.os-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: var(--bg-dark, #070a13);
  display: flex;
  flex-direction: column;
  outline: none;
  animation: osvFadeIn 0.2s ease;
}

@keyframes osvFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── Topbar no estilo Guicell ── */
.osv-topbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: var(--bg-card, #0f1322);
  border-bottom: 1px solid var(--border, #1e293b);
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.osv-topbar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.osv-brand-img {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.osv-brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.osv-brand-name {
  color: var(--text-white, #ffffff);
  font-family: var(--font-heading, sans-serif);
  font-weight: 800;
  font-size: 1rem;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.osv-brand-sub {
  color: var(--primary, #008f39);
  font-family: var(--font-heading, sans-serif);
  font-weight: 500;
  font-size: 0.68rem;
  white-space: nowrap;
  letter-spacing: 0.03em;
}

.osv-sep {
  width: 1px;
  height: 24px;
  background: var(--border, #1e293b);
  margin: 0 0.3rem;
  flex-shrink: 0;
}

.osv-doc-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.osv-doc-title {
  color: var(--text-normal, #e2e8f0);
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}

.osv-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.osv-badge-warning  { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
.osv-badge-purple   { background: rgba(167,139,250,0.15); color: #a78bfa; border: 1px solid rgba(167,139,250,0.3); }
.osv-badge-danger   { background: rgba(239,68,68,0.15);  color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
.osv-badge-info     { background: rgba(59,130,246,0.15);  color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }
.osv-badge-success  { background: rgba(34,197,94,0.15);  color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
.osv-badge-muted    { background: rgba(136,146,176,0.15); color: #8892b0; border: 1px solid rgba(136,146,176,0.3); }

.osv-flex1 { flex: 1; }

/* Controles de Zoom */
.osv-zoom-group {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--bg-input, #151a2d);
  border: 1px solid var(--border, #1e293b);
  border-radius: 8px;
  padding: 0.2rem 0.6rem;
}

.osv-zoom-label {
  color: var(--text-normal, #e2e8f0);
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
}

.osv-icon-btn {
  background: none;
  border: none;
  color: var(--text-muted, #8892b0);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
}
.osv-icon-btn:hover { background: rgba(255,255,255,0.08); color: var(--text-white, #fff); }

/* Botões de Ação na Topbar (Guicell style) */
.osv-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  font-family: var(--font-heading, sans-serif);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  border: 1px solid transparent;
}
.osv-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.osv-btn-email {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}
.osv-btn-email:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.22);
  color: #93c5fd;
}

.osv-btn-print {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border, #1e293b);
  color: var(--text-normal, #e2e8f0);
}
.osv-btn-print:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-white, #fff);
}

.osv-btn-download {
  background: var(--primary, #008f39);
  color: #ffffff;
}
.osv-btn-download:hover:not(:disabled) {
  background: var(--primary-hover, #00aa44);
  box-shadow: 0 0 12px var(--primary-glow);
}

.osv-close-btn {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 8px;
  padding: 0.45rem;
  cursor: pointer;
  color: #f87171;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}
.osv-close-btn:hover { background: rgba(239,68,68,0.22); color: #fca5a5; }

/* ── Body ── */
.osv-body {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  position: relative;
  background: radial-gradient(ellipse at 50% 0%, rgba(0, 143, 57, 0.06) 0%, transparent 70%),
              var(--bg-dark, #070a13);
}

/* Loading */
.osv-loading {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(7, 10, 19, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-normal);
  font-size: 0.95rem;
  font-weight: 500;
}

.osv-spinner {
  width: 38px;
  height: 38px;
  border: 3px solid rgba(0, 143, 57, 0.2);
  border-top-color: var(--primary, #008f39);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.osv-doc-area {
  width: 100%;
  display: flex;
  justify-content: center;
}

.osv-paper-wrapper {
  transition: transform 0.2s ease;
  transform-origin: top center;
}

/* ════════════════════════════════════
   O DOCUMENTO A4 DE IMPRESSÃO DA OS
════════════════════════════════════ */
.os-doc {
  background: #ffffff;
  color: #0f172a;
  width: 794px; /* A4 padrão */
  min-height: 1123px;
  padding: 48px 52px;
  border-radius: 4px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.6);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Cabeçalho do documento */
.os-doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 3px solid #008f39;
}

.os-doc-logo-area {
  display: flex;
  align-items: center;
  gap: 14px;
}

.os-doc-logo-img {
  height: 52px;
  width: auto;
  object-fit: contain;
}

.os-doc-empresa {
  font-size: 20px;
  font-weight: 800;
  color: #070a13;
  letter-spacing: -0.5px;
  font-family: 'Outfit', sans-serif;
  line-height: 1.2;
}

.os-doc-slogan {
  font-size: 11px;
  color: #475569;
  font-weight: 500;
  margin-top: 2px;
}

.os-doc-title-area {
  text-align: right;
}

.os-doc-main-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #008f39;
  margin-bottom: 2px;
}

.os-doc-numero {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  font-family: monospace;
  letter-spacing: 0.5px;
}

.os-doc-data {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

/* Status bar */
.os-doc-status-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.os-doc-status-item {
  background: #f8fafc;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.os-doc-status-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #64748b;
}

.os-doc-status-val {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

/* Cores de status na folha */
.os-status-aguardando-diagn-stico { color: #d97706; }
.os-status-aguardando-cliente      { color: #7c3aed; }
.os-status-aguardando-pe-a         { color: #dc2626; }
.os-status-em-reparo               { color: #2563eb; }
.os-status-conclu-do, .os-status-entregue { color: #16a34a; }
.os-status-cancelado               { color: #64748b; }

/* Grid 2 Colunas */
.os-doc-grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.os-doc-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.os-doc-section-full {
  grid-column: 1 / -1;
}

.os-doc-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #008f39;
  margin-bottom: 4px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}

.os-doc-field {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
  padding: 2px 0;
}

.os-doc-field-label {
  color: #64748b;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.os-doc-field-val {
  color: #0f172a;
  font-weight: 500;
  text-align: right;
}

.os-doc-field-bold { font-weight: 700; }
.os-mono { font-family: monospace; font-size: 11px; }

.os-doc-textarea-val {
  font-size: 12px;
  color: #334155;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* Tabela de peças */
.os-doc-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 4px;
}

.os-doc-table th {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  background: #f1f5f9;
}

.os-doc-table td {
  font-size: 12px;
  padding: 8px 10px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.os-doc-table tr:last-child td { border-bottom: none; }

.text-center { text-align: center; }
.text-right  { text-align: right; }

/* Totais */
.os-doc-totais {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-top: auto;
}

.os-doc-totais-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 13px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.os-doc-totais-row:last-child { border-bottom: none; }
.os-doc-desconto { color: #dc2626; }

.os-doc-totais-final {
  background: #008f39;
  color: #ffffff !important;
  font-weight: 800;
  font-size: 15px;
}

.os-doc-total-val {
  font-size: 18px;
  font-weight: 800;
}

/* Assinaturas */
.os-doc-assinaturas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 16px;
}

.os-doc-assinatura-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.os-doc-assinatura-line {
  width: 100%;
  border-bottom: 1px dashed #cbd5e1;
  margin-bottom: 4px;
}

.os-doc-assinatura-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

/* Rodapé */
.os-doc-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  color: #64748b;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

/* ── Modal E-mail (Estilo Guicell) ── */
.osv-email-overlay {
  position: fixed;
  inset: 0;
  z-index: 10001;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: osvFadeIn 0.15s ease;
}

.osv-email-modal {
  background: var(--bg-card, #0f1322);
  border: 1px solid var(--border, #1e293b);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.6);
}

.osv-email-modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.osv-email-icon-wrap {
  background: rgba(0, 143, 57, 0.12);
  padding: 0.5rem;
  border-radius: 50%;
}

.osv-email-modal-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-white, #ffffff);
  margin: 0;
}

.osv-email-desc {
  color: var(--text-muted, #8892b0);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.osv-email-desc strong { color: var(--text-white, #ffffff); }

.osv-email-field {
  margin-bottom: 1.5rem;
}

.osv-email-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted, #8892b0);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.osv-email-input {
  width: 100%;
  background: var(--bg-input, #151a2d);
  border: 1px solid var(--border, #1e293b);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--text-white, #ffffff);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.osv-email-input::placeholder { color: rgba(136,146,176,0.4); }
.osv-email-input:focus { border-color: var(--primary, #008f39); }

.osv-email-actions {
  display: flex;
  gap: 0.75rem;
}

.osv-email-cancel {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border, #1e293b);
  border-radius: 8px;
  padding: 0.75rem;
  color: var(--text-muted, #8892b0);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.osv-email-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: var(--text-white, #ffffff); }

.osv-email-send {
  flex: 1;
  background: var(--primary, #008f39);
  border: none;
  border-radius: 8px;
  padding: 0.75rem;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.15s;
}
.osv-email-send:hover:not(:disabled) { background: var(--primary-hover, #00aa44); }
.osv-email-send:disabled { opacity: 0.4; cursor: not-allowed; }

.osv-spinner-sm {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── Toast ── */
.osv-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10002;
  background: var(--bg-card, #0f1322);
  border: 1px solid var(--border, #1e293b);
  border-radius: 10px;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-white, #ffffff);
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  white-space: nowrap;
}

.osv-toast-success { border-color: rgba(34,197,94,0.4); }
.osv-toast-success svg { color: #22c55e; }
.osv-toast-error   { border-color: rgba(239,68,68,0.4); }
.osv-toast-error svg { color: #ef4444; }

.osv-toast-enter-active, .osv-toast-leave-active { transition: all 0.25s ease; }
.osv-toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(12px); }
.osv-toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(12px); }
</style>
