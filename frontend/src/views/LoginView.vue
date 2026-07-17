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
              <span class="brand-badge">ERP</span>
            </div>
          </div>
          <div class="logo-divider"></div>
        </div>

        <div class="brand-content">
          <h1 class="main-headline">
            O ERP completo para <span class="highlight">sua assistência técnica de celulares</span>
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
            <p class="subtitle">Faça login para acessar o Guicell Manager ERP</p>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            <!-- Email -->
            <div class="form-group">
              <label for="email">E-mail</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input 
                  type="email" 
                  id="email" 
                  v-model="email" 
                  placeholder="Digite seu e-mail" 
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
            <button type="submit" class="btn btn-block">
              <span>Entrar</span>
              <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <!-- Social Login Divider -->
            <div class="divider">
              <span>ou continue com</span>
            </div>

            <!-- Google Login -->
            <button type="button" class="btn-google" @click="handleGoogleLogin">
              <svg class="google-logo" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Entrar com Google</span>
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
          <p>© 2024 <span class="highlight-green-footer">Guicell Manager ERP</span>. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import loginHero from '../assets/login-hero.png';

export default defineComponent({
  name: 'LoginView',
  emits: ['login-success'],
  setup(props, { emit }) {
    const email = ref('gerente@guicell.com.br');
    const password = ref('123456');
    const showPassword = ref(false);
    const rememberMe = ref(true);

    const handleLogin = () => {
      // Simulate login and redirect to dashboard
      emit('login-success');
    };

    const handleGoogleLogin = () => {
      emit('login-success');
    };

    const handleForgotPassword = () => {
      alert('Funcionalidade de recuperação de senha simulada para o protótipo.');
    };

    return {
      email,
      password,
      showPassword,
      rememberMe,
      loginHero,
      handleLogin,
      handleGoogleLogin,
      handleForgotPassword
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
</style>
