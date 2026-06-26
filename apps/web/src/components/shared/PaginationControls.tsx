import { Button } from '@/components/ui';

interface IPaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: IPaginationControlsProps) => {
  if (totalItems <= pageSize) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-[var(--text-2)]">
        Page {page} of {totalPages} / {totalItems} total
      </p>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
