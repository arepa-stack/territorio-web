<template>
  <v-app>
    <v-main class="auth-layout">
      <v-container fluid class="fill-height">
        <v-row justify="center" align="center" class="fill-height">
          <v-col cols="12" sm="8" md="6" lg="4" xl="3">
            <!-- Logo and Branding -->
            <div class="text-center mb-8">
              <v-avatar
                size="80"
                color="primary"
                class="mb-4 elevation-4"
              >
                <v-icon
                  color="white"
                  size="48"
                >
                  mdi-basketball
                </v-icon>
              </v-avatar>
              
              <h1 class="text-h3 font-weight-bold mb-2">
                Basketball
              </h1>
              <p class="text-h6 text-medium-emphasis">
                Tournament System
              </p>
            </div>

            <!-- Auth Card -->
            <v-card
              class="elevation-8"
              :class="{ 'pa-6': !$vuetify.display.xs, 'pa-4': $vuetify.display.xs }"
            >
              <!-- Router View for Login/Register -->
              <router-view v-slot="{ Component }">
                <transition
                  name="auth"
                  mode="out-in"
                >
                  <component :is="Component" />
                </transition>
              </router-view>
            </v-card>

            <!-- Footer -->
            <div class="text-center mt-8">
              <p class="text-body-2 text-medium-emphasis">
                © 2025 Basketball Tournament System
              </p>
              <p class="text-caption text-medium-emphasis">
                Desarrollado por MiniMax Agent
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <!-- Background Pattern -->
      <div class="background-pattern">
        <div class="pattern-overlay"></div>
      </div>

      <!-- Floating Elements -->
      <div class="floating-elements">
        <div class="floating-ball ball-1"></div>
        <div class="floating-ball ball-2"></div>
        <div class="floating-ball ball-3"></div>
        <div class="floating-ball ball-4"></div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { useTheme } from 'vuetify'

const theme = useTheme()

// You could add theme switching logic here if needed
// const toggleTheme = () => {
//   theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
// }
</script>

<style scoped>
.auth-layout {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-background)) 0%,
    rgb(var(--v-theme-surface)) 100%
  );
  position: relative;
  overflow: hidden;
}

/* Background Pattern */
.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(var(--v-theme-primary), 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(var(--v-theme-secondary), 0.1) 0%, transparent 50%);
  z-index: 0;
}

.pattern-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 20px,
      rgba(var(--v-theme-divider), 0.05) 20px,
      rgba(var(--v-theme-divider), 0.05) 40px
    );
  z-index: 0;
}

/* Floating Elements */
.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.floating-ball {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.1),
    rgba(var(--v-theme-secondary), 0.1)
  );
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  animation: float 6s ease-in-out infinite;
}

.ball-1 {
  width: 60px;
  height: 60px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.ball-2 {
  width: 40px;
  height: 40px;
  top: 20%;
  right: 15%;
  animation-delay: 1s;
}

.ball-3 {
  width: 30px;
  height: 30px;
  bottom: 30%;
  left: 20%;
  animation-delay: 2s;
}

.ball-4 {
  width: 50px;
  height: 50px;
  bottom: 15%;
  right: 20%;
  animation-delay: 3s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

/* Card Enhancements */
.v-card {
  backdrop-filter: blur(12px);
  background: rgba(var(--v-theme-surface), 0.95) !important;
  border: 1px solid rgba(var(--v-theme-divider), 0.2) !important;
  position: relative;
  z-index: 1;
}

/* Transition Animations */
.auth-enter-active,
.auth-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.auth-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.auth-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Logo Animation */
.avatar-container {
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Custom Inputs Styling */
:deep(.v-text-field) {
  margin-bottom: 16px;
}

:deep(.v-btn) {
  text-transform: none;
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .auth-layout {
    padding: 16px;
  }
  
  .floating-ball {
    display: none; /* Hide floating elements on very small screens */
  }
}

/* Dark mode adjustments */
.theme--dark .auth-layout {
  background: linear-gradient(
    135deg,
    #0a0a0a 0%,
    #1a1a1a 100%
  );
}

.theme--dark .pattern-overlay {
  background: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 20px,
      rgba(255, 255, 255, 0.02) 20px,
      rgba(255, 255, 255, 0.02) 40px
    );
}

/* Loading state */
.auth-layout.loading {
  pointer-events: none;
}

.auth-layout.loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--v-theme-background), 0.8);
  z-index: 10;
  backdrop-filter: blur(2px);
}
</style>