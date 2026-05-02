import { POKEMON } from '@/data/pokemon';
import { SPECIALTY_ICONS } from '@/data/specialty-icons';
import { cn } from '@/lib/cn';
import { MISC_GROUP, STORY_GROUP, partitionGroups } from '@/lib/picker-groups';
import { useStore } from '@/state/store';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export function SpecialtyFilter() {
  const selected = useStore((s) => s.filters.specialtyFilter);
  const habitatCompat = useStore((s) => s.filters.habitatCompatible);
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

  const label = selected.length === 0 ? 'All Specialties' : `${selected.length} selected`;

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'col-span-2 inline-flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm text-foreground cursor-pointer transition-colors',
              open ? 'border-primary' : 'border-border-soft hover:border-border',
            )}
          >
            <span>{label}</span>
            <ChevronDown className="size-3.5 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] max-h-72 overflow-auto p-1"
          align="start"
        >
          <ul className="list-none m-0 p-0">
            {options.map((key) => {
              const checked = selected.includes(key);
              const icon = SPECIALTY_ICONS[key];
              const isVirtual = key === STORY_GROUP || key === MISC_GROUP;
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
                      <span
                        aria-hidden
                        className={cn(
                          'inline-block size-5 rounded-sm shrink-0',
                          isVirtual ? 'bg-card-soft' : 'bg-card-soft',
                        )}
                      />
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
        onClick={() => setFilter('habitatCompatible', !habitatCompat)}
        aria-pressed={habitatCompat}
        className={cn(
          'rounded-md px-2.5 py-2 text-xs whitespace-nowrap cursor-pointer transition-colors',
          habitatCompat
            ? 'bg-primary text-primary-foreground border-0 font-semibold'
            : 'bg-card text-muted-foreground border border-border-soft hover:text-foreground hover:border-border',
        )}
      >
        Habitat: {habitatCompat ? 'compatible' : 'all'}
      </button>

      <button
        type="button"
        onClick={() => setFilter('pickerGrouping', grouping === 'specialty' ? 'none' : 'specialty')}
        aria-pressed={grouping === 'specialty'}
        title="Group by specialty"
        className={cn(
          'rounded-md px-2.5 py-2 text-xs whitespace-nowrap cursor-pointer transition-colors',
          grouping === 'specialty'
            ? 'bg-primary text-primary-foreground border-0 font-semibold'
            : 'bg-card text-muted-foreground border border-border-soft hover:text-foreground hover:border-border',
        )}
      >
        Group: {grouping === 'specialty' ? 'specialty' : 'flat'}
      </button>
    </div>
  );
}
