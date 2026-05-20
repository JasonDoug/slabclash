'use client'

import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { Swords, Zap, Trophy, Users, ArrowRight, Sparkles, Shield } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-20 md:py-32">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          
          <div className="container relative mx-auto max-w-6xl">
            <div className="flex flex-col items-center text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Now in Open Beta</span>
              </div>

              <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                Scan. Collect.{' '}
                <span className="text-primary">Dominate.</span>
              </h1>
              
              <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
                Transform your trading cards into digital warriors. Build the ultimate lineup, 
                compete against collectors worldwide, and prove your collection is the best.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                {isAuthenticated ? (
                  <Link href="/collection">
                    <Button size="lg" className="gap-2">
                      Go to Collection
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button size="lg" className="gap-2">
                        Start Scanning
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8 md:gap-16">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary md:text-4xl">10K+</div>
                  <div className="mt-1 text-sm text-muted-foreground">Cards Scanned</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary md:text-4xl">5K+</div>
                  <div className="mt-1 text-sm text-muted-foreground">Active Players</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary md:text-4xl">50K+</div>
                  <div className="mt-1 text-sm text-muted-foreground">Matches Played</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-border bg-card/50 px-4 py-20">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold md:text-4xl">How It Works</h2>
              <p className="mt-4 text-muted-foreground">
                Three simple steps to start competing
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="group relative rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">1. Scan Your Cards</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Upload photos of your trading cards. Our AI instantly identifies 
                  the player, year, set, and condition.
                </p>
              </div>

              {/* Step 2 */}
              <div className="group relative rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">2. Build Your Lineup</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Strategically select 9 cards for your battle lineup. 
                  Each position matters - choose wisely.
                </p>
              </div>

              {/* Step 3 */}
              <div className="group relative rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">3. Compete & Win</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter matchmaking and battle other collectors. 
                  Win matches to earn rewards and climb the leaderboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20">
          <div className="container mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 text-center md:p-12">
              <div className="relative">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                    <Swords className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold md:text-3xl">
                  Ready to clash?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                  Join thousands of collectors who are already battling with their cards. 
                  Your collection could be the next champion.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  {isAuthenticated ? (
                    <Link href="/collection">
                      <Button size="lg" className="gap-2">
                        <Users className="h-4 w-4" />
                        View My Collection
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/signup">
                      <Button size="lg" className="gap-2">
                        Create Free Account
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card/50 px-4 py-8">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Swords className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">Slabclash</span>
              </div>
              <p className="text-sm text-muted-foreground">
                2024 Slabclash. All rights reserved.
              </p>
              <div className="flex gap-4">
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                  Terms
                </Link>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
