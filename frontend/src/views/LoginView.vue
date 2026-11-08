<template>
  <div class="login-page">
    <div class="login-container">
      
      <!-- Left Branding Panel with Hero Image Background -->
      <div class="brand-panel" :style="{ backgroundImage: 'url(' + loginHero + ')' }">
        <div class="brand-header">
          <!-- Logo -->
          <div class="logo-wrapper">
            <img src="/logo-new.png" alt="Guicell Manager Logo" class="brand-icon-img" />
            <div class="brand-text">
              <span class="brand-name">GUICELL</span>
              <span class="brand-sub">MANAGER</span>
            </div>
          </div>
          <div class="logo-divider"></div>
        </div>

        <div class="brand-content">
          <h1 class="main-headline">
            O sistema de gestão completo para <span class="highlight">sua assistência técnica de celulares</span>
          </h1>
          <p class="sub-headline">
            Mais controle, agilidade e organização para o seu negócio.
          </p>

          <!-- Bullet Points -->
          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div class="feature-text">
                <h3>Ordens de Serviço</h3>
                <p>Gerencie e acompanhe todas as OS em tempo real.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div class="feature-text">
                <h3>Clientes</h3>
                <p>Cadastre e gerencie clientes de forma rápida e eficiente.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div class="feature-text">
                <h3>Financeiro</h3>
                <p>Fluxo de caixa, contas a pagar e receber e muito mais.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon-wrapper">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div class="feature-text">
                <h3>Estoque</h3>
                <p>Controle de peças e produtos com precisão.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Form Panel -->
      <div class="form-panel">
        <div class="white-card">
          <div class="card-header text-center">
            <h2>Bem-vindo <span class="highlight-green">de volta!</span></h2>
            <p class="subtitle">Faça login para acessar o Guicell Manager</p>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            <!-- Mensagem de Erro -->
            <div v-if="errorMsg" class="alert-error">
              <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{{ errorMsg }}</span>
            </div>

            <!-- Usuário -->
            <div class="form-group">
              <label for="login">Usuário</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input 
                  type="text" 
                  id="login" 
                  v-model="login" 
                  placeholder="Digite seu usuário" 
                  required 
                  class="input-control login-input"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label for="password">Senha</label>
              <div class="input-wrapper has-suffix">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  id="password" 
                  v-model="password" 
                  placeholder="Digite sua senha" 
                  required 
                  class="input-control login-input"
                />
                <!-- Eye icon to toggle password visibility -->
                <svg 
                  class="eye-icon" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="2"
                  @click="showPassword = !showPassword"
                >
                  <path v-if="showPassword" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line v-if="showPassword" x1="1" y1="1" x2="23" y2="23" />
                  <path v-if="!showPassword" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle v-if="!showPassword" cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>

            <!-- Remember Me / Forgot Password -->
            <div class="form-actions">
              <label class="remember-me">
                <input type="checkbox" v-model="rememberMe" />
                <span class="checkmark"></span>
                Lembrar de mim
              </label>
              <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">Esqueci minha senha</a>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn btn-block" :disabled="isLoading">
              <span>{{ isLoading ? 'Entrando...' : 'Entrar' }}</span>
              <svg v-if="!isLoading" class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <!-- Protected Data Badge -->
            <div class="protected-badge">
              <svg class="shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 11 11 13 15 9" />
              </svg>
              <span>Seus dados estão protegidos</span>
            </div>
          </form>
        </div>
        
        <!-- Footer nested inside white form-panel -->
        <footer class="login-footer">
          <p>© 2026 <span class="highlight-green-footer">Guicell Manager</span>. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  </div>

    <!-- Modal: Recuperação de Senha -->
    <div v-if="showForgotModal" class="modal-overlay" @click.self="closeForgotModal">
      <div class="modal-content forgot-modal-content">
        <div class="modal-header">
          <div>
            <h3 class="m-0 text-white font-bold text-lg">Recuperar Senha</h3>
            <p class="text-muted text-xs m-0">
              <span v-if="forgotStep === 1">Passo 1 de 3: Escolha onde receber seu código</span>
              <span v-else-if="forgotStep === 2">Passo 2 de 3: Digite o código de 8 dígitos</span>
              <span v-else-if="forgotStep === 3">Passo 3 de 3: Crie sua nova senha</span>
              <span v-else-if="forgotStep === 4">Sucesso!</span>
            </p>
          </div>
          <button class="close-btn" @click="closeForgotModal">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Step indicator dots -->
          <div class="step-progress-bar" v-if="forgotStep <= 3">
            <div class="step-dot" :class="{ active: forgotStep >= 1 }">1</div>
            <div class="step-line" :class="{ active: forgotStep >= 2 }"></div>
            <div class="step-dot" :class="{ active: forgotStep >= 2 }">2</div>
            <div class="step-line" :class="{ active: forgotStep >= 3 }"></div>
            <div class="step-dot" :class="{ active: forgotStep >= 3 }">3</div>
          </div>

          <!-- Alert error message -->
          <div v-if="forgotError" class="alert-error forgot-alert">
            <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ forgotError }}</span>
          </div>

          <!-- Alert success info (resend or step feedback) -->
          <div v-if="forgotInfo" class="alert-info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{{ forgotInfo }}</span>
          </div>

          <!-- STEP 1: Selecionar Login e Canal -->
          <div v-if="forgotStep === 1">
            <div class="form-group mb-3">
              <label class="text-sm font-medium text-white mb-1 block">Usuário / Login *</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input 
                  type="text" 
                  v-model="forgotLogin" 
                  placeholder="Informe seu login de acesso" 
                  required 
                  class="input-control login-input"
                />
              </div>
            </div>

            <div class="channel-selector-group">
              <label class="channel-label">Selecione onde deseja receber o código de 8 dígitos:</label>
              <div class="channel-cards">
                <!-- WhatsApp -->
                <div 
                  class="channel-card" 
                  :class="{ selected: forgotChannel === 'whatsapp' }"
                  @click="forgotChannel = 'whatsapp'"
                >
                  <div class="channel-icon-circle whatsapp">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.04 7.39C8.88 7.39 8.63 7.45 8.41 7.69C8.2 7.92 7.59 8.49 7.59 9.64C7.59 10.8 8.43 11.91 8.55 12.07C8.67 12.23 10.2 14.58 12.54 15.59C13.09 15.83 13.53 15.98 13.86 16.08C14.42 16.26 14.93 16.23 15.33 16.17C15.78 16.1 16.71 15.6 16.91 15.05C17.1 14.5 17.1 14.02 17.04 13.93C16.98 13.83 16.83 13.77 16.6 13.66C16.38 13.55 15.26 13 15.06 12.92C14.85 12.85 14.7 12.81 14.55 13.04C14.4 13.27 13.97 13.77 13.84 13.93C13.72 14.08 13.59 14.1 13.37 13.98C13.14 13.87 12.43 13.64 11.58 12.88C10.92 12.29 10.47 11.56 10.35 11.35C10.22 11.13 10.33 11.02 10.45 10.9C10.55 10.8 10.67 10.64 10.78 10.51C10.9 10.38 10.93 10.28 11.01 10.13C11.08 9.97 11.04 9.84 10.99 9.73C10.93 9.62 10.49 8.53 10.3 8.09C10.12 7.65 9.94 7.72 9.79 7.71C9.66 7.71 9.5 7.7 9.35 7.7C9.2 7.7 8.95 7.76 9.04 7.39Z" />
                    </svg>
                  </div>
                  <div class="channel-info">
                    <span class="channel-title">WhatsApp</span>
                    <span class="channel-sub">Mensagem instantânea no app</span>
                  </div>
                  <div class="channel-radio">
                    <div class="channel-radio-dot" v-if="forgotChannel === 'whatsapp'"></div>
                  </div>
                </div>

                <!-- E-mail -->
                <div 
                  class="channel-card" 
                  :class="{ selected: forgotChannel === 'email' }"
                  @click="forgotChannel = 'email'"
                >
                  <div class="channel-icon-circle email">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div class="channel-info">
                    <span class="channel-title">E-mail</span>
                    <span class="channel-sub">Código na sua caixa de entrada</span>
                  </div>
                  <div class="channel-radio">
                    <div class="channel-radio-dot" v-if="forgotChannel === 'email'"></div>
                  </div>
                </div>

              </div>
            </div>

            <div class="modal-footer forgot-footer">
              <button type="button" class="btn btn-secondary" @click="closeForgotModal">Cancelar</button>
              <button type="button" class="btn" :disabled="isLoadingForgot || !forgotLogin" @click="submitSolicitarCodigo(false)">
                <span>{{ isLoadingForgot ? 'Enviando...' : 'Enviar Código' }}</span>
              </button>
            </div>
          </div>

          <!-- STEP 2: Inserir Código de 8 Dígitos -->
          <div v-if="forgotStep === 2" class="text-center">
            <div class="code-instruction">
              <p class="text-white text-sm m-0">
                Enviamos um código de 8 dígitos via <strong>{{ canalLabel(forgotChannel) }}</strong> para:
              </p>
              <p class="text-highlight font-semibold text-base mt-1 mb-3">{{ forgotDestino }}</p>
              <p class="text-muted text-xs">Digite o código abaixo para continuar:</p>
            </div>

            <!-- 8 Digits Inputs -->
            <div class="code-boxes-wrapper">
              <input 
                v-for="(digit, idx) in codeDigits" 
                :key="idx"
                :ref="el => setBoxRef(el, idx)"
                type="text" 
                inputmode="numeric" 
                maxlength="1" 
                class="code-digit-box" 
                v-model="codeDigits[idx]" 
                @input="handleDigitInput(idx, $event)"
                @keydown="handleDigitKeydown(idx, $event)"
                @paste="handleDigitPaste($event)"
              />
            </div>

            <div class="resend-section mt-4">
              <button 
                type="button" 
                class="btn-text" 
                :disabled="resendCountdown > 0 || isLoadingForgot" 
                @click="submitSolicitarCodigo(true)"
              >
                <span v-if="resendCountdown > 0">Reenviar código em {{ resendCountdown }}s</span>
                <span v-else>Não recebeu? Reenviar código</span>
              </button>
              <button type="button" class="btn-text text-muted block mt-1" @click="forgotStep = 1">
                Trocar método de envio ou usuário
              </button>
            </div>

            <div class="modal-footer forgot-footer mt-4">
              <button type="button" class="btn btn-secondary" @click="forgotStep = 1">Voltar</button>
              <button 
                type="button" 
                class="btn" 
                :disabled="!isCodeComplete" 
                @click="avancarParaNovaSenha"
              >
                <span>Avançar</span>
              </button>
            </div>
          </div>

          <!-- STEP 3: Definir Nova Senha -->
          <div v-if="forgotStep === 3">
            <div class="form-group mb-3">
              <label class="text-sm font-medium text-white mb-1 block">Nova Senha *</label>
              <div class="input-wrapper has-suffix">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input 
                  :type="showNewPassword ? 'text' : 'password'" 
                  v-model="forgotNewPassword" 
                  placeholder="Mínimo 15 caracteres (frase-senha)" 
                  required 
                  class="input-control login-input"
                />
                <svg 
                  class="eye-icon" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="2"
                  @click="showNewPassword = !showNewPassword"
                >
                  <path v-if="showNewPassword" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line v-if="showNewPassword" x1="1" y1="1" x2="23" y2="23" />
                  <path v-if="!showNewPassword" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle v-if="!showNewPassword" cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="text-sm font-medium text-white mb-1 block">Confirmar Nova Senha *</label>
              <div class="input-wrapper has-suffix">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  v-model="forgotConfirmPassword" 
                  placeholder="Repita a nova senha" 
                  required 
                  class="input-control login-input"
                />
                <svg 
                  class="eye-icon" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="2"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <path v-if="showConfirmPassword" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line v-if="showConfirmPassword" x1="1" y1="1" x2="23" y2="23" />
                  <path v-if="!showConfirmPassword" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle v-if="!showConfirmPassword" cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>

            <p class="text-xs text-muted mt-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" class="inline mr-1" style="vertical-align: -2px;">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Por segurança, a nova senha deve conter <strong>no mínimo 15 caracteres</strong> e não pode ser a mesma já cadastrada no sistema.
            </p>

            <div class="modal-footer forgot-footer">
              <button type="button" class="btn btn-secondary" @click="forgotStep = 2">Voltar</button>
              <button 
                type="button" 
                class="btn" 
                :disabled="isLoadingForgot || !forgotNewPassword || !forgotConfirmPassword" 
                @click="submitRedefinirSenha"
              >
                <span>{{ isLoadingForgot ? 'Salvando...' : 'Salvar Nova Senha' }}</span>
              </button>
            </div>
          </div>

          <!-- STEP 4: Concluído com Sucesso -->
          <div v-if="forgotStep === 4" class="success-step text-center">
            <div class="success-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="36" height="36">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 class="text-white text-xl font-bold mt-3 mb-2">Senha alterada com sucesso!</h3>
            <p class="text-muted text-sm mb-4">
              Sua nova senha já está ativa. Agora você pode entrar no Guicell Manager usando as novas credenciais.
            </p>
            <button type="button" class="btn btn-block" @click="concluirRecuperacao">
              <span>Fazer Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>

