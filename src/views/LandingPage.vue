<template>
    <div class="landing-page">
        <!-- Animated Background -->
        <div class="bg-animation">
            <div class="court-lines"></div>
            <div class="gradient-orb orb-1"></div>
            <div class="gradient-orb orb-2"></div>
            <div class="gradient-orb orb-3"></div>
        </div>

        <!-- Navbar -->
        <nav class="navbar">
            <div class="nav-container">
                <div class="logo">
                    <div class="logo-ball">
                        <div class="ball-shine"></div>
                    </div>
                    <span class="logo-text">HOOPS<span class="accent">ARENA</span></span>
                </div>
                <div class="nav-links">
                    <a href="#home">Inicio</a>
                    <a href="#features">Features</a>
                    <a href="#zones">Zonas</a>
                    <a href="#pricing">Precios</a>
                </div>
                <div class="nav-actions">
                    <button class="btn-ghost" @click="goToLogin">Login</button>
                    <button class="btn-primary" @click="goToRegister">
                        <span>Comenzar</span>
                        <div class="btn-glow"></div>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="hero" id="home">
            <div class="hero-container">
                <div class="hero-badge">
                    <span class="badge-text">🏀 #1 Platform</span>
                    <div class="badge-pulse"></div>
                </div>

                <h1 class="hero-title">
                    <span class="title-line">DOMINA</span>
                    <span class="title-line gradient-text">LA CANCHA</span>
                    <span class="title-line">DIGITAL</span>
                </h1>

                <p class="hero-subtitle">
                    La plataforma más poderosa para gestionar torneos de baloncesto.<br />
                    <span class="highlight">Más de 500 torneos</span> confían en nosotros.
                </p>

                <div class="hero-ctas">
                    <button class="cta-main" @click="goToRegister">
                        <span>Comenzar Gratis</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" />
                        </svg>
                        <div class="cta-shine"></div>
                    </button>
                    <button class="cta-secondary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        <span>Ver Demo</span>
                    </button>
                </div>

                <div class="hero-stats">
                    <div class="stat-card" v-for="stat in stats" :key="stat.label">
                        <div class="stat-number">{{ stat.value }}</div>
                        <div class="stat-label">{{ stat.label }}</div>
                        <div class="stat-glow"></div>
                    </div>
                </div>
            </div>

            <!-- 3D Basketball -->
            <div class="basketball-3d">
                <div class="ball-container">
                    <Basketball3D />
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="features" id="features">
            <div class="features-container">
                <div class="section-header">
                    <span class="section-tag">CARACTERÍSTICAS</span>
                    <h2 class="section-title">
                        Herramientas que<br />
                        <span class="gradient-text">Marcan la Diferencia</span>
                    </h2>
                </div>

                <div class="features-grid">
                    <div v-for="(feature, index) in features" :key="index" class="feature-card"
                        :style="{ animationDelay: `${index * 0.1}s` }">
                        <div class="feature-icon" :class="`icon-${index + 1}`">
                            <div class="icon-bg"></div>
                            <span class="icon-emoji">{{ feature.emoji }}</span>
                        </div>
                        <h3 class="feature-title">{{ feature.title }}</h3>
                        <p class="feature-desc">{{ feature.description }}</p>
                        <div class="feature-glow"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Zones Section -->
        <section class="zones" id="zones">
            <div class="zones-container">
                <div class="zones-content">
                    <span class="section-tag">SISTEMA ÚNICO</span>
                    <h2 class="section-title">
                        Conquista<br />
                        <span class="gradient-text">Tu Territorio</span>
                    </h2>
                    <p class="zones-desc">
                        Sistema revolucionario de competencia territorial. Los equipos luchan por el dominio
                        de zonas geográficas en tiempo real.
                    </p>
                    <div class="zones-features">
                        <div v-for="item in zoneFeatures" :key="item" class="zone-item">
                            <div class="zone-check">✓</div>
                            <span>{{ item }}</span>
                        </div>
                    </div>
                    <button class="btn-explore">
                        Explorar Zonas
                        <div class="btn-arrow">→</div>
                    </button>
                </div>

                <div class="zones-visual">
                    <div class="map-container">
                        <div class="map-grid"></div>
                        <div v-for="i in 6" :key="i" class="zone-marker" :style="getZoneStyle(i)">
                            <div class="marker-ring"></div>
                            <div class="marker-dot"></div>
                        </div>
                        <div class="map-glow"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Stats Showcase -->
        <section class="stats-showcase">
            <div class="stats-container">
                <div class="stat-item" v-for="stat in showcaseStats" :key="stat.label">
                    <div class="stat-icon">{{ stat.icon }}</div>
                    <div class="stat-value">{{ stat.value }}</div>
                    <div class="stat-text">{{ stat.label }}</div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
            <div class="cta-container">
                <div class="cta-content">
                    <h2 class="cta-title">
                        Listo para<br />
                        <span class="gradient-text">Revolucionar</span><br />
                        tus Torneos?
                    </h2>
                    <p class="cta-subtitle">
                        Únete a más de 1,200 equipos que ya están dominando la cancha digital
                    </p>
                    <button class="cta-button" @click="goToRegister">
                        <span>Crear Cuenta Gratis</span>
                        <div class="button-particles"></div>
                    </button>
                    <p class="cta-note">✨ Sin tarjeta • Setup en 2 minutos</p>
                </div>
                <div class="cta-visual">
                    <div class="trophy-glow"></div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="footer">
            <div class="footer-container">
                <div class="footer-brand">
                    <div class="footer-logo">
                        <div class="logo-ball small">
                            <div class="ball-shine"></div>
                        </div>
                        <span>HOOPS<span class="accent">ARENA</span></span>
                    </div>
                    <p class="footer-tagline">La cancha digital del futuro</p>
                </div>
                <div class="footer-links">
                    <div class="link-group">
                        <h4>Producto</h4>
                        <a href="#">Características</a>
                        <a href="#">Precios</a>
                        <a href="#">Demo</a>
                    </div>
                    <div class="link-group">
                        <h4>Compañía</h4>
                        <a href="#">Acerca de</a>
                        <a href="#">Blog</a>
                        <a href="#">Contacto</a>
                    </div>
                    <div class="link-group">
                        <h4>Legal</h4>
                        <a href="#">Términos</a>
                        <a href="#">Privacidad</a>
                    </div>
                </div>
                <div class="footer-social">
                    <a href="#" class="social-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </a>
                    <a href="#" class="social-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                    </a>
                    <a href="#" class="social-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                        </svg>
                    </a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>© 2025 HoopsArena. Todos los derechos reservados.</p>
            </div>
        </footer>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Basketball3D from '@/components/Basketball3D.vue'

