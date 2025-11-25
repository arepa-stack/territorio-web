<template>
    <div class="player-profile">
        <v-row>
            <!-- Left Column: Profile Card -->
            <v-col cols="12" md="4">
                <v-card class="text-center pa-6 h-100" elevation="2">
                    <div class="avatar-wrapper mb-4">
                        <v-avatar size="120" color="primary" class="elevation-4">
                            <v-img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="Avatar" cover />
                            <v-icon v-else size="60" color="white">
                                mdi-account
                            </v-icon>

                            <!-- Edit Avatar Button -->
                            <v-btn icon size="small" color="secondary" class="edit-avatar-btn"
                                @click="triggerAvatarUpload">
                                <v-icon>mdi-camera</v-icon>
                            </v-btn>
                        </v-avatar>
                    </div>

                    <h2 class="text-h5 font-weight-bold mb-1">
                        {{ profile.fullName }}
                    </h2>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                        {{ profile.position || 'Posición no definida' }}
                    </p>

                    <v-chip :color="profile.status === 'ACTIVE' ? 'success' : 'warning'" variant="tonal" class="mb-6">
                        {{ profile.status === 'ACTIVE' ? 'Jugador Activo' : 'Inactivo' }}
                    </v-chip>

                    <v-divider class="mb-6" />

                    <div class="d-flex justify-space-around mb-6">
                        <div class="text-center">
                            <div class="text-h6 font-weight-bold">{{ profile.height || '-' }}</div>
                            <div class="text-caption text-medium-emphasis">cm</div>
                        </div>
                        <div class="text-center">
                            <div class="text-h6 font-weight-bold">{{ profile.weight || '-' }}</div>
                            <div class="text-caption text-medium-emphasis">kg</div>
                        </div>
                        <div class="text-center">
                            <div class="text-h6 font-weight-bold">{{ calculateAge(profile.birthDate) }}</div>
                            <div class="text-caption text-medium-emphasis">Edad</div>
                        </div>
                    </div>

                    <v-btn block variant="outlined" color="primary" prepend-icon="mdi-share-variant"
                        @click="shareProfile">
                        Compartir Perfil
                    </v-btn>
                </v-card>
            </v-col>

            <!-- Right Column: Edit Form -->
            <v-col cols="12" md="8">
                <v-card elevation="2">
                    <v-tabs v-model="activeTab" color="primary">
                        <v-tab value="personal">Datos Personales</v-tab>
                        <v-tab value="sports">Datos Deportivos</v-tab>
                        <v-tab value="account">Cuenta</v-tab>
                    </v-tabs>

                    <v-card-text class="pa-6">
                        <v-window v-model="activeTab">
                            <!-- Personal Info Tab -->
                            <v-window-item value="personal">
                                <v-form ref="personalForm" v-model="isPersonalValid" @submit.prevent="savePersonalData">
                                    <v-row>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="form.fullName" label="Nombre Completo"
                                                prepend-inner-icon="mdi-account" :rules="[v => !!v || 'Requerido']" />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="form.ci" label="Cédula de Identidad"
                                                prepend-inner-icon="mdi-card-account-details" disabled
                                                hint="Contacta a soporte para cambiar esto" />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="form.email" label="Correo Electrónico"
                                                prepend-inner-icon="mdi-email" disabled />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="form.phone" label="Teléfono"
                                                prepend-inner-icon="mdi-phone" />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="form.birthDate" label="Fecha de Nacimiento"
                                                type="date" prepend-inner-icon="mdi-calendar" />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="form.city" label="Ciudad"
                                                prepend-inner-icon="mdi-city" />
                                        </v-col>
                                        <v-col cols="12">
                                            <v-textarea v-model="form.bio" label="Biografía / Sobre mí" rows="3"
                                                prepend-inner-icon="mdi-text" />
                                        </v-col>
                                    </v-row>

                                    <div class="d-flex justify-end mt-4">
                                        <v-btn type="submit" color="primary" :loading="saving"
                                            :disabled="!isPersonalValid">
                                            Guardar Cambios
                                        </v-btn>
                                    </div>
                                </v-form>
                            </v-window-item>

                            <!-- Sports Info Tab -->
                            <v-window-item value="sports">
                                <v-form ref="sportsForm" v-model="isSportsValid" @submit.prevent="saveSportsData">
                                    <v-row>
                                        <v-col cols="12" md="6">
                                            <v-select v-model="form.position" label="Posición Principal"
                                                :items="positions" prepend-inner-icon="mdi-basketball" />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-select v-model="form.secondaryPosition"
                                                label="Posición Secundaria (Opcional)" :items="positions"
                                                prepend-inner-icon="mdi-basketball" clearable />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="form.height" label="Altura (cm)" type="number"
                                                prepend-inner-icon="mdi-ruler" suffix="cm" />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="form.weight" label="Peso (kg)" type="number"
                                                prepend-inner-icon="mdi-weight" suffix="kg" />
                                        </v-col>
                                        <v-col cols="12" md="6">
                                            <v-text-field v-model="form.jerseyNumber"
                                                label="Número de Camiseta Preferido" type="number"
                                                prepend-inner-icon="mdi-tshirt-crew" />
                                        </v-col>
                                    </v-row>

                                    <div class="d-flex justify-end mt-4">
                                        <v-btn type="submit" color="primary" :loading="saving"
                                            :disabled="!isSportsValid">
                                            Actualizar Datos Deportivos
                                        </v-btn>
                                    </div>
                                </v-form>
                            </v-window-item>

                            <!-- Account Settings Tab -->
                            <v-window-item value="account">
                                <div class="text-body-1 mb-4">Configuración de la cuenta</div>

                                <v-list lines="two">
                                    <v-list-item>
                                        <template #prepend>
                                            <v-icon color="primary">mdi-lock-reset</v-icon>
                                        </template>
                                        <v-list-item-title>Cambiar Contraseña</v-list-item-title>
                                        <v-list-item-subtitle>Actualiza tu contraseña
                                            periódicamente</v-list-item-subtitle>
                                        <template #append>
                                            <v-btn variant="text" color="primary">Cambiar</v-btn>
                                        </template>
                                    </v-list-item>

                                    <v-divider />

                                    <v-list-item>
                                        <template #prepend>
                                            <v-icon color="primary">mdi-bell-outline</v-icon>
                                        </template>
                                        <v-list-item-title>Notificaciones</v-list-item-title>
                                        <v-list-item-subtitle>Gestiona tus preferencias de correo</v-list-item-subtitle>
                                        <template #append>
                                            <v-switch color="primary" hide-details density="compact"></v-switch>
                                        </template>
                                    </v-list-item>

                                    <v-divider />

                                    <v-list-item class="mt-4">
                                        <template #prepend>
                                            <v-icon color="error">mdi-delete-outline</v-icon>
                                        </template>
                                        <v-list-item-title class="text-error">Eliminar Cuenta</v-list-item-title>
                                        <v-list-item-subtitle>Esta acción es irreversible</v-list-item-subtitle>
                                        <template #append>
                                            <v-btn color="error" variant="outlined">Eliminar</v-btn>
                                        </template>
                                    </v-list-item>
                                </v-list>
                            </v-window-item>
                        </v-window>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Hidden File Input -->
        <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="handleAvatarChange">
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const toast = useToast()

