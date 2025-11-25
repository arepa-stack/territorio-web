# 🏀 Basketball Tournament System - Frontend

Sistema frontend moderno construido con Vue 3, Pinia y Vuetify para la gestión de torneos de baloncesto con sistema de dominación de zonas.

## 🚀 Características Principales

### ✨ Funcionalidades del MVP
- **🔐 Autenticación completa** con JWT y múltiples roles
- **👤 Dashboards personalizados** por tipo de usuario (Jugador, Capitán, Organizador, Admin)
- **🗺️ Sistema de dominación de zonas** con mapas interactivos
- **🔍 Búsqueda de jugadores** con validación de conflictos de zona
- **📊 Estadísticas en tiempo real** con gráficos interactivos
- **📱 Diseño responsive** mobile-first
- **🌙 Dark/Light mode** con tema corporativo
- **🔔 Sistema de notificaciones** integrado

### 🎯 Roles de Usuario

#### 🏀 **Jugador (PLAYER)**
- Dashboard con estadísticas personales
- Perfil completo con datos físicos y posición
- Equipos y torneos actuales
- Calendario de partidos
- Historial de rendimiento
- Mapa de zonas donde participa

#### 🎯 **Capitán de Equipo (TEAM_CAPTAIN)**
- Gestión completa del equipo
- Búsqueda y registro de jugadores por CI
- Validación automática de conflictos de zona
- Estadísticas del equipo
- Gestión de participaciones en torneos

#### 🏆 **Organizador (ORGANIZER)**
- Creación y gestión de torneos
- Sistema de zonas geográficas
- Mapa de dominación territorial
- Gestión de venues y canchas
- Panel de analytics en tiempo real
- Sistema de desafíos entre zonas

#### ⚙️ **Administrador (ADMIN)**
- Panel de control general
- Gestión de todos los usuarios
- Reportes y analytics del sistema
- Configuraciones globales
- Moderación de contenido

## 🛠️ Stack Tecnológico

### Core Technologies
- **Vue 3** - Framework frontend con Composition API
- **Pinia** - Estado global moderno
- **Vuetify 3** - Componentes UI con Material Design
- **Vue Router 4** - Navegación SPA
- **Vite** - Build tool ultrarrápido

### APIs y Servicios
- **Axios** - Cliente HTTP
- **Chart.js** - Gráficos y estadísticas
- **date-fns** - Manipulación de fechas
- **Vue Toastification** - Notificaciones

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **Prettier** - Formateo automático
- **Sass** - Preprocesador CSS

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── common/         # Componentes genéricos (StatsCard, etc.)
│   ├── auth/           # Componentes de autenticación
│   ├── zones/          # Mapa de zonas y dominación
│   ├── charts/         # Gráficos y visualizaciones
│   └── player/         # Componentes específicos de jugadores
├── views/              # Páginas principales
│   ├── auth/           # Login y registro
│   ├── player/         # Dashboard y vistas del jugador
│   ├── captain/        # Dashboard del capitán
│   ├── organizer/      # Dashboard del organizador
│   ├── admin/          # Dashboard del administrador
│   └── tournaments/    # Gestión de torneos
├── stores/             # Estado global (Pinia)
│   ├── auth.js         # Autenticación
│   ├── player.js       # Gestión de jugadores
│   ├── zones.js        # Sistema de zonas
│   └── tournament.js   # Gestión de torneos
├── services/           # Servicios API
│   ├── api.js          # Cliente base
│   ├── auth.js         # Autenticación
│   ├── players.js      # Jugadores
│   └── zones.js        # Zonas
├── router/             # Configuración de rutas
├── plugins/            # Plugins (Vuetify, etc.)
├── layouts/            # Layouts principales
│   ├── MainLayout.vue  # Layout principal con navegación
│   └── AuthLayout.vue  # Layout de autenticación
└── assets/             # Recursos estáticos
    ├── images/
    └── styles/
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js >= 16.0.0
- npm >= 8.0.0 o yarn >= 1.22.0

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd basketball-tournament-frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   ```

5. **Construir para producción**
   ```bash
   npm run build
   # o
   yarn build
   ```

## 📋 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Ejecutar servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Previsualizar build de producción

# Calidad de código
npm run lint         # Linting con ESLint
npm run format       # Formatear con Prettier

# Testing
npm run test         # Ejecutar tests unitarios
npm run test:e2e     # Ejecutar tests E2E
npm run test:coverage # Coverage de tests
```