const router = useRouter()

const stats = ref([
    { value: '500+', label: 'Torneos Activos' },
    { value: '1.2K+', label: 'Equipos Registrados' },
    { value: '50+', label: 'Zonas Conquistadas' }
])

const features = ref([
    { emoji: '🎯', title: 'Multi-Zona', description: 'Gestiona torneos en múltiples zonas simultáneamente' },
    { emoji: '⚡', title: 'Fixtures Auto', description: 'Generación inteligente de calendarios en segundos' },
    { emoji: '📊', title: 'Analytics Pro', description: 'Estadísticas avanzadas en tiempo real' },
    { emoji: '👥', title: 'Team Manager', description: 'Control total de equipos y cuerpo técnico' },
    { emoji: '🎖️', title: 'Árbitros', description: 'Sistema completo de gestión de árbitros' },
    { emoji: '🔔', title: 'Notificaciones', description: 'Alertas instantáneas para todos los participantes' }
])

const zoneFeatures = ref([
    'Competencia territorial en tiempo real',
    'Sistema de desafíos entre zonas',
    'Rankings dinámicos por zona',
    'Torneos de campeones zonales'
])

const showcaseStats = ref([
    { icon: '🏆', value: '2.5M+', label: 'Partidos Jugados' },
    { icon: '⭐', value: '98%', label: 'Satisfacción' },
    { icon: '🚀', value: '24/7', label: 'Soporte' },
    { icon: '💎', value: '100%', label: 'Uptime' }
])

const getZoneStyle = (index) => {
    const positions = [
        { top: '15%', left: '20%' },
        { top: '35%', left: '60%' },
        { top: '55%', left: '25%' },
        { top: '70%', left: '70%' },
        { top: '25%', left: '80%' },
        { top: '60%', left: '45%' }
    ]
    return positions[index - 1]
}

