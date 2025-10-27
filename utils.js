export const formatInactivity = (timestamp) => {
  const diffMs = Date.now() - timestamp
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60)
  return `${days}d ${hours}h ${minutes}m`
}
