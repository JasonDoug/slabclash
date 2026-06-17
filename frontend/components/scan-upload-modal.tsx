'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { scanApi, uploadToPresignedUrl } from '@/lib/api/client'
import { confirmScanSchema, type ConfirmScanFormData, conditionLabels } from '@/lib/validation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Upload, ImagePlus, X, AlertCircle, Check, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type ScanStep = 'upload' | 'processing' | 'confirm'

interface ScanUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScanUploadModal({ open, onOpenChange }: ScanUploadModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<ScanStep>('upload')
  const [frontImage, setFrontImage] = useState<File | null>(null)
  const [backImage, setBackImage] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState({ front: 0, back: 0 })
  const [error, setError] = useState<string | null>(null)
  const [scanJobId, setScanJobId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset: resetForm,
  } = useForm<ConfirmScanFormData>({
    resolver: zodResolver(confirmScanSchema),
    defaultValues: {
      condition: 'near_mint',
    },
  })

  const resetModal = useCallback(() => {
    setStep('upload')
    setFrontImage(null)
    setBackImage(null)
    setFrontPreview(null)
    setBackPreview(null)
    setUploadProgress({ front: 0, back: 0 })
    setError(null)
    setScanJobId(null)
    resetForm()
  }, [resetForm])

  const handleClose = useCallback(() => {
    resetModal()
    onOpenChange(false)
  }, [onOpenChange, resetModal])

  // Handle file selection
  const handleFileSelect = useCallback(
    (type: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB')
        return
      }

      setError(null)

      if (type === 'front') {
        setFrontImage(file)
        setFrontPreview(URL.createObjectURL(file))
      } else {
        setBackImage(file)
        setBackPreview(URL.createObjectURL(file))
      }
    },
    []
  )

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!frontImage || !backImage) throw new Error('Please select both images')

      // Step 1: Get presigned URLs
      const { data: urls } = await scanApi.createUploadUrls({
        frontFileName: frontImage.name,
        backFileName: backImage.name,
        frontContentType: frontImage.type,
        backContentType: backImage.type,
      })

      setScanJobId(urls.scanJobId)

      // Step 2: Upload to S3
      await Promise.all([
        uploadToPresignedUrl(urls.uploadUrlFront, frontImage, (progress) =>
          setUploadProgress((prev) => ({ ...prev, front: progress }))
        ),
        uploadToPresignedUrl(urls.uploadUrlBack, backImage, (progress) =>
          setUploadProgress((prev) => ({ ...prev, back: progress }))
        ),
      ])

      // Step 3: Start processing
      await scanApi.process(urls.scanJobId)

      return urls.scanJobId
    },
    onSuccess: async (jobId) => {
      setStep('processing')
      
      // Poll for status
      const pollStatus = async () => {
        try {
          const { data: status } = await scanApi.getStatus(jobId)
          
          if (status.status === 'awaiting_user_confirm') {
            // Pre-fill form with top candidate match
            if (status.candidateMatches?.[0]) {
              const match = status.candidateMatches[0]
              setValue('player', match.player)
              setValue('year', match.year)
              setValue('set', match.set)
              if (match.variant) setValue('variant', match.variant)
            }
            setStep('confirm')
            return
          }
          
          if (status.status === 'failed') {
            setError(status.error || 'Processing failed')
            setStep('upload')
            return
          }
          
          // Continue polling
          setTimeout(pollStatus, 2000)
        } catch {
          setError('Failed to check processing status')
          setStep('upload')
        }
      }
      
      pollStatus()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Upload failed')
    },
  })

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: async (data: ConfirmScanFormData) => {
      if (!scanJobId) throw new Error('No scan job')
      
      // Map frontend fields to backend ConfirmScanDto
      const response = await scanApi.confirm(scanJobId, {
        playerId: 'p1', // Demo: using p1 for now, in real use we'd pick from candidates
        year: data.year,
        setName: data.set,
        variant: data.variant,
        conditionReported: data.condition as any,
        confirm: true,
        playerStats: 85, // Default for demo
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      handleClose()
      router.push(`/cards/${data.cardId}`)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to confirm scan')
    },
  })

  const condition = watch('condition')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Add New Card'}
            {step === 'processing' && 'Processing...'}
            {step === 'confirm' && 'Confirm Card Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload photos of the front and back of your card'}
            {step === 'processing' && 'Our AI is analyzing your card'}
            {step === 'confirm' && 'Review and confirm the card information'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Front Image */}
              <div className="space-y-2">
                <Label>Front of Card</Label>
                <label
                  className={cn(
                    'flex aspect-[2.5/3.5] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                    frontPreview
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  {frontPreview ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={frontPreview}
                        alt="Front preview"
                        fill
                        className="rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setFrontImage(null)
                          setFrontPreview(null)
                        }}
                        className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                        <Check className="mr-1 inline h-3 w-3" />
                        Front
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
                      <Camera className="h-8 w-8" />
                      <span className="text-sm font-medium">Front</span>
                      <span className="text-xs">Click to upload</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect('front')}
                  />
                </label>
              </div>

              {/* Back Image */}
              <div className="space-y-2">
                <Label>Back of Card</Label>
                <label
                  className={cn(
                    'flex aspect-[2.5/3.5] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                    backPreview
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  {backPreview ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={backPreview}
                        alt="Back preview"
                        fill
                        className="rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setBackImage(null)
                          setBackPreview(null)
                        }}
                        className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                        <Check className="mr-1 inline h-3 w-3" />
                        Back
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-sm font-medium">Back</span>
                      <span className="text-xs">Click to upload</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect('back')}
                  />
                </label>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadMutation.isPending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading front...</span>
                  <span>{uploadProgress.front}%</span>
                </div>
                <Progress value={uploadProgress.front} />
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading back...</span>
                  <span>{uploadProgress.back}%</span>
                </div>
                <Progress value={uploadProgress.back} />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!frontImage || !backImage || uploadMutation.isPending}
                onClick={() => uploadMutation.mutate()}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Scan
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <Spinner className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">Analyzing your card...</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Our AI is identifying the player, year, and set
              </p>
            </div>
          </div>
        )}

        {/* Confirm Step */}
        {step === 'confirm' && (
          <form onSubmit={handleSubmit((data) => confirmMutation.mutate(data))} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="player">Player Name *</Label>
                <Input
                  id="player"
                  {...register('player')}
                  className={errors.player ? 'border-destructive' : ''}
                />
                {errors.player && (
                  <p className="text-xs text-destructive">{errors.player.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  className={errors.year ? 'border-destructive' : ''}
                />
                {errors.year && (
                  <p className="text-xs text-destructive">{errors.year.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="set">Set *</Label>
                <Input
                  id="set"
                  {...register('set')}
                  className={errors.set ? 'border-destructive' : ''}
                />
                {errors.set && (
                  <p className="text-xs text-destructive">{errors.set.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant">Variant</Label>
                <Input id="variant" {...register('variant')} placeholder="Optional" />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={condition}
                  onValueChange={(value) => setValue('condition', value as ConfirmScanFormData['condition'])}
                >
                  <SelectTrigger className={errors.condition ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(conditionLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.condition && (
                  <p className="text-xs text-destructive">{errors.condition.message}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" {...register('notes')} placeholder="Any additional notes..." />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('upload')
                  setError(null)
                }}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm & Add
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