const goToLogin = () => router.push('/auth/login')
const goToRegister = () => router.push('/auth/register')
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.landing-page {
    font-family: 'Inter', sans-serif;
    background: #0A0A0F;
    color: white;
    overflow-x: hidden;
    position: relative;
}

/* Animated Background */
.bg-animation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
}

.court-lines {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image:
        linear-gradient(90deg, rgba(255, 107, 0, 0.03) 1px, transparent 1px),
        linear-gradient(rgba(255, 107, 0, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: courtMove 20s linear infinite;
}

@keyframes courtMove {
    0% {
        transform: translate(0, 0);
    }

    100% {
        transform: translate(50px, 50px);
    }
}

.gradient-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.3;
    animation: float 15s ease-in-out infinite;
}

.orb-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, #FF6B00, transparent);
    top: -200px;
    right: -200px;
    animation-delay: 0s;
}

.orb-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #00D9FF, transparent);
    bottom: -150px;
    left: -150px;
    animation-delay: 5s;
}

.orb-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, #9D00FF, transparent);
    top: 50%;
    left: 50%;
    animation-delay: 10s;
}

@keyframes float {

    0%,
    100% {
        transform: translate(0, 0) scale(1);
    }

    33% {
        transform: translate(50px, -50px) scale(1.1);
    }

    66% {
        transform: translate(-50px, 50px) scale(0.9);
    }
}

/* Navbar */
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(10, 10, 15, 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo {
    display: flex;
    align-items: center;
    gap: 12px;
}

.logo-ball {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #FF6B00, #FF8C00);
    border-radius: 50%;
    position: relative;
    box-shadow: 0 0 20px rgba(255, 107, 0, 0.5);
    animation: spin 10s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.ball-shine {
    position: absolute;
    top: 5px;
    left: 5px;
    width: 15px;
    height: 15px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    filter: blur(3px);
}

.logo-text {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -1px;
}

.accent {
    color: #FF6B00;
}

.nav-links {
    display: flex;
    gap: 40px;
}

.nav-links a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    font-weight: 500;
    transition: all 0.3s;
    position: relative;
}

.nav-links a:hover {
    color: #FF6B00;
}

.nav-links a::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #FF6B00, #FF8C00);
    transition: width 0.3s;
}

.nav-links a:hover::after {
    width: 100%;
}

.nav-actions {
    display: flex;
    gap: 16px;
}

.btn-ghost {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 10px 24px;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-ghost:hover {
    border-color: #FF6B00;
    color: #FF6B00;
}

.btn-primary {
    background: linear-gradient(135deg, #FF6B00, #FF8C00);
    border: none;
    color: white;
    padding: 12px 32px;
    border-radius: 50px;
    font-weight: 700;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(255, 107, 0, 0.4);
    transition: all 0.3s;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(255, 107, 0, 0.6);
}

.btn-glow {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shine 3s infinite;
}

@keyframes shine {
    0% {
        left: -100%;
    }

    100% {
        left: 200%;
    }
}

/* Hero Section */
.hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 120px 40px 80px;
    position: relative;
    z-index: 1;
}

.hero-container {
    max-width: 1200px;
    text-align: center;
    position: relative;
    z-index: 2;
}

.hero-badge {
    display: inline-block;
    background: rgba(255, 107, 0, 0.1);
    border: 1px solid rgba(255, 107, 0, 0.3);
    padding: 8px 24px;
    border-radius: 50px;
    margin-bottom: 40px;
    position: relative;
    animation: fadeInDown 1s ease-out;
}

@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.badge-text {
    font-size: 14px;
    font-weight: 600;
    color: #FF6B00;
}

.badge-pulse {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid #FF6B00;
    border-radius: 50px;
    animation: pulse 2s infinite;
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.1);
        opacity: 0;
    }
}

.hero-title {
    font-size: clamp(3rem, 10vw, 7rem);
    font-weight: 900;
    line-height: 1;
    margin-bottom: 32px;
    letter-spacing: -0.05em;
}

.title-line {
    display: block;
    animation: fadeInUp 1s ease-out backwards;
}

.title-line:nth-child(1) {
    animation-delay: 0.2s;
}

.title-line:nth-child(2) {
    animation-delay: 0.4s;
}

