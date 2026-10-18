export const wedding = {
  groom: 'Abhinav',
  bride: 'Akriti',
  weddingDate: '2026-11-25T08:00:00+05:30',
  dates: '25 November 2026',
  city: 'Saharanpur, Uttar\u00A0Pradesh', // non-breaking space keeps "Uttar Pradesh" on one line
  venue: 'Jaykim Banquets (Unit of JKK Orchid)',
  address: 'Saharanpur, Uttar\u00A0Pradesh',
  mapsUrl: 'https://maps.app.goo.gl/5Prty6rrUXZ9UH8u9',
  photos: { hero: '/front_abhinav_didi.jpeg', groom: '/couple/groom_childhood.png', bride: '/couple/bride_childhood.jpg', saveDate: '/baat_pakki_couple.jpeg', venue: '/banquet_hall.jpeg', finale: '/abhinav_didi_south_indian.jpeg', share: '/baat_pakki_share.jpg' },
  /** Optional crop focus (CSS object-position) for a photo that its frame would otherwise cut badly. */
  photoFocus: { bride: '50% 8%', hero: '44% 30%' } as Partial<Record<'hero' | 'groom' | 'bride' | 'saveDate' | 'venue' | 'finale', string>>,
  /** Optional wide (16:9) versions of the backdrops, used from 601px up; empty falls back to the tall photo. */
  photosWide: { hero: '', saveDate: '' },
  /** The melody begins as the gate swings open; the sound button mutes it. */
  music: { startOnOpen: true, src: '/wedding-tune.mpeg' },
  contacts: [
    { name: 'Vijendra & Deepa Gupta', relationship: "Groom’s family", phone: '+91 82183 62523' },
    { name: 'Rajesh & Madhu Jain', relationship: "Bride’s family", phone: '+91 92510 07277' },
  ],
};

export type WeddingEvent = {
  title: string;
  time: string;
  start: string;
  end: string;
  /** Event copy; a "\n" starts a new line on the card. */
  description: string;
  /** Where this event happens; falls back to the wedding venue when left out. */
  venue?: string;
  /** Makes the venue line a link; the wedding venue map is used when left out. */
  mapsUrl?: string;
  photo: string;
  /** Optional crop focus (CSS object-position) for a card whose frame would otherwise cut the picture badly. */
  focus?: string;
};

export const events: WeddingEvent[] = [
  { title: 'Mandha Pujan - Lunch', time: '1:00 PM', start: '2026-11-24T13:00:00+05:30', end: '2026-11-24T14:00:00+05:30', description: 'Mandha pujan at 10 am (at residence)\nLunch at Navyug Park 1 pm', photo: '/abhinav_mandha.jpeg' },
  { title: 'The Haldi-Sangeet Mela', time: '11:00 AM – 3:00 PM', start: '2026-11-25T11:00:00+05:30', end: '2026-11-25T15:00:00+05:30', description: 'Rang, masti, haldi ki pehli khushboo aur phir geet aur naach…', venue: 'Hotel President', mapsUrl: 'https://maps.app.goo.gl/rzYhET64B6vwXTyAA', photo: '/Haldi_sangeet.jpeg' },
  { title: 'Baraat', time: '7:00 PM', start: '2026-11-25T19:00:00+05:30', end: '2026-11-25T21:00:00+05:30', description: 'Dhol bajenge, baraat niklegi aur khushiyan chhaayengi…', photo: '/events/baraat.png', focus: '50% 0%' },
  { title: 'Wedding', time: '8:00 AM', start: '2026-11-26T08:00:00+05:30', end: '2026-11-26T10:00:00+05:30', description: 'Saat phere, saat vaade aur zindagi bhar ka saath…', photo: '/phere_new.jpeg', focus: '50% 20%' },
  { title: 'Vidai', time: '11:00 AM', start: '2026-11-26T11:00:00+05:30', end: '2026-11-26T12:00:00+05:30', description: 'Aankhon mein aansu, dil mein duaayein aur ek nayi shuruaat…', photo: '/vidhai_new.jpeg' },
];

/** "Abhinav weds Akriti" — the groom always leads, everywhere the two are named together. */
export const couple = `${wedding.groom} weds ${wedding.bride}`;

/**
 * Link unfurlers ignore relative image URLs, so the share card needs the deployed origin.
 * Vercel injects its domains into the server runtime, so no domain is hardcoded here.
 */
const vercelEnv = (globalThis as { process?: { env?: { VERCEL_PROJECT_PRODUCTION_URL?: string; VERCEL_URL?: string } } })
  .process?.env;
const vercelHost = vercelEnv?.VERCEL_PROJECT_PRODUCTION_URL ?? vercelEnv?.VERCEL_URL ?? '';

/** The site's own origin, e.g. "https://akriti-weds-abhinav.vercel.app"; empty on localhost. */
export const siteUrl = vercelHost ? `https://${vercelHost}` : '';

/** Turns a public asset path into an absolute URL that link unfurlers will accept. */
export const absoluteUrl = (path: string) => `${siteUrl}${path}`;

/**
 * Bump this whenever photos.share is replaced. WhatsApp, Facebook and X cache og:image for
 * weeks, so a versioned query string is what actually forces the new preview to be fetched.
 */
export const shareVersion = 3;

/** Every date on the invitation is written in India time, whatever the guest's device is set to. */
const format = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Date(date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', ...options });

/** "25 November 2026" — the day guests are asked to save. */
export const saveDate = format(wedding.weddingDate, { day: 'numeric', month: 'long', year: 'numeric' });

/** "25 November" — the same day without the year, for running text. */
export const saveDateShort = format(wedding.weddingDate, { day: 'numeric', month: 'long' });

/** The celebration days, derived from the events so moving a date never leaves a stale heading behind. */
export const celebrationDays = Array.from(new Set(events.map((event) => event.start.slice(0, 10)))).map((day) => ({
  day,
  label: format(`${day}T00:00:00+05:30`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(',', ' ·'),
}));

export function calendarUrl(event: WeddingEvent) {
  const stamp = (date: string) => new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: `${event.title} — ${couple}`, dates: `${stamp(event.start)}/${stamp(event.end)}`, details: event.description, location: `${event.venue ?? wedding.venue}, ${wedding.address}`, ctz: 'Asia/Kolkata' })}`;
}
