import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { NavigationDestination } from "@/hooks/useNavigationBar";
import { cn } from "@/lib/utils";

type BottomNavigationProps = {
  destinations: NavigationDestination[];
  activeValue: string;
};

// Ein einziger Inset-Wert für alle vier Seiten (nicht separat x/y!): nur
// wenn der horizontale und vertikale Abstand exakt gleich sind, verläuft die
// Pill-Rundung konzentrisch zur äusseren rounded-full-Kurve der Nav-Bar -
// sonst entsteht bei der ersten/letzten Spalte ein ungleichmässiger Spalt
// genau in der Ecke, selbst wenn oben/unten/rechts für sich passen.
const PILL_INSET_REM = 0.25;
const PILL_INSET = `${PILL_INSET_REM}rem`;
const REM_IN_PX = 16;
// Ein reiner Tap darf die Pille nicht per Pointer-Handler bewegen (das
// überspringt die CSS-Transition und lässt sie hart springen) - erst ab
// dieser Bewegungsdistanz gilt es als Drag-Geste statt als Tap.
const DRAG_THRESHOLD_PX = 6;
// Seitlicher und unterer Basis-Abstand der Nav-Bar zur Bildschirmkante, als
// eine gemeinsame Konstante (gleiches Prinzip wie PILL_INSET): rounded-full
// lässt den Eckenabstand optisch grösser wirken als er gemessen ist, darum
// bewusst kleiner als der frühere 1rem. ponytail: nur am Gerät mit echten
// abgerundeten Screen-Ecken gegenprüfbar, kein CSS-Zugriff auf deren Radius -
// hier feinjustieren, falls es in der Ecke noch ungleichmässig wirkt.
const NAV_EDGE_INSET = "0.75rem";

