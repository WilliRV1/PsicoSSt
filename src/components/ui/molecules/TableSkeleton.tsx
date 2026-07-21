import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number, rows?: number }) {
  return (
    <div className="w-full bg-card border-none overflow-hidden animate-in fade-in">
      <table className="w-full text-sm text-left">
        <thead className="bg-transparent border-b border-white/5">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-4">
                <Skeleton className="h-4 w-24 bg-muted/50" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <Skeleton className="h-5 w-full max-w-[200px] bg-muted/50" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
