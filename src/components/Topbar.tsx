import { LOCATIONS } from '@/data/locations';
import { cn } from '@/lib/cn';
import { buildShareUrl } from '@/lib/share';
import { useStore } from '@/state/store';
import { type House, type HouseType, type LocationId, capacityPoints } from '@/types';
import { Check, Info, LayoutGrid, List, Moon, Plus, Share2, Sun } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

function pointsAtLocation(houses: House[], id: LocationId): number {
  return houses.filter((h) => h.location === id).reduce((sum, h) => sum + capacityPoints(h), 0);
}

const LOC_ACCENT: Record<LocationId, string> = {
  WW: 'text-loc-ww',
  BB: 'text-loc-bb',
  RR: 'text-loc-rr',
  SS: 'text-loc-ss',
  PT: 'text-loc-pt',
};

const LOC_BAR: Record<LocationId, string> = {
  WW: 'bg-loc-ww',
  BB: 'bg-loc-bb',
  RR: 'bg-loc-rr',
  SS: 'bg-loc-ss',
  PT: 'bg-loc-pt',
};

function ComposePopover({ onClose }: { onClose: () => void }) {
  const { pendingType, pendingSlots, activeLocation } = useStore((s) => s.filters);
  const setFilter = useStore((s) => s.setFilter);
  const addHouse = useStore((s) => s.addHouse);

  // Custom houses always have 4 slots (game has no smaller custom variant);
  // only prefab offers 1/2/4 sizes.
  const slotOptions: readonly (1 | 2 | 4)[] = pendingType === 'custom' ? [4] : [1, 2, 4];
  const targetName = activeLocation
    ? (LOCATIONS.find((l) => l.id === activeLocation)?.name ?? activeLocation)
    : 'Withered Wastelands';

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[60px_1fr] items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint-foreground">
          Type
        </span>
        <ToggleGroup
          type="single"
          value={pendingType}
          onValueChange={(v) => {
            if (!v) return;
            const t = v as HouseType;
            setFilter('pendingType', t);
            if (t === 'custom' && pendingSlots !== 4) setFilter('pendingSlots', 4);
          }}
          className="w-full justify-stretch"
        >
          <ToggleGroupItem value="prefab" className="flex-1">
            Prefab
          </ToggleGroupItem>
          <ToggleGroupItem value="custom" className="flex-1">
            Custom
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-[60px_1fr] items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint-foreground">
          Slots
        </span>
        <ToggleGroup
          type="single"
          value={String(pendingSlots)}
          onValueChange={(v) => {
            if (!v) return;
            setFilter('pendingSlots', Number(v) as 1 | 2 | 4);
          }}
          className="w-full justify-stretch"
        >
          {slotOptions.map((n) => (
            <ToggleGroupItem key={n} value={String(n)} className="flex-1">
              {n}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="text-center font-mono text-[10px] uppercase tracking-[0.08em] text-faint-foreground">
        Adds to {targetName}
      </div>

      <Button
        onClick={() => {
          addHouse();
          onClose();
        }}
      >
        Add house
      </Button>
    </div>
  );
}

export function Topbar() {
  const houses = useStore((s) => s.houses);
  const activeLocation = useStore((s) => s.filters.activeLocation);
  const view = useStore((s) => s.filters.view);
  const theme = useStore((s) => s.filters.theme);
  const setFilter = useStore((s) => s.setFilter);
  const [composeOpen, setComposeOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  async function handleShare() {
    const filters = useStore.getState().filters;
    const url = await buildShareUrl({ houses: useStore.getState().houses, filters });
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch {
      // Clipboard API blocked (insecure context, permission denied) — surface
      // the URL via prompt as a fallback so the user can copy manually.
      window.prompt('Share this URL:', url);
    }
  }

  return (
    <header className="grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-border-soft bg-secondary px-4 py-2 relative z-20">
      <div className="inline-flex items-baseline gap-2.5 font-mono uppercase">
        <span className="text-[15px] font-medium tracking-[0.16em] text-foreground">Pokopia</span>
        <span className="hidden xl:inline text-[10px] tracking-[0.18em] text-faint-foreground whitespace-nowrap">
          habitat planner
        </span>
      </div>

      <nav className="flex flex-wrap justify-center gap-1.5" aria-label="Locations">
        {LOCATIONS.map((loc) => {
          const used = pointsAtLocation(houses, loc.id);
          const active = activeLocation === loc.id;
          const ratio = Math.min(1, used / loc.capacity);
          return (
            <button
              type="button"
              key={loc.id}
              onClick={() => setFilter('activeLocation', active ? null : loc.id)}
              title={`${loc.name}${active ? ' — click to view all' : ''}`}
              className={cn(
                'relative inline-flex items-center gap-1.5 rounded-md border border-border-soft px-2.5 pt-1.5 pb-2 text-muted-foreground cursor-pointer transition-colors',
                'hover:bg-card-soft hover:text-foreground',
                active &&
                  'bg-card text-foreground border-border shadow-[inset_0_0_0_1px_var(--color-border-soft)]',
              )}
            >
              <img
                src={loc.iconUrl}
                alt=""
                aria-hidden
                className="size-4 [image-rendering:pixelated] shrink-0"
              />
              <span
                className={cn(
                  'font-mono text-[12px] font-medium tracking-wide leading-none',
                  active ? LOC_ACCENT[loc.id] : 'text-muted-foreground',
                )}
              >
                {loc.id}
              </span>
              <span className="font-mono text-[11px] text-faint-foreground tabular-nums leading-none">
                <span
                  className={cn(active ? LOC_ACCENT[loc.id] : 'text-foreground', 'font-medium')}
                >
                  {used}
                </span>
                <span className="opacity-40 mx-0.5">/</span>
                <span>{loc.capacity}</span>
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-2 bottom-1 h-[1.5px] overflow-hidden rounded-full bg-border-soft"
              >
                <span
                  className={cn('block h-full transition-[width]', LOC_BAR[loc.id])}
                  style={{ width: `${ratio * 100}%` }}
                />
              </span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setFilter('view', v as 'grid' | 'table')}
          aria-label="View"
        >
          <ToggleGroupItem value="grid" className="px-2" aria-label="Grid view" title="Grid view">
            <LayoutGrid />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="table"
            className="px-2"
            aria-label="Table view"
            title="Table view"
          >
            <List />
          </ToggleGroupItem>
        </ToggleGroup>

        <Popover open={composeOpen} onOpenChange={setComposeOpen}>
          <PopoverTrigger asChild>
            <Button>
              <Plus />
              House
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <ComposePopover onClose={() => setComposeOpen(false)} />
          </PopoverContent>
        </Popover>

        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            aria-label="Copy share link"
            title="Copy a link with your current planner — paste into another browser or device"
            disabled={houses.length === 0}
          >
            <Share2 />
          </Button>
          {shareCopied && (
            <output className="absolute top-full right-0 mt-2 z-30 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-[0_8px_24px_-8px_rgba(0,0,0,0.32)] flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <Check className="size-3.5 text-primary" />
              <span>Copied shareable URL to clipboard</span>
            </output>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setFilter('theme', theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" aria-label="About this project" title="About">
              <Info />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 text-sm leading-relaxed">
            <p className="m-0">
              Developed by tushar c. for personal use. Contribute on{' '}
              <a
                href="https://github.com/tuchandra/pokeplanner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Github
              </a>
              .
            </p>
            <p className="mt-3 mb-0">
              I am enormously thankful to Joe Merrick at{' '}
              <a
                href="https://www.serebii.net/pokemonpokopia/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Serebii.net
              </a>{' '}
              for collecting information and making it freely available for projects like this to
              use. Even for data that I didn't directly read from Serebii, like flavors or
              environment preferences, it's almost a certainty that my source used Serebii
              themselves. Pokémon would not be the same without years of hard work by Joe &amp;
              team.
            </p>

            <p className="mt-3 mb-0 text-faint-foreground text-xs">
              This project made heavy use of AI coding tools. This infobox was written by a human.
              The "thank you"s are genuine.
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