</template>

<script>
import { defineComponent, ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import loginHero from '../assets/login-hero.png';
import { authService } from '../services/index.js';
import { obterPrimeiraRotaPermitida } from '../composables/usePermissoes';

export default defineComponent({
  name: 'LoginView',
  setup() {
    const router = useRouter();
    const login = ref('');
    const password = ref('');
    const showPassword = ref(false);
    const rememberMe = ref(true);
    const isLoading = ref(false);
    const errorMsg = ref('');

    // Password Recovery State
    const showForgotModal = ref(false);
    const forgotStep = ref(1); // 1: Canal, 2: Código 4 dígitos, 3: Nova Senha, 4: Sucesso
    const forgotLogin = ref('');
    const forgotChannel = ref('whatsapp');
    const forgotDestino = ref('');
    const forgotError = ref('');
    const forgotInfo = ref('');
    const isLoadingForgot = ref(false);

    const codeDigits = ref(['', '', '', '', '', '', '', '']);
    const forgotResetGrant = ref('');
    const boxRefs = [null, null, null, null, null, null, null, null];
    const setBoxRef = (el, idx) => {
      boxRefs[idx] = el;
    };

    const resendCountdown = ref(0);
    let resendTimer = null;

    const forgotNewPassword = ref('');
    const forgotConfirmPassword = ref('');
    const showNewPassword = ref(false);
    const showConfirmPassword = ref(false);

    const isCodeComplete = computed(() => {
      return codeDigits.value.every(d => String(d).trim().length === 1);
    });

    const canalLabel = (channel) => {
      if (channel === 'whatsapp') return 'WhatsApp';
      if (channel === 'email') return 'E-mail';
      return channel;
    };

    const startResendTimer = () => {
      if (resendTimer) clearInterval(resendTimer);
      resendCountdown.value = 60;
      resendTimer = setInterval(() => {
        if (resendCountdown.value > 0) {
          resendCountdown.value--;
        } else {
          clearInterval(resendTimer);
          resendTimer = null;
        }
      }, 1000);
    };

    const handleLogin = async () => {
      if (!login.value || !password.value) {
        errorMsg.value = 'Preencha o login e a senha.';
        return;
      }
      isLoading.value = true;
      errorMsg.value = '';
      try {
        await authService.login(login.value, password.value);
        if (rememberMe.value) {
          localStorage.setItem('guicell_saved_login', login.value.trim());
        } else {
          localStorage.removeItem('guicell_saved_login');
        }
        router.push(obterPrimeiraRotaPermitida());
      } catch (err) {
        errorMsg.value = err.response?.data?.error || 'Erro ao conectar com o servidor.';
        password.value = '';
      } finally {
        isLoading.value = false;
      }
    };

    const handleForgotPassword = () => {
      showForgotModal.value = true;
      forgotStep.value = 1;
      forgotLogin.value = login.value || '';
      forgotChannel.value = 'whatsapp';
      forgotDestino.value = '';
      forgotError.value = '';
      forgotInfo.value = '';
      codeDigits.value = ['', '', '', '', '', '', '', ''];
      forgotNewPassword.value = '';
      forgotConfirmPassword.value = '';
    };

    const closeForgotModal = () => {
      showForgotModal.value = false;
      if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
      }
      forgotError.value = '';
      forgotInfo.value = '';
    };

    const submitSolicitarCodigo = async (isResend = false) => {
      if (!forgotLogin.value) {
        forgotError.value = 'Informe seu usuário / login.';
        return;
      }
      forgotError.value = '';
      forgotInfo.value = '';
      isLoadingForgot.value = true;
      try {
        const res = await authService.solicitarRecuperacao(forgotLogin.value, forgotChannel.value);
        forgotDestino.value = res.destino || '';
        if (isResend) {
          forgotInfo.value = res.mensagem || 'Código reenviado com sucesso!';
        } else {
          forgotStep.value = 2;
          nextTick(() => {
            if (boxRefs[0]) boxRefs[0].focus();
          });
        }
        startResendTimer();
      } catch (err) {
        forgotError.value = err.response?.data?.error || 'Erro ao solicitar código de recuperação.';
      } finally {
        isLoadingForgot.value = false;
      }
    };

    const handleDigitInput = (idx, event) => {
      const char = event.target.value.replace(/\D/g, '');
      codeDigits.value[idx] = char ? char.slice(-1) : '';
      if (codeDigits.value[idx] && idx < 7 && boxRefs[idx + 1]) {
        boxRefs[idx + 1].focus();
      }
    };

    const handleDigitKeydown = (idx, event) => {
      if (event.key === 'Backspace') {
        if (!codeDigits.value[idx] && idx > 0 && boxRefs[idx - 1]) {
          boxRefs[idx - 1].focus();
        }
      } else if (event.key === 'ArrowLeft' && idx > 0 && boxRefs[idx - 1]) {
        boxRefs[idx - 1].focus();
      } else if (event.key === 'ArrowRight' && idx < 7 && boxRefs[idx + 1]) {
        boxRefs[idx + 1].focus();
      }
    };

    const handleDigitPaste = (event) => {
      event.preventDefault();
      const text = (event.clipboardData || window.clipboardData).getData('text') || '';
      const clean = text.replace(/\D/g, '').slice(0, 8);
      for (let i = 0; i < 8; i++) {
        codeDigits.value[i] = clean[i] || '';
      }
      const focusIndex = Math.min(clean.length, 7);
      if (boxRefs[focusIndex]) {
        boxRefs[focusIndex].focus();
      }
    };

    const avancarParaNovaSenha = async () => {
      if (!isCodeComplete.value) {
        forgotError.value = 'Digite todos os 8 dígitos do código.';
        return;
      }
      forgotError.value = '';
      isLoadingForgot.value = true;
      try {
        const code = codeDigits.value.join('');
        const res = await authService.validarCodigo(forgotLogin.value, code);
        forgotResetGrant.value = res.resetGrant;
        forgotStep.value = 3;
      } catch (err) {
        forgotError.value = err.response?.data?.error || 'Código incorreto ou expirado.';
      } finally {
        isLoadingForgot.value = false;
      }
    };

    const submitRedefinirSenha = async () => {
      forgotError.value = '';
      if (!forgotNewPassword.value || forgotNewPassword.value.length < 15) {
        forgotError.value = 'A nova senha deve conter no mínimo 15 caracteres (recomenda-se uma frase-senha).';
        return;
      }
      if (forgotNewPassword.value.length > 64) {
        forgotError.value = 'A senha não pode exceder o limite de 64 caracteres.';
        return;
      }
      if (forgotNewPassword.value !== forgotConfirmPassword.value) {
        forgotError.value = 'As senhas digitadas não coincidem.';
        return;
      }
      isLoadingForgot.value = true;
      try {
        await authService.redefinirSenha(
          forgotLogin.value,
          forgotResetGrant.value,
          forgotNewPassword.value,
          forgotConfirmPassword.value
        );
        forgotStep.value = 4;
        forgotResetGrant.value = '';
        forgotNewPassword.value = '';
        forgotConfirmPassword.value = '';
        codeDigits.value = ['', '', '', '', '', '', '', ''];
      } catch (err) {
        forgotError.value = err.response?.data?.error || 'Erro ao redefinir a senha.';
      } finally {
        isLoadingForgot.value = false;
      }
    };

    const concluirRecuperacao = () => {
      login.value = forgotLogin.value;
      password.value = '';
      closeForgotModal();
    };

    onMounted(() => {
      const savedLogin = localStorage.getItem('guicell_saved_login');
      if (savedLogin) {
        login.value = savedLogin;
        rememberMe.value = true;
      } else {
        rememberMe.value = false;
      }
    });

    onUnmounted(() => {
      if (resendTimer) {
        clearInterval(resendTimer);
        resendTimer = null;
      }
    });

    return {
      login,
      password,
      showPassword,
      rememberMe,
      loginHero,
      isLoading,
      errorMsg,
      handleLogin,
      handleForgotPassword,
      showForgotModal,
      forgotStep,
      forgotLogin,
      forgotChannel,
      forgotDestino,
      forgotError,
      forgotInfo,
      isLoadingForgot,
      codeDigits,
      setBoxRef,
      resendCountdown,
      forgotNewPassword,
      forgotConfirmPassword,
      showNewPassword,
      showConfirmPassword,
      isCodeComplete,
      canalLabel,
      closeForgotModal,
      submitSolicitarCodigo,
      handleDigitInput,
      handleDigitKeydown,
      handleDigitPaste,
      avancarParaNovaSenha,
      submitRedefinirSenha,
      concluirRecuperacao,
    };
  }
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: var(--bg-dark);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.alert-error {
  background-color: var(--danger-glow);
  border: 1px solid var(--danger);
  color: var(--danger);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.9rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.alert-icon {
  flex-shrink: 0;
}

.login-container {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  gap: 0;
  align-items: stretch;
}

/* Left Panel with Background Image Overlay */
.brand-panel {
  display: flex;
  flex-direction: column;
  padding: 60px 80px 80px 80px;
  background-color: #000000; /* Fallback */
  background-size: cover;
  background-position: center right;
  background-repeat: no-repeat;
  max-height: 100vh;
  overflow-y: auto;
  position: relative;
  justify-content: space-between;
}

/* Semi-transparent dark overlay to guarantee high text contrast */
.brand-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.3) 100%);
  z-index: 1;
}

