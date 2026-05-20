import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const confirmScanSchema = z.object({
  player: z.string().min(1, 'Player name is required'),
  year: z.number().min(1900, 'Year must be 1900 or later').max(new Date().getFullYear(), 'Year cannot be in the future'),
  set: z.string().min(1, 'Set name is required'),
  variant: z.string().optional(),
  condition: z.enum(['mint', 'near_mint', 'excellent', 'good', 'fair', 'poor'], {
    errorMap: () => ({ message: 'Please select a condition' }),
  }),
  notes: z.string().optional(),
})

export const updateCardMetadataSchema = z.object({
  player: z.string().min(1, 'Player name is required').optional(),
  year: z.number().min(1900).max(new Date().getFullYear()).optional(),
  set: z.string().min(1).optional(),
  variant: z.string().optional(),
  condition: z.enum(['mint', 'near_mint', 'excellent', 'good', 'fair', 'poor']).optional(),
  notes: z.string().optional(),
})

export const createLineupSchema = z.object({
  name: z.string().min(1, 'Lineup name is required').max(50, 'Name must be at most 50 characters'),
  cards: z.array(z.object({
    cardId: z.string().min(1),
    position: z.number().min(1).max(9),
  })).length(9, 'A lineup must have exactly 9 cards'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ConfirmScanFormData = z.infer<typeof confirmScanSchema>
export type UpdateCardMetadataFormData = z.infer<typeof updateCardMetadataSchema>
export type CreateLineupFormData = z.infer<typeof createLineupSchema>

// Condition labels for display
export const conditionLabels: Record<string, string> = {
  mint: 'Mint',
  near_mint: 'Near Mint',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

// Rarity labels and colors
export const rarityConfig: Record<string, { label: string; className: string }> = {
  common: { label: 'Common', className: 'bg-muted text-muted-foreground' },
  uncommon: { label: 'Uncommon', className: 'bg-chart-4/20 text-chart-4' },
  rare: { label: 'Rare', className: 'bg-chart-3/20 text-chart-3' },
  epic: { label: 'Epic', className: 'bg-chart-2/20 text-chart-2' },
  legendary: { label: 'Legendary', className: 'bg-chart-1/20 text-chart-1' },
}
