import { POKEMON } from '@/data/pokemon';
import { SPECIALTY_ICONS } from '@/data/specialty-icons';
import { cn } from '@/lib/cn';
import { partitionGroups } from '@/lib/picker-groups';
import { useStore } from '@/state/store';
import { ChevronDown, FolderTree } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export function SpecialtyFilter() {
  const selected = useStore((s) => s.filters.specialtyFilter);
  const grouping = useStore((s) => s.filters.pickerGrouping);
  const setFilter = useStore((s) => s.setFilter);
  const [open, setOpen] = useState(false);

  // The filter dropdown shows the same set of groups the picker grid uses —
  // real specialties (>2 members) plus the virtual Story and Misc. buckets —
  // so toggling 'Story' or 'Misc.' is consistent with how the grid groups.
  const options = useMemo(() => partitionGroups(POKEMON).orderedKeys, []);

  function toggle(key: string) {
    const set = new Set(selected);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    setFilter('specialtyFilter', Array.from(set));
  }

  const triggerContent =
    selected.length === 0 ? (
      <span className="text-muted-foreground">All Specialties</span>
    ) : (
      <span className="flex items-center gap-1.5 min-w-0 flex-wrap">
        {selected.map((key) => {
          const icon = SPECIALTY_ICONS[key];
          return (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-full bg-card-soft px-1.5 py-0.5 text-xs"
            >
              {icon ? (
                <img src={icon} alt="" aria-hidden className="size-4 [image-rendering:pixelated]" />
              ) : null}
              <span>{key}</span>
            </span>
          );
        })}
      </span>
    );

  return (
    <div className="flex gap-1.5 items-stretch">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex-1 inline-flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm text-foreground cursor-pointer transition-colors min-h-9 min-w-0',
              open ? 'border-primary' : 'border-border-soft hover:border-border',
            )}
          >
            <span className="flex-1 min-w-0 text-left">{triggerContent}</span>
            <ChevronDown className="size-3.5 opacity-60 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] max-h-72 overflow-auto p-1"
          align="start"
        >
          <ul className="list-none m-0 p-0">
            <li>
              <button
                type="button"
                onClick={() => setFilter('specialtyFilter', [])}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-card-soft text-left',
                  selected.length === 0 && 'bg-card-soft',
                )}
              >
                <Checkbox checked={selected.length === 0} tabIndex={-1} />
                <span aria-hidden className="inline-block size-5 shrink-0" />
                <span className="font-medium">All</span>
              </button>
            </li>
            <li aria-hidden className="my-1 border-t border-border-soft" />
            {options.map((key) => {
              const checked = selected.includes(key);
              const icon = SPECIALTY_ICONS[key];
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-card-soft text-left"
                  >
                    <Checkbox checked={checked} tabIndex={-1} />
                    {icon ? (
                      <img
                        src={icon}
                        alt=""
                        aria-hidden
                        className="size-5 [image-rendering:pixelated] shrink-0"
                      />
                    ) : (
                      <span aria-hidden className="inline-block size-5 shrink-0" />
                    )}
                    <span>{key}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={() => setFilter('pickerGrouping', grouping === 'specialty' ? 'none' : 'specialty')}
        aria-pressed={grouping === 'specialty'}
        aria-label={grouping === 'specialty' ? 'Show as flat list' : 'Group by specialty'}
        title={grouping === 'specialty' ? 'Show as flat list' : 'Group by specialty'}
        className={cn(
          'inline-grid place-items-center rounded-md min-w-9 px-2 cursor-pointer transition-colors shrink-0',
          grouping === 'specialty'
            ? 'bg-primary text-primary-foreground border-0'
            : 'bg-card text-muted-foreground border border-border-soft hover:text-foreground hover:border-border',
        )}
      >
        <FolderTree className="size-4" />
      </button>
    </div>
  );
}
