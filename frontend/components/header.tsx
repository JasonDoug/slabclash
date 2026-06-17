'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Layers, 
  LayoutGrid, 
  Trophy, 
  User, 
  LogOut,
  Menu,
  X,
  Swords,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/collection', label: 'My Collection', icon: LayoutGrid },
  { href: '/lineup', label: 'Build Lineup', icon: Layers },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/demo', label: 'War Demo', icon: Swords },
]

export function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Swords className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Slabclash</span>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user?.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user?.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {isAuthenticated && (
        <div
          className={cn(
            'overflow-hidden border-b border-border bg-background transition-all duration-200 md:hidden',
            mobileMenuOpen ? 'max-h-48' : 'max-h-0 border-b-0'
          )}
        >
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