/* Force children to render above overlay */
.brand-header, .brand-content {
  position: relative;
  z-index: 2;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  position: relative;
}

.brand-name {
  font-family: var(--font-heading);
  font-weight: 800;
  color: var(--text-white);
  font-size: 1.6rem;
  letter-spacing: 0.5px;
}

.brand-sub {
  font-family: var(--font-heading);
  font-weight: 300;
  color: var(--text-normal);
  font-size: 1.1rem;
  letter-spacing: 1.5px;
}

.brand-badge {
  position: absolute;
  top: 0;
  right: -36px;
  background-color: var(--primary-glow);
  color: var(--primary-hover);
  border: 1px solid var(--primary);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}

.logo-divider {
  width: 80px;
  height: 2px;
  background-color: var(--primary);
  margin-top: 18px;
  margin-bottom: 4px;
}

.brand-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  margin-top: 60px; /* Large space below logo */
}

.main-headline {
  font-size: 2.5rem; /* Increased size to match mockup */
  line-height: 1.25;
  margin-bottom: 12px;
  max-width: 500px;
}

.main-headline .highlight {
  color: var(--primary-hover);
}

.sub-headline {
  color: var(--text-muted);
  font-size: 1.2rem; /* Increased size */
  margin-bottom: 24px;
}

.features-list {
  display: flex;
  flex-direction: column; /* Vertical stack exactly like image */
  gap: 24px; /* Increased spacing between items */
  margin-top: auto; /* Push features to the bottom */
  padding-top: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.feature-icon-wrapper {
  background-color: var(--primary-glow);
  color: var(--primary-hover);
  border: 1px solid rgba(0, 143, 57, 0.25);
  width: 48px; /* Increased icon box size */
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon {
  width: 24px; /* Increased icon size */
  height: 24px;
}

.feature-text h3 {
  font-size: 1.15rem; /* Increased text size */
  margin-bottom: 4px;
  font-weight: 600;
  color: var(--text-white);
}

.feature-text p {
  color: var(--text-muted);
  font-size: 0.95rem; /* Increased text size */
  line-height: 1.4;
}

/* Right Panel (White Column) */
.form-panel {
  background-color: #ffffff;
  color: #1e293b;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 60px 45px 30px 45px;
  border-radius: 40px 0 0 40px;
  box-shadow: -15px 0 35px rgba(0, 0, 0, 0.35);
  height: 100vh;
  overflow-y: auto;
}

.white-card {
  background-color: transparent;
  color: #1e293b;
  width: 100%;
  max-width: 400px;
  margin: auto 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.white-card h2 {
  color: #0f172a;
  font-size: 1.8rem;
  margin-bottom: 6px;
}

.highlight-green {
  color: #008f39;
}

.white-card .subtitle {
  color: #64748b;
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login-form label {
  color: #334155;
  font-weight: 500;
}

.login-input {
  background-color: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  color: #0f172a !important;
}

.login-input:focus {
  border-color: #008f39 !important;
  box-shadow: 0 0 0 3px rgba(0, 143, 57, 0.15) !important;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-top: 4px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 0.85rem;
}

.remember-me input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  width: 18px;
  height: 18px;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  transition: all 0.2s;
}

.remember-me:hover input ~ .checkmark {
  background-color: #e2e8f0;
}

.remember-me input:checked ~ .checkmark {
  background-color: #008f39;
  border-color: #008f39;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.remember-me input:checked ~ .checkmark:after {
  display: block;
}

.remember-me .checkmark:after {
  left: 6px;
  top: 2px;
  width: 4px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.forgot-link {
  color: #008f39;
  font-weight: 600;
}

.forgot-link:hover {
  color: #00aa44;
}

.btn-block {
  width: 100%;
  background-color: #008f39;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
}
.btn-block:hover {
  background-color: #00aa44;
}

.arrow-icon {
  width: 18px;
  height: 18px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 4px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}

.divider:not(:empty)::before {
  margin-right: .5em;
}

.divider:not(:empty)::after {
  margin-left: .5em;
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 12px;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.btn-google:hover {
  background-color: #f8fafc;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.google-logo {
  width: 18px;
  height: 18px;
}

.protected-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 4px;
}

.shield-icon {
  width: 16px;
  height: 16px;
  color: #008f39;
}

/* Footer */
.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 0.8rem;
  color: #64748b;
  width: 100%;
}

.highlight-green-footer {
  color: #008f39;
  font-weight: 600;
}

/* Responsiveness */
@media (max-width: 1024px) {
  .brand-panel {
    padding: 40px;
  }
}

@media (max-width: 968px) {
  .login-container {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100vh;
  }
  .brand-panel {
    max-height: none;
    height: auto;
    padding: 40px 20px;
    align-items: center;
    text-align: center;
  }
  .logo-wrapper {
    justify-content: center;
  }
  .main-headline {
    max-width: 100%;
  }
  .features-list {
    grid-template-columns: 1fr;
    text-align: left;
    max-width: 500px;
    margin: 24px auto 0 auto;
  }
  .form-panel {
    height: auto;
    padding: 50px 20px 30px 20px;
    border-radius: 30px 30px 0 0;
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.3);
    width: 100%;
  }
  .white-card {
    margin: 0 auto;
  }
}

/* Password Recovery Modal */
.forgot-modal-content {
  max-width: 480px;
  background-color: #121824;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.step-progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  gap: 8px;
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.step-dot.active {
  background: var(--primary);
  color: #0b0f19;
  box-shadow: 0 0 12px var(--primary-glow);
}

.step-line {
  width: 40px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.step-line.active {
  background: var(--primary);
}

.channel-selector-group {
  margin-top: 16px;
  margin-bottom: 20px;
}

.channel-label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.channel-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.channel-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s ease;
}

.channel-card:hover {
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.03);
}

.channel-card.selected {
  border-color: var(--primary);
  background: rgba(34, 197, 94, 0.08);
}

.channel-icon-circle {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.channel-icon-circle.whatsapp {
  background: rgba(37, 211, 102, 0.15);
  color: #25d366;
}

.channel-icon-circle.email {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.channel-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.channel-title {
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
}

.channel-sub {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.channel-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-card.selected .channel-radio {
  border-color: var(--primary);
}

.channel-radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
}

.forgot-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 16px;
  padding-bottom: 0;
  padding-left: 0;
  padding-right: 0;
}

.forgot-alert {
  margin-bottom: 16px;
}

.alert-info-box {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-highlight {
  color: var(--primary);
}

/* 8-digit code boxes */
.code-boxes-wrapper {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  margin: 20px 0;
}

.code-digit-box {
  width: 40px;
  height: 50px;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
}

.code-digit-box:focus {
  border-color: var(--primary);
  background: rgba(34, 197, 94, 0.05);
  box-shadow: 0 0 16px var(--primary-glow);
}

@media (max-width: 440px) {
  .code-boxes-wrapper {
    gap: 4px;
  }
  .code-digit-box {
    width: 34px;
    height: 44px;
    font-size: 1.05rem;
    border-radius: 8px;
  }
}

.btn-text {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px;
  transition: opacity 0.2s;
}

.btn-text:disabled {
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.7;
}

.success-step {
  padding: 20px 0;
}

.success-icon-circle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.15);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 2px solid var(--primary);
  box-shadow: 0 0 20px var(--primary-glow);
}

</style>