.title-line:nth-child(3) {
    animation-delay: 0.6s;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.gradient-text {
    background: linear-gradient(135deg, #FF6B00, #FF8C00, #FFD700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 3s ease infinite;
    background-size: 200% 200%;
}

@keyframes gradientShift {

    0%,
    100% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }
}

.hero-subtitle {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 48px;
    line-height: 1.6;
    animation: fadeIn 1s ease-out 0.8s backwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.highlight {
    color: #FF6B00;
    font-weight: 700;
}

.hero-ctas {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-bottom: 80px;
    animation: fadeIn 1s ease-out 1s backwards;
}

.cta-main {
    background: linear-gradient(135deg, #FF6B00, #FF8C00);
    border: none;
    color: white;
    padding: 18px 48px;
    border-radius: 50px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(255, 107, 0, 0.4);
    transition: all 0.3s;
}

.cta-main:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 12px 48px rgba(255, 107, 0, 0.6);
}

.cta-shine {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: rotate(45deg);
    animation: shine 3s infinite;
}

.cta-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 16px 40px;
    border-radius: 50px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    backdrop-filter: blur(10px);
    transition: all 0.3s;
}

.cta-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
}

.hero-stats {
    display: flex;
    justify-content: center;
    gap: 60px;
    animation: fadeIn 1s ease-out 1.2s backwards;
}

.stat-card {
    position: relative;
    padding: 24px 32px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    backdrop-filter: blur(10px);
    transition: all 0.3s;
}

.stat-card:hover {
    transform: translateY(-8px);
    border-color: rgba(255, 107, 0, 0.5);
}

.stat-number {
    font-size: 40px;
    font-weight: 900;
    background: linear-gradient(135deg, #FF6B00, #FFD700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 8px;
}

.stat-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.stat-glow {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #FF6B00, transparent);
    opacity: 0;
    transition: opacity 0.3s;
}

.stat-card:hover .stat-glow {
    position: relative;
    z-index: 1;
}

.features-container {
    max-width: 1400px;
    margin: 0 auto;
}

.section-header {
    text-align: center;
    margin-bottom: 80px;
}

.section-tag {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    color: #FF6B00;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 16px;
    padding: 8px 20px;
    background: rgba(255, 107, 0, 0.1);
    border-radius: 50px;
}

.section-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: -0.02em;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 32px;
}

.feature-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 40px;
    position: relative;
    overflow: hidden;
    transition: all 0.4s;
    animation: fadeInUp 0.6s ease-out backwards;
}

.feature-card:hover {
    transform: translateY(-12px);
    border-color: rgba(255, 107, 0, 0.5);
    background: rgba(255, 255, 255, 0.05);
}

.feature-icon {
    width: 80px;
    height: 80px;
    background: rgba(255, 107, 0, 0.1);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
}

.icon-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.2), transparent);
    animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 0.5;
    }

    50% {
        transform: scale(1.2);
        opacity: 1;
    }
}

.icon-emoji {
    position: relative;
    z-index: 1;
}

.feature-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 12px;
    color: white;
}

.feature-desc {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.6;
}

.feature-glow {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #FF6B00, transparent);
    opacity: 0;
    transition: opacity 0.3s;
}

.feature-card:hover .feature-glow {
    opacity: 1;
}

/* Zones Section */
.zones {
    padding: 120px 40px;
    position: relative;
    z-index: 1;
    background: linear-gradient(180deg, transparent, rgba(255, 107, 0, 0.05), transparent);
}

.zones-container {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: center;
}

.zones-desc {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.8;
    margin-bottom: 40px;
}

.zones-features {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 40px;
}

.zone-item {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
}

.zone-check {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #FF6B00, #FF8C00);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    flex-shrink: 0;
}

.btn-explore {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 107, 0, 0.5);
    color: white;
    padding: 16px 40px;
    border-radius: 50px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s;
}

.btn-explore:hover {
    background: rgba(255, 107, 0, 0.1);
    border-color: #FF6B00;
    transform: translateX(8px);
}

.btn-arrow {
    transition: transform 0.3s;
}

.btn-explore:hover .btn-arrow {
    transform: translateX(8px);
}

.zones-visual {
    position: relative;
}

.map-container {
    width: 100%;
    height: 500px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    position: relative;
    overflow: hidden;
}