## 🎨 Sistema de Diseño

### Tema Corporativo
- **Primary Color**: #FF5F1F (Naranja energético)
- **Secondary Color**: #007BFF (Azul confiable)
- **Dark Mode**: Negro puro (#000000) para eficiencia OLED
- **Typography**: Inter (Google Fonts)

### Componentes Personalizados
- **StatsCard**: Tarjetas de estadísticas con tendencias
- **ZoneMap**: Mapa interactivo de dominación territorial
- **PerformanceChart**: Gráficos de rendimiento con Chart.js
- **PlayerSearch**: Búsqueda con validación de conflictos

## 🔧 Configuración de Desarrollo

### Variables de Entorno
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Basketball Tournament System
VITE_DEFAULT_MAP_CENTER_LAT=4.6097
VITE_DEFAULT_MAP_CENTER_LNG=-74.0817
VITE_DEFAULT_CHART_THEME=dark
```

### Integración con Backend
El frontend está configurado para comunicarse con la API REST del backend en `http://localhost:3000/api`. Los endpoints principales incluyen:

- `POST /auth/login` - Autenticación
- `GET /players/search` - Búsqueda de jugadores
- `POST /players/check-availability` - Verificar conflictos de zona
- `GET /zones/dominance` - Datos de dominación
- `GET /tournaments` - Listado de torneos

## 🌟 Características Especiales

### Sistema de Dominación de Zonas
- Mapas SVG interactivos
- Visualización de nivel de dominación
- Sistema de desafíos entre equipos
- Indicadores en tiempo real

### Detección de Conflictos de Zona
- Validación automática al registrar jugadores
- Prevención de participación múltiple en la misma zona
- Interfaz visual para alertas de conflictos

### Dashboards Responsivos
- Mobile-first design
- Navegación adaptativa
- Componentes optimizados para touch
- Modo offline (PWA ready)

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Jest + Vue Test Utils
- **Component Tests**: Testing Library
- **E2E Tests**: Playwright
- **API Integration**: Supertest

### Ejecutar Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build
npm run build

# Deploy folder: dist/
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 📈 Performance

### Optimizaciones Incluidas
- **Code Splitting** por rutas y componentes
- **Lazy Loading** de componentes pesados
- **Virtual Scrolling** para listas largas
- **Image Optimization** automática
- **Bundle Analysis** integrado

### Métricas Target
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

## 🤝 Contribución

### Guidelines
1. Seguir las convenciones de Vue 3 + Composition API
2. Usar TypeScript para tipos complejos
3. Escribir tests para nuevas funcionalidades
4. Seguir el sistema de diseño establecido
5. Documentar APIs y componentes complejos

### Commits
```bash
feat: añadir nuevo dashboard de jugador
fix: corregir validación de conflictos de zona
docs: actualizar documentación de componentes
style: aplicar formato Prettier
refactor: reorganizar store de autenticación
test: añadir tests para componente ZoneMap
```

## 📞 Soporte

Para soporte técnico o reportar bugs:
- **Issues**: GitHub Issues
- **Documentación**: [Wiki del proyecto]
- **Email**: [support@basketball-system.com]

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 🏆 Estado del Proyecto

### ✅ Completado
- [x] Estructura base Vue 3 + Vuetify
- [x] Sistema de autenticación completo
- [x] Dashboards por rol implementados
- [x] Componentes de estadísticas
- [x] Mapa de zonas básico
- [x] Sistema de navegación responsive

### 🚧 En Desarrollo
- [ ] Integración completa con backend
- [ ] Tests unitarios
- [ ] Optimizaciones de performance
- [ ] PWA capabilities

### 📋 Pendiente
- [ ] App móvil (React Native)
- [ ] Sistema de pagos
- [ ] Streaming en vivo
- [ ] Analytics avanzados

---

**¡Construido con ❤️ por MiniMax Agent para revolucionar la gestión de torneos de baloncesto!** 🏀🚀