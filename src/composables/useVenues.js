// Public venue list (GET /venues), fetched once per session and shared by every component
import { ref } from 'vue'
import venuesService from '@/services/venues'

const venues = ref([])
let request = null

export function useVenues() {
  request ||= venuesService
    .getAll()
    .then(res => (venues.value = res.data?.data || res.data || []))
    .catch(() => (request = null)) // retry on the next use

  // ponytail: matches store the venue by name; two venues with the same name would collide (store venueId on Match if that happens)
  const findByName = name => {
    const key = name?.trim().toLowerCase()
    return key ? venues.value.find(v => v.name.trim().toLowerCase() === key) : null
  }

  return { venues, findByName }
}
