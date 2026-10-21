import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

/** URL-based pagination: keeps every other search param, changes only `page`. */
export function PaginationLinks({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== 'page') params.set(k, v);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={href(Math.max(1, page - 1))} aria-disabled={page === 1} className={page === 1 ? 'pointer-events-none opacity-50' : ''} />
        </PaginationItem>
        {pages.map((p, i) => (
          <PaginationItem key={p}>
            {i > 0 && p - pages[i - 1]! > 1 ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={href(p)} isActive={p === page}>
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href={href(Math.min(totalPages, page + 1))} aria-disabled={page === totalPages} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
