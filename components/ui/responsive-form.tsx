
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  value?: any
  onChange?: (value: any) => void
  className?: string
  disabled?: boolean
}

interface ResponsiveFormProps {
  title?: string
  subtitle?: string
  fields: FormField[]
  onSubmit: (e: React.FormEvent) => void
  submitLabel?: string
  loading?: boolean
  error?: string
  children?: React.ReactNode
  className?: string
}

export function ResponsiveForm({
  title,
  subtitle,
  fields,
  onSubmit,
  submitLabel = "Soumettre",
  loading = false,
  error,
  children,
  className = ""
}: ResponsiveFormProps) {
  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      placeholder: field.placeholder,
      required: field.required,
      disabled: field.disabled || loading,
      value: field.value || '',
      onChange: (e: any) => field.onChange?.(e.target.value),
      className: `${field.className || ''}`
    }

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={field.disabled || loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={4}
          />
        )
      default:
        return (
          <Input
            {...commonProps}
            type={field.type}
          />
        )
    }
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      {(title || subtitle) && (
        <CardHeader className="text-center sm:text-left">
          {title && <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>}
          {subtitle && <p className="text-sm sm:text-base text-gray-600 mt-2">{subtitle}</p>}
        </CardHeader>
      )}
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {fields.map((field) => (
              <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <Label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          {children}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {loading ? 'Traitement...' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
