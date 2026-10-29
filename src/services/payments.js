import api from './api'

const paymentsService = {
    // Captain: report the payment of a registration (latest report wins)
    async submit(registrationId, data) {
        return await api.post(`/registrations/${registrationId}/payments`, data)
    },

    // Captain: attach the receipt (image or PDF, max 5MB)
    async uploadReceipt(paymentId, file) {
        const fd = new FormData()
        fd.append('file', file)
        return await api.post(`/payments/${paymentId}/receipt`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    // Receipts are private (bank data): fetched with the token and opened as a blob
    async openReceipt(paymentId) {
        const tab = window.open('', '_blank') // opened before the await so popup blockers allow it
        try {
            const { data } = await api.get(`/payments/${paymentId}/receipt`, { responseType: 'blob' })
            const url = URL.createObjectURL(data)
            if (tab) tab.location.href = url
            else window.location.href = url
            setTimeout(() => URL.revokeObjectURL(url), 60000)
        } catch (error) {
            tab?.close()
            throw error
        }
    },

    // Organizer: payment history of a tournament
    async listForTournament(tournamentId) {
        return await api.get(`/tournaments/${tournamentId}/payments`)
    },

    // Organizer: { status: 'VERIFIED' | 'REJECTED', note? }
    async review(paymentId, data) {
        return await api.patch(`/payments/${paymentId}/review`, data)
    }
}

export default paymentsService