function BottomNavigation({ destinations, activeValue }: BottomNavigationProps) {
  const activeIndex = destinations.findIndex((d) => d.path === activeValue);
  const columnWidth = `(100% / ${destinations.length})`;
  const navRef = useRef<HTMLElement>(null);
  // null = nicht am Ziehen -> Pill folgt activeIndex per CSS-Transition.
  // Während des Ziehens: exakte Pixel-Position, 1:1 dem Finger/Cursor folgend,
  // ohne Transition (sonst hinkt sie spürbar hinterher).
  const [dragLeftPx, setDragLeftPx] = useState<number | null>(null);
  const pointerDownXRef = useRef<number | null>(null);
  // Nach dem Loslassen eines Drags: Index der Spalte, zu der die Pille noch
  // per Transition hin unterwegs ist, während navigate() erst asynchron die
  // Route (und damit activeIndex) nachzieht - siehe Effect unten. State statt
  // Ref, da es die Transition-Klasse beim Rendern mitbestimmt.
  const [releaseTargetIndex, setReleaseTargetIndex] = useState<number | null>(null);

  const columnLeftPx = (index: number) => {
    const nav = navRef.current;
    if (!nav) return 0;
    const rect = nav.getBoundingClientRect();
    const insetPx = PILL_INSET_REM * REM_IN_PX;
    return (rect.width / destinations.length) * index + insetPx;
  };

  const updateDragPosition = (clientX: number) => {
    const nav = navRef.current;
    if (!nav) return;
    const rect = nav.getBoundingClientRect();
    const insetPx = PILL_INSET_REM * REM_IN_PX;
    const pillWidth = rect.width / destinations.length - insetPx * 2;
    const relativeX = clientX - rect.left;
    const rawLeft = relativeX - pillWidth / 2;
    const clamped = Math.min(Math.max(rawLeft, insetPx), rect.width - insetPx - pillWidth);
    setDragLeftPx(clamped);
  };

  // Sobald die Route (activeIndex) beim per Drag angewählten Ziel angekommen
  // ist, auf die CSS-Transition per activeIndex umschalten - die Pille steht
  // dann bereits an genau dieser Position, kein Sprung. "Adjusting state
  // when a prop changes" während des Renderns statt per useEffect (kein
  // zusätzlicher Render-Zyklus nötig, siehe React-Doku dazu).
  const [prevActiveIndex, setPrevActiveIndex] = useState(activeIndex);
  if (activeIndex !== prevActiveIndex) {
    setPrevActiveIndex(activeIndex);
    if (releaseTargetIndex !== null && activeIndex === releaseTargetIndex) {
      setReleaseTargetIndex(null);
      setDragLeftPx(null);
    }
  }

  const columnIndexAt = (clientX: number): number => {
    const nav = navRef.current;
    if (!nav) return activeIndex;
    const rect = nav.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const colWidth = rect.width / destinations.length;
    return Math.min(Math.max(Math.floor(relativeX / colWidth), 0), destinations.length - 1);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerDownXRef.current = event.clientX;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerDownXRef.current === null) return;
    if (dragLeftPx === null && Math.abs(event.clientX - pointerDownXRef.current) < DRAG_THRESHOLD_PX) {
      return;
    }
    updateDragPosition(event.clientX);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    pointerDownXRef.current = null;
    // Reiner Tap (nie über den Drag-Threshold bewegt): dragLeftPx wurde nie
    // gesetzt, die Navigation läuft über den onClick des getroffenen Buttons -
    // die Pille gleitet dann einmal per CSS-Transition zur neuen Position.
    if (dragLeftPx === null) return;
    const index = columnIndexAt(event.clientX);
    const target = destinations[index];
    if (target && target.path !== activeValue) {
      // Direkt zur Ziel-Spalte gleiten statt zu activeIndex zurückzuspringen
      // - dragLeftPx bleibt bis Route/activeIndex nachziehen (Effect oben).
      setReleaseTargetIndex(index);
      setDragLeftPx(columnLeftPx(index));
      target.navigate();
    } else {
      setDragLeftPx(null);
    }
  };

  return (
    <nav
      ref={navRef}
      className="fixed z-20 flex touch-none items-stretch rounded-full border bg-sidebar/95 shadow-lg backdrop-blur supports-backdrop-filter:bg-sidebar/80"
      style={{
        left: NAV_EDGE_INSET,
        right: NAV_EDGE_INSET,
        // Nicht addieren: env(safe-area-inset-bottom) allein reicht schon aus,
        // um den Home-Indicator freizuhalten (iPhone: ~34px, deutlich mehr
        // als NAV_EDGE_INSET) - das zusätzliche Aufaddieren liess die Bar
        // unnötig hoch/den unteren Abstand ungleich grösser wirken als den
        // seitlichen. max() sorgt nur auf Geräten ohne Safe-Area (Android)
        // dafür, dass der Abstand nicht unter NAV_EDGE_INSET fällt.
        bottom: `max(${NAV_EDGE_INSET}, env(safe-area-inset-bottom))`,
      }}
      aria-label="Hauptnavigation"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Ein gemeinsames Pill-Element statt eines pro Tab: so gleitet es beim
          Tab-Wechsel per CSS-Transition zur neuen Position, statt einfach an
          der neuen Stelle zu erscheinen. Füllt die volle Nav-Höhe (inset-y
          statt eng um Icon+Label gewickelt). left/width statt transform, da
          transform: translateX(N * 100%) sich auf die (bereits verkleinerte)
          Pill-Breite selbst bezieht und bei einem festen inset sonst über
          mehrere Spalten hinweg driften würde. Während des Ziehens (dragLeftPx
          gesetzt) wird die Transition abgeschaltet, damit die Pill dem
          Finger/Cursor ohne Verzögerung 1:1 folgt statt hinterherzuhinken. */}
      <div
        aria-hidden
        className={cn(
          "absolute rounded-full bg-sidebar-accent",
          (dragLeftPx === null || releaseTargetIndex !== null) &&
            "transition-[left,opacity] duration-300 ease-out",
          activeIndex === -1 && dragLeftPx === null && "opacity-0"
        )}
        style={{
          top: PILL_INSET,
          bottom: PILL_INSET,
          left:
            dragLeftPx !== null
              ? `${dragLeftPx}px`
              : `calc(${columnWidth} * ${Math.max(activeIndex, 0)} + ${PILL_INSET})`,
          width: `calc(${columnWidth} - 2 * ${PILL_INSET})`,
        }}
      />
      {destinations.map(({ path, label, icon: Icon, navigate }) => {
        const isActive = activeValue === path;
        return (
          <button
            key={path}
            type="button"
            onClick={navigate}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-xs transition-colors",
              isActive
                ? "font-semibold text-sidebar-accent-foreground"
                : "font-medium text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNavigation;
