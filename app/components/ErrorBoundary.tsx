'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary for catching render errors in child components.
 * Prevents entire app from crashing when a component fails.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-ember-wash border border-ember/40 rounded-2xl">
          <p className="text-ember-deep text-sm font-medium">Something went wrong</p>
          <p className="text-bark-soft text-xs mt-1">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-xs px-2 py-1 bg-ember text-parchment-paper rounded-full hover:bg-ember-deep"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
