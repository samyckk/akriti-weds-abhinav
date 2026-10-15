import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { ArrowDown, CalendarDays, Camera, Leaf, MapPin, Phone } from "lucide-react";
import { calendarUrl, celebrationDays, couple, events, saveDate, saveDateShort, wedding } from "@/lib/wedding-config";
import { cn } from "@/lib/utils";
import type { MusicState } from "@/hooks/use-music";
import { usePetals } from "@/hooks/use-petals";
import { Petals } from "@/components/petals";
import { Garland, SealWreath } from "@/components/ornaments";
import florals from "@/assets/wedding-florals.png";
import ganeshSeal from "@/assets/ganesh-seal.webp"; // ganesh.png trimmed to the figure and compressed for the gate

/* ---------- Opening sequence timings (ms). The door's 2.1s swing itself lives in styles.css ---------- */
const DOOR_SECS = 2.1;
const OPEN_DELAY = 200; // tap → petals burst, then the door starts to swing
const DOOR_DONE = OPEN_DELAY + 2300; // door fully open → the gate fades away
const GATE_FADE = 900; // matches the #loader.gone transition
const HOP_EVERY = 2400;
const HOPS = 4;

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduce;
}

/* =====================================================================
   ORNAMENTS
   ===================================================================== */
function Florals({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  return (
    <div className={`flora ${position}`} aria-hidden="true">
      <img src={florals} alt="" loading="lazy" decoding="async" />
    </div>
  );
}
function Decorations({ garden = false }: { garden?: boolean }) {
  return (
    <>
      <div className="rail l" aria-hidden="true" />
      <div className="rail r" aria-hidden="true" />
      <Florals position="tl" />
      <Florals position="br" />
      {garden && <Florals position="tr" />}
    </>
  );
}
function Divider() {
  return (
    <div className="rule" aria-hidden="true">
      <Leaf strokeWidth={1} />
    </div>
  );
}

/* =====================================================================
   OPENING GATE
   seal and wreath draw in → Ganesh ji and the shlok appear → light sweeps the door →
   on a tap anywhere: petals burst, the door swings open, the gate fades onto the invitation.
   ===================================================================== */
export function OpeningLoader({
  onOpen,
  onOpened,
  onGone,
}: {
  /** Fired inside the tap itself, with the music's start delay and rise time in seconds. */
  onOpen: (delaySec: number, riseSec: number) => void;
  /** The door is fully open and the gate is fading. */
  onOpened: () => void;
  /** The gate has faded out and can be removed. */
  onGone: () => void;
}) {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [sweep, setSweep] = useState(false);
  const [phase, setPhase] = useState<"closed" | "opening" | "open" | "gone">("closed");
  const tapped = useRef(false);
  const timers = useRef<number[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const burst = usePetals(canvas, "burst");

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  // "tap to open" shows only once the page is interactive and the web fonts are in
  useEffect(() => {
    let done = false;
    const mark = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const cap = window.setTimeout(mark, 3000);
    (document.fonts?.ready ?? Promise.resolve()).then(mark, mark);
    return () => {
      done = true;
      window.clearTimeout(cap);
    };
  }, []);

  useEffect(() => {
    if (reduce) return;
    const t = window.setTimeout(() => setSweep(true), 2200);
    return () => window.clearTimeout(t);
  }, [reduce]);

  const open = () => {
    if (tapped.current) return;
    tapped.current = true;
    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    const swingAt = reduce ? 0 : OPEN_DELAY;
    const doneAt = reduce ? 50 : DOOR_DONE;
    setPhase("opening");
    window.scrollTo(0, 0); // the story starts at the top, whatever was scrolled behind the gate
    onOpen(swingAt / 1000, reduce ? 0.3 : DOOR_SECS);
    burst.current();
    later(() => setPhase("open"), swingAt);
    later(() => {
      setPhase("gone");
      onOpened();
    }, doneAt);
    later(onGone, doneAt + GATE_FADE);
  };

  return (
    <div
      id="loader"
      className={cn(
        ready && "ready",
        sweep && "sweep",
        phase !== "closed" && "opening",
        (phase === "open" || phase === "gone") && "open",
        phase === "gone" && "gone",
      )}
      role="button"
      tabIndex={0}
      aria-label="Tap anywhere to open the invitation"
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <div className="door" aria-hidden="true">
        <i className="sheen" />
        <div className="seal-wrap">
          <div>
            <p className="hindi" lang="hi">
              ॥ श्री गणेशाय नमः ॥
            </p>
            <div className="seal">
              <SealWreath />
              <img
                src={ganeshSeal}
                className="deity"
                alt="Lord Ganesha"
                width={451}
                height={640}
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <p className="shlok" lang="hi">
              वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।
              <br />
              निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥
            </p>
          </div>
        </div>
      </div>
      <canvas ref={canvas} aria-hidden="true" />
      <p className="tap" aria-hidden="true">
        Tap anywhere to open
      </p>
    </div>
  );
}

/* =====================================================================
   PHOTOS
   ===================================================================== */
function Photo({
  src,
  label,
  className = "",
  wide = "",
  focus = "",
}: {
  src: string;
  label: string;
  className?: string;
  wide?: string;
  focus?: string | undefined;
}) {
  return (
    <div
      className={`photo ${className}`}
      style={focus ? ({ "--focus": focus } as CSSProperties) : undefined}
    >
      {src ? (
        <picture>
          {wide && <source media="(min-width: 601px)" srcSet={wide} />}
          <img src={src} alt={label} loading="lazy" />
        </picture>
      ) : (
        <div className="photo-label">
          <Camera size={24} strokeWidth={1} />
          <span>{label}</span>
          <small>Your photo here</small>
        </div>
      )}
    </div>
  );
}

function Backdrop({ src, label, wide = "" }: { src: string; label: string; wide?: string }) {
  return (
    <div className="backdrop" style={{ "--src": `url("${src}")` } as CSSProperties}>
      <Photo src={src} label={label} wide={wide} />
      <div className="veil" />
    </div>
  );
}

/* =====================================================================
   SCROLL CUE — bouncing arrow shown once the gate is open, hidden once the guest has scrolled
   ===================================================================== */
function DownCue({ show, reduce }: { show: boolean; reduce: boolean }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const update = () => setHidden(window.scrollY > window.innerHeight * 0.5);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <button
      type="button"
      className={cn("down", show && "show", hidden && "hide")}
      aria-label="Scroll down"
      tabIndex={show && !hidden ? 0 : -1}
      onClick={() =>
        document.getElementById("couple")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" })
      }
    >
      <ArrowDown width={20} height={20} />
    </button>
  );
}

/* =====================================================================
   SECTIONS
   ===================================================================== */
export function Hero() {
  return (
    <section className="scene photo-scene" id="story">
      <Backdrop src={wedding.photos.hero} wide={wedding.photosWide.hero} label="Couple portrait" />
      <Petals mode="soft" />
      <div className="inner">
        <p className="line invite rv">
          You are cordially invited to celebrate the wedding of {wedding.groom} &amp; {wedding.bride}
        </p>
        <p className="eyebrow rv d1">Scroll to meet them</p>
      </div>
    </section>
  );
}

export function CoupleSection() {
  return (
    <section className="scene paper" id="couple">
      <Decorations />
      <div className="inner">
        <p className="eyebrow rv">Meet the couple</p>
        <div className="duo rv d1">
          <figure className="who">
            <div className="arch">
              <Photo
                src={wedding.photos.groom}
                label="Groom's childhood photo"
                focus={wedding.photoFocus.groom}
              />
            </div>
            <figcaption>
              <span className="role">The groom</span>
              <span className="couple-name">{wedding.groom}</span>
            </figcaption>
          </figure>
          <div className="knot" aria-hidden="true">
            &amp;
          </div>
          <figure className="who">
            <div className="arch">
              <Photo
                src={wedding.photos.bride}
                label="Bride's childhood photo"
                focus={wedding.photoFocus.bride}
              />
            </div>
            <figcaption>
              <span className="role">The bride</span>
              <span className="couple-name">{wedding.bride}</span>
            </figcaption>
          </figure>
        </div>
        <div className="rule rv d2" aria-hidden="true">
          <Leaf strokeWidth={1} />
        </div>
        <p className="line rv d3">
          Ek ladka jiske bina ghar ki raunak adhoori,
          <br />
          ek ladki jiski muskaan se ghar khil jaata hai.
        </p>
      </div>
    </section>
  );
}

export function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const tick = () =>
      setRemaining(Math.max(0, new Date(wedding.weddingDate).getTime() - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = remaining === null ? null : Math.floor(remaining / 1000);
  const values =
    seconds === null
      ? ["—", "—", "—", "—"]
      : [
          Math.floor(seconds / 86400),
          Math.floor(seconds / 3600) % 24,
          Math.floor(seconds / 60) % 60,
          seconds % 60,
        ];
  return (
    <div className="countdown rv d2" aria-label="Time until the wedding">
      {values.map((value, i) => (
        <div key={i}>
          <b>{String(value).padStart(2, "0")}</b>
          <span>{["Days", "Hrs", "Min", "Sec"][i]}</span>
        </div>
      ))}
    </div>
  );
}

export function SaveTheDate() {
  return (
    <section className="scene photo-scene" id="date">
      <Backdrop src={wedding.photos.saveDate} wide={wedding.photosWide.saveDate} label="Save-the-date couple photo" />
      <Petals mode="soft" />
      <div className="inner">
        <p className="big rv">
          <small>Save the date</small>
          <span className="gild">{saveDate}</span>
        </p>
        <div className="couple rv d1">{couple}</div>
        <Countdown />
        <p className="line rv d3">Aapke bina yeh sham adhoori hai!</p>
      </div>
    </section>
  );
}

export function EventCard({ event }: { event: (typeof events)[number] }) {
  return (
    <article className="ev rv">
      <div className="event-cover">
        <Photo src={event.photo} label={`${event.title} photo`} focus={event.focus} />
        <div className="meta">
          <h3>{event.title}</h3>
          <span className="time">{event.time}</span>
        </div>
      </div>
      <div className="body">
        <div className="words">
          {event.venue &&
            (event.mapsUrl ? (
              <a className="venue" href={event.mapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin width={14} height={14} />
                {event.venue}
              </a>
            ) : (
              <p className="venue">
                <MapPin width={14} height={14} />
                {event.venue}
              </p>
            ))}
          <p>{event.description}</p>
        </div>
        <a className="cal" href={calendarUrl(event)} target="_blank" rel="noopener noreferrer">
          <CalendarDays width={13} height={13} />
          Add to calendar
        </a>
      </div>
    </article>
  );
}

export function EventTimeline() {
  return (
    <section className="scene paper" id="events">
      <Decorations />
      <div className="inner" style={{ maxWidth: 640 }}>
        <div className="head">
          <p className="eyebrow rv">Two days of full-on masti</p>
          <h2 className="rv d1">
            The Wedding <em>Celebrations</em>
          </h2>
        </div>
        <div className="timeline">
          {celebrationDays.map(({ day, label }) => (
            <div className="day-group" key={day}>
              <div className="day rv">{label}</div>
              {events
                .filter((event) => event.start.startsWith(day))
                .map((event) => (
                  <EventCard event={event} key={event.title} />
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VenueSection() {
  return (
    <section className="scene garden" id="venue">
      <Decorations garden />
      <div className="inner">
        <p className="eyebrow rv">The wedding venue</p>
        <div className="venue-card rv d1">
          <Photo src={wedding.photos.venue} label="Wedding venue photo" />
          <div className="text">
            <h3>{wedding.venue}</h3>
            <address>{wedding.address}</address>
            <a className="btn" href={wedding.mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin width={16} height={16} />
              View location
            </a>
          </div>
        </div>
        <Divider />
      </div>
    </section>
  );
}

export function Finale() {
  return (
    <section className="scene photo-scene" id="finale">
      <Backdrop src={wedding.photos.finale} label="Final couple photo" />
      <Petals mode="finale" />
      <div className="inner" style={{ zIndex: 3 }}>
        <p className="line rv" style={{ fontSize: "clamp(1.1rem,4vw,1.35rem)" }}>
          Naach, gaana, khaana aur dher saara pyaar, sab ready hai.
        </p>
        <h2 className="finale-heading rv d1">Bas aap aa jaaiye!</h2>
        <div className="rule rv d1" aria-hidden="true">
          <Leaf strokeWidth={1} />
        </div>
        <p className="line rv d2" style={{ color: "var(--rose-deep)" }}>
          Aa jaaiye {saveDateShort} tak,
          <br />
          Saharanpur mein milte hain.
        </p>
      </div>
    </section>
  );
}

export function ContactFooter() {
  return (
    <footer className="scene blush" id="contact">
      <Garland />
      <Florals position="bl" />
      <Florals position="br" />
      <div className="inner">
        <p className="eyebrow rv">For any queries</p>
        <div className="people rv d1">
          {wedding.contacts.map((contact) => (
            <div className="person" key={contact.name}>
              <div>
                <b>{contact.name}</b>
                <small>{contact.relationship}</small>
              </div>
              {contact.phone ? (
                <a href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>
                  <Phone width={15} height={15} />
                  {contact.phone}
                </a>
              ) : (
                <span className="contact-unset">
                  <Phone size={15} />
                  Phone number to be added
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="rule rv d2" aria-hidden="true">
          <Leaf strokeWidth={1} />
        </div>
        <p className="foot rv d2">
          <span>
            {couple}
          </span>
          <span className="dot"> &nbsp;·&nbsp; </span>
          <span>{wedding.dates}</span>
          <span className="dot"> &nbsp;·&nbsp; </span>
          <span>{wedding.city}</span>
        </p>
        <p className="end rv d3" lang="hi">
          ॥ शुभ विवाह ॥
        </p>
      </div>
    </footer>
  );
}

/* =====================================================================
   SOUND BUTTON — four bars dance while the music plays; tapping mutes
   ===================================================================== */
export function MusicToggle({ state, onToggle }: { state: MusicState; onToggle: () => void }) {
  const playing = state === "playing";
  const label = playing ? "Mute music" : state === "muted" ? "Unmute music" : "Play music";
  return (
    <button
      type="button"
      className={cn("sound show", !playing && "off")}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <i />
      <i />
      <i />
      <i />
    </button>
  );
}

/* =====================================================================
   PAGE BEHAVIOUR
   ===================================================================== */
/** Sections fade in as they scroll into view (fade only: nothing moves after it has rendered). */
function useReveal(reduce: boolean) {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(".rv");
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reduce]);
}

/** Photo backdrops drift a little slower than the page (desktop only; phones skip it). */
function useParallax(reduce: boolean) {
  useEffect(() => {
    if (reduce || window.matchMedia("(max-width: 600px)").matches) return;
    const backdrops = Array.from(document.querySelectorAll<HTMLElement>(".backdrop"));
    let ticking = false;
    const parallax = () => {
      ticking = false;
      const vh = window.innerHeight;
      backdrops.forEach((b) => {
        const r = (b.parentElement ?? b).getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        b.style.setProperty("--py", `${(p * -0.07 * r.height).toFixed(1)}px`);
      });
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(parallax);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    parallax();
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduce]);
}

/**
 * Scroll hint: once the gate is gone the page hops up and settles a few times, until the guest scrolls.
 * Only <main> hops, so the fixed sound button and scroll cue outside it stay where they are.
 */
function useHop(page: RefObject<HTMLElement | null>, active: boolean, reduce: boolean) {
  useEffect(() => {
    const el = page.current;
    if (!el || !active || reduce) return;
    const inputs = ["wheel", "touchstart", "keydown", "scroll"];
    let hops = 0;
    let interval = 0;
    function stop() {
      window.clearInterval(interval);
      inputs.forEach((ev) => window.removeEventListener(ev, onInput));
    }
    function onInput(e: Event) {
      if (e.type === "scroll" && window.scrollY <= 40) return;
      stop();
    }
    const hop = () => {
      if (++hops > HOPS) {
        stop();
        return;
      }
      el.classList.remove("hop");
      void el.offsetWidth; // restart the animation
      el.classList.add("hop");
    };
    interval = window.setInterval(hop, HOP_EVERY);
    inputs.forEach((ev) => window.addEventListener(ev, onInput, { passive: true }));
    return () => {
      stop();
      el.classList.remove("hop");
    };
  }, [page, active, reduce]);
}

/**
 * The invitation itself. It renders behind the gate from the start, so it is ready the moment the gate fades;
 * until then it is inert, so nothing behind the gate can be focused.
 */
export function Invitation({ opened = true }: { opened?: boolean }) {
  const reduce = useReducedMotion();
  const page = useRef<HTMLElement>(null);
  useReveal(reduce);
  useParallax(reduce);
  useHop(page, opened, reduce);

  return (
    <>
      <main ref={page} inert={!opened}>
        <Hero />
        <CoupleSection />
        <SaveTheDate />
        <EventTimeline />
        <VenueSection />
        <Finale />
        <ContactFooter />
      </main>
      <DownCue show={opened} reduce={reduce} />
    </>
  );
}