.map-grid {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image:
        linear-gradient(rgba(255, 107, 0, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 107, 0, 0.1) 1px, transparent 1px);
    background-size: 40px 40px;
}

.zone-marker {
    position: absolute;
    width: 40px;
    height: 40px;
}

.marker-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 2px solid #FF6B00;
    border-radius: 50%;
    animation: ringPulse 2s ease-in-out infinite;
}

@keyframes ringPulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(2);
        opacity: 0;
    }
}

.marker-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    background: #FF6B00;
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(255, 107, 0, 0.8);
}

.map-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(255, 107, 0, 0.1), transparent);
    pointer-events: none;
}

/* Stats Showcase */
.stats-showcase {
    padding: 80px 40px;
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(157, 0, 255, 0.1));
    position: relative;
    z-index: 1;
}

.stats-container {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 40px;
}

.stat-item {
    text-align: center;
    padding: 40px 20px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s;
}

.stat-item:hover {
    transform: translateY(-8px);
    border-color: rgba(255, 107, 0, 0.5);
}

.stat-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.stat-value {
    font-size: 36px;
    font-weight: 900;
    background: linear-gradient(135deg, #FF6B00, #FFD700);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 8px;
}

.stat-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* CTA Section */
.cta-section {
    padding: 120px 40px;
    position: relative;
    z-index: 1;
}

.cta-container {
    max-width: 1200px;
    margin: 0 auto;
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(157, 0, 255, 0.1));
    border: 2px solid rgba(255, 107, 0, 0.3);
    border-radius: 32px;
    padding: 80px 60px;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.cta-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 900;
    line-height: 1.2;
    margin-bottom: 24px;
    letter-spacing: -0.02em;
}

.cta-subtitle {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 48px;
}

.cta-button {
    background: linear-gradient(135deg, #FF6B00, #FF8C00);
    border: none;
    color: white;
    padding: 20px 60px;
    border-radius: 50px;
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 0 12px 48px rgba(255, 107, 0, 0.5);
    transition: all 0.3s;
}

.cta-button:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 16px 64px rgba(255, 107, 0, 0.7);
}

.cta-note {
    margin-top: 24px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
}

.trophy-glow {
    position: absolute;
    top: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 107, 0, 0.3), transparent);
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
}

/* Footer */
.footer {
    background: rgba(0, 0, 0, 0.5);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 60px 40px 32px;
    position: relative;
    z-index: 1;
}

.footer-container {
    max-width: 1400px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 2fr 3fr 1fr;
    gap: 60px;
    margin-bottom: 40px;
}

.footer-brand {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.footer-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 900;
}

.logo-ball.small {
    width: 32px;
    height: 32px;
}

.footer-tagline {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
}

.footer-links {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 40px;
}

.link-group h4 {
    color: white;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.link-group a {
    display: block;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    font-size: 14px;
    margin-bottom: 12px;
    transition: color 0.2s;
}

.link-group a:hover {
    color: #FF6B00;
}

.footer-social {
    display: flex;
    gap: 12px;
}

.social-btn {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.3s;
}

.social-btn:hover {
    background: linear-gradient(135deg, #FF6B00, #FF8C00);
    color: white;
    transform: translateY(-4px);
}

.footer-bottom {
    text-align: center;
    padding-top: 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-bottom p {
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
}

/* 3D Basketball */
.basketball-3d {
    position: absolute;
    right: 10%;
    top: 50%;
    transform: translateY(-50%);
    animation: fadeIn 1s ease-out 1.4s backwards;
    filter: drop-shadow(0 20px 60px rgba(255, 107, 0, 0.6));
    z-index: 10;
}

.ball-container {
    width: 300px;
    height: 300px;
    perspective: 1200px;
}

.basketball {
    width: 100%;
    height: 100%;
}

/* Responsive */
@media (max-width: 1024px) {
    .basketball-3d {
        display: none;
    }

    .zones-container,
    .footer-container {
        grid-template-columns: 1fr;
    }

    .stats-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .nav-links {
        display: none;
    }

    .hero-stats {
        flex-direction: column;
        gap: 24px;
    }

    .hero-ctas {
        flex-direction: column;
    }

    .features-grid {
        grid-template-columns: 1fr;
    }

    .stats-container {
        grid-template-columns: 1fr;
    }
}
</style>
