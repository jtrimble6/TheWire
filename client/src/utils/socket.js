import { io } from 'socket.io-client'

// In production, connect to the same origin (frontend + backend on Render)
// In development, connect to the local backend
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3001'

export const socket = io(URL, { autoConnect: false })
