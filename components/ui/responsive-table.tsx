
'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  className?: string
}

interface ResponsiveTableProps {
  columns: Column[]
  data: any[]
  onRowClick?: (row: any) => void
  loading?: boolean
  emptyMessage?: string
}

export function ResponsiveTable({ 
  columns, 
  data, 
  onRowClick, 
  loading = false,
  emptyMessage = "Aucune donnée disponible"
}: ResponsiveTableProps) {
  const isMobile = useIsMobile()

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((row, index) => (
          <Card 
            key={index} 
            className={`${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                {columns.map((column) => {
                  const value = row[column.key]
                  return (
                    <div key={column.key} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500 min-w-0 flex-1">
                        {column.label}:
                      </span>
                      <span className="text-sm text-gray-900 min-w-0 flex-1 text-right">
                        {column.render ? column.render(value, row) : value || '-'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr 
              key={index}
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => {
                const value = row[column.key]
                return (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(value, row) : value || '-'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
