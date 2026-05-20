import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://slabclash-api.onrender.com/v1'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth endpoints
export const authApi = {
  signup: (data: SignupDto) => 
    apiClient.post<AuthResponse>('/auth/signup', data),
  login: (data: LoginDto) => 
    apiClient.post<AuthResponse>('/auth/login', data),
  logout: () => 
    apiClient.post('/auth/logout'),
}

// Scan endpoints
export const scanApi = {
  createUploadUrls: (data: CreateUploadUrlsDto) =>
    apiClient.post<UploadUrlsResponse>('/scan/upload', data),
  process: (scanJobId: string) =>
    apiClient.post(`/scan/process/${scanJobId}`),
  getStatus: (scanJobId: string) =>
    apiClient.get<ScanStatusResponse>(`/scan/status/${scanJobId}`),
  confirm: (scanJobId: string, data: ConfirmScanDto) =>
    apiClient.post<ConfirmScanResponse>(`/scan/confirm/${scanJobId}`, data),
}

// Card endpoints
export const cardApi = {
  getById: (cardId: string) =>
    apiClient.get<CardDetail>(`/cards/${cardId}`),
  updateMetadata: (cardId: string, data: UpdateCardMetadataDto) =>
    apiClient.patch(`/cards/${cardId}/metadata`, data),
  getUserCards: (userId: string, params?: ListCardsQueryDto) =>
    apiClient.get<PaginatedCards>(`/users/${userId}/cards`, { params }),
}

// Lineup endpoints
export const lineupApi = {
  create: (data: CreateLineupDto) =>
    apiClient.post<Lineup>('/lineup', data),
  getById: (lineupId: string) =>
    apiClient.get<Lineup>(`/lineup/${lineupId}`),
  getUserLineups: (userId: string) =>
    apiClient.get<Lineup[]>(`/users/${userId}/lineups`),
}

// Matchmaking endpoints
export const matchmakingApi = {
  enqueue: (data: EnqueueMatchmakingDto) =>
    apiClient.post('/matchmaking/enqueue', data),
  getStatus: () =>
    apiClient.get<MatchmakingStatus>('/matchmaking/status'),
  cancel: () =>
    apiClient.post('/matchmaking/cancel'),
}

// Match endpoints
export const matchApi = {
  resolve: (data: ResolveMatchDto) =>
    apiClient.post<MatchResult>('/match/resolve', data),
  getById: (matchId: string) =>
    apiClient.get<MatchResult>(`/match/${matchId}`),
}

// Rating endpoints
export const ratingApi = {
  calculate: (data: CalcRatingDto) =>
    apiClient.post<CalcRatingResponse>('/rating/calc', data),
}

// Types
export interface SignupDto {
  email: string
  password: string
  username: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface User {
  id: string
  email: string
  username: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface CreateUploadUrlsDto {
  frontFileName: string
  backFileName: string
  frontContentType: string
  backContentType: string
}

export interface UploadUrlsResponse {
  scanJobId: string
  uploadUrlFront: string
  uploadUrlBack: string
}

export interface ScanStatusResponse {
  status: 'pending' | 'processing' | 'awaiting_user_confirm' | 'completed' | 'failed'
  candidateMatches?: CandidateMatch[]
  error?: string
}

export interface CandidateMatch {
  id: string
  player: string
  year: number
  set: string
  variant?: string
  confidence: number
  imageUrl?: string
}

export interface ConfirmScanDto {
  player: string
  year: number
  set: string
  variant?: string
  condition: string
  notes?: string
}

export interface ConfirmScanResponse {
  cardId: string
  powerScore: number
}

export interface CardDetail {
  id: string
  userId: string
  player: string
  year: number
  set: string
  variant?: string
  condition: string
  powerScore: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  imageUrlFront: string
  imageUrlBack?: string
  stats?: CardStats
  estimatedValue?: number
  createdAt: string
  updatedAt: string
  powerBreakdown?: PowerBreakdown
}

export interface CardStats {
  attack: number
  defense: number
  speed: number
  special: number
}

export interface PowerBreakdown {
  baseScore: number
  conditionMultiplier: number
  rarityBonus: number
  setBonus: number
  total: number
}

export interface UpdateCardMetadataDto {
  player?: string
  year?: number
  set?: string
  variant?: string
  condition?: string
  notes?: string
}

export interface ListCardsQueryDto {
  page?: number
  limit?: number
  rarity?: string
  set?: string
  year?: number
  player?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedCards {
  cards: CardDetail[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateLineupDto {
  name: string
  cards: LineupCard[]
}

export interface LineupCard {
  cardId: string
  position: number
}

export interface Lineup {
  id: string
  userId: string
  name: string
  cards: (LineupCard & { card: CardDetail })[]
  totalPower: number
  createdAt: string
  updatedAt: string
}

export interface EnqueueMatchmakingDto {
  lineupId: string
}

export interface MatchmakingStatus {
  inQueue: boolean
  position?: number
  estimatedWaitTime?: number
  lineupId?: string
}

export interface ResolveMatchDto {
  matchId: string
}

export interface MatchResult {
  id: string
  player1: MatchPlayer
  player2: MatchPlayer
  winnerId: string
  positionResults: PositionResult[]
  rewards: MatchRewards
  createdAt: string
}

export interface MatchPlayer {
  userId: string
  username: string
  lineup: Lineup
  totalScore: number
}

export interface PositionResult {
  position: number
  player1Card: CardDetail
  player2Card: CardDetail
  player1Score: number
  player2Score: number
  winnerId: string
}

export interface MatchRewards {
  winnerId: string
  xpGained: number
  coinsGained: number
  cardsWon?: CardDetail[]
}

export interface CalcRatingDto {
  cardId: string
}

export interface CalcRatingResponse {
  cardId: string
  totalRating: number
  breakdown: PowerBreakdown
}

// Upload helper for S3 presigned URLs
export async function uploadToPresignedUrl(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    })
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'))
    })
    
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}