// State
const activeTab = ref('personal')
const saving = ref(false)
const isPersonalValid = ref(false)
const isSportsValid = ref(false)
const fileInput = ref(null)

const profile = reactive({
    fullName: '',
    email: '',
    avatarUrl: null,
    position: '',
    status: 'ACTIVE',
    height: 0,
    weight: 0,
    birthDate: null
})

const form = reactive({
    fullName: '',
    ci: '',
    email: '',
    phone: '',
    birthDate: '',
    city: '',
    bio: '',
    position: null,
    secondaryPosition: null,
    height: null,
    weight: null,
    jerseyNumber: null
})

const positions = [
    'Base (Point Guard)',
    'Escolta (Shooting Guard)',
    'Alero (Small Forward)',
    'Ala Pivot (Power Forward)',
    'Pivot (Center)'
]

// Methods
const calculateAge = (dateString) => {
    if (!dateString) return '-'
    const today = new Date()
    const birthDate = new Date(dateString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }
    return age
}

const triggerAvatarUpload = () => {
    fileInput.value.click()
}

const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (file) {
        // In a real app, upload to server here
        // For now, create a local URL
        const reader = new FileReader()
        reader.onload = (e) => {
            profile.avatarUrl = e.target.result
            toast.success('Avatar actualizado')
        }
        reader.readAsDataURL(file)
    }
}

const loadProfile = async () => {
    // Mock data loading
    // In real app: const data = await playerStore.getProfile()
    const user = authStore.user || {}

    profile.fullName = user.fullName || 'Usuario'
    profile.email = user.email || ''
    profile.status = 'ACTIVE'

    // Fill form
    form.fullName = user.fullName || ''
    form.email = user.email || ''
    form.ci = '12345678' // Mock
    form.position = 'Base (Point Guard)'
    form.height = 185
    form.weight = 82
    form.birthDate = '1995-05-15'

    // Sync profile display data
    profile.height = form.height
    profile.weight = form.weight
    profile.birthDate = form.birthDate
    profile.position = form.position
}

const savePersonalData = async () => {
    saving.value = true
    try {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API
        profile.fullName = form.fullName
        profile.birthDate = form.birthDate
        toast.success('Datos personales actualizados')
    } catch (error) {
        toast.error('Error al guardar')
    } finally {
        saving.value = false
    }
}

const saveSportsData = async () => {
    saving.value = true
    try {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API
        profile.position = form.position
        profile.height = form.height
        profile.weight = form.weight
        toast.success('Datos deportivos actualizados')
    } catch (error) {
        toast.error('Error al guardar')
    } finally {
        saving.value = false
    }
}

const shareProfile = () => {
    // Copy link to clipboard
    navigator.clipboard.writeText(window.location.href)
    toast.info('Enlace copiado al portapapeles')
}

onMounted(() => {
    loadProfile()
})
</script>

<style scoped>
.avatar-wrapper {
    position: relative;
    display: inline-block;
}

.edit-avatar-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    border: 2px solid rgb(var(--v-theme-surface));
}

/* Custom tab styling */
:deep(.v-tab) {
    text-transform: none;
    font-weight: 600;
}
</style>
