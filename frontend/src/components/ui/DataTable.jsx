import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingState } from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'

function normalizeColumn(column) {
  if (typeof column === 'string') {
    return { key: column, label: column }
  }
  return column
}

export function DataTable({
  columns,
  loading = false,
  isEmpty = false,
  loadingMessage = 'Loading...',
  emptyTitle = 'No records found',
  emptyDescription,
  className,
  children,
}) {
  const normalizedColumns = columns.map(normalizeColumn)
  const colSpan = normalizedColumns.length || 1

  return (
    <div className={cn('table-wrap', className)}>
      <table className="table-base">
        <thead>
          <tr>
            {normalizedColumns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan}>
                <LoadingState label={loadingMessage} />
              </td>
            </tr>
          ) : null}
          {!loading && isEmpty ? (
            <tr>
              <td colSpan={colSpan}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : null}
          {!loading && !isEmpty ? children : null}
        </tbody>
      </table>
    </div>
  )
}
