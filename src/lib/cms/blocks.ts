// Every piece of editable text and every editable image on the public pages is defined here.
// The default text is SAMPLE copy so the site looks finished from day one. It never states facts the school has
// not confirmed (no founding year, fees, hours or results). An Admin replaces any of it from the content manager.
// The default home banner is the school's own classroom photo (see school-photos.ts). The vision, mission, core
// values, school anthem and the Proprietress's message come from the school's magazine.

import { CLASS_PHOTOS, PHOTOS, type SchoolPhoto } from "./school-photos";

export type PageKey = "home" | "about" | "academics" | "admissions" | "schoollife" | "contact" | "privacy";

export const PAGES: { key: PageKey; label: string; path: string }[] = [
  { key: "home", label: "Home", path: "/" },
  { key: "about", label: "About us", path: "/about" },
  { key: "academics", label: "Academics", path: "/academics" },
  { key: "admissions", label: "Admissions", path: "/admissions" },
  { key: "schoollife", label: "School life", path: "/school-life" },
  { key: "contact", label: "Contact", path: "/contact" },
  { key: "privacy", label: "Privacy notice", path: "/privacy" },
];

export type FieldType = "text" | "textarea" | "richtext" | "image";
export type ItemField = { key: string; label: string; type: FieldType };

export type ImageValue = { url: string; alt: string } | null;
export type ListValue = Record<string, string>[];
export type BlockValue = string | ImageValue | ListValue;

export type BlockDef = {
  key: string;
  page: PageKey;
  group: string;
  label: string;
  type: FieldType | "list";
  help?: string;
  itemFields?: ItemField[];
  maxItems?: number;
  default: BlockValue;
};

const text = (page: PageKey, group: string, key: string, label: string, def: string, help?: string): BlockDef => ({ key, page, group, label, type: "text", default: def, help });
const area = (page: PageKey, group: string, key: string, label: string, def: string, help?: string): BlockDef => ({ key, page, group, label, type: "textarea", default: def, help });
const rich = (page: PageKey, group: string, key: string, label: string, def: string, help?: string): BlockDef => ({ key, page, group, label, type: "richtext", default: def, help });
const image = (page: PageKey, group: string, key: string, label: string, help?: string, photo?: SchoolPhoto): BlockDef =>
  ({ key, page, group, label, type: "image", default: photo ? { url: photo.src, alt: photo.alt } : null, help });
const list = (page: PageKey, group: string, key: string, label: string, itemFields: ItemField[], def: ListValue, maxItems = 12, help?: string): BlockDef => ({ key, page, group, label, type: "list", itemFields, default: def, maxItems, help });

const T = (key: string, label: string): ItemField => ({ key, label, type: "text" });
const A = (key: string, label: string): ItemField => ({ key, label, type: "textarea" });
const I = (key: string, label: string): ItemField => ({ key, label, type: "image" });

// ── From the school magazine ──

const VISION = "At Giant Step Academy our vision is to expose every child to the right and safe learning environment that produces well rounded, confident children with right values, ready to take the world.";
const MISSION = [
  "We will achieve this by providing a holistic education that emphasizes academic excellence, character, mind and head development.",
  "We are committed to delivering a personalized learning experience, tailored to each child through a curriculum that promotes innovation and collaboration, totally equipping our students with the knowledge, skills and values needed to thrive.",
];
const CORE_VALUES: ListValue = [
  { title: "Excellence", text: "" },
  { title: "Collaboration", text: "" },
  { title: "Creativity and Expression", text: "" },
  { title: "Growth", text: "" },
];
const ANTHEM = [
  "Giant Step Academy",
  "The School of discipline",
  "Creating things like moulding characters,",
  "training Creating future leaders,",
  "Fountain of knowledge",
  "Inspiration! Inspiration!!",
].join("\n");
const PROPRIETRESS_MESSAGE = [
  "It is with great joy that I extend my heartfelt congratulations to those graduating from different levels of studies in this prestigious institution. I return all glory to God Almighty for granting you the grace and strength to pass through the process successfully.",
  "And a special congratulations to those who are graduating from Giant Step Academy to a higher level of institution. Your accomplishments are a testament to your determination and drive to succeed. Today, as you stand on the threshold of new beginnings, I am confident that you are well-equipped to take on any challenges that come your way.",
  "Your graduation is not just a personal achievement, but it is also a milestone for your families, Giant Step Academy Family, and friends. A special thanks to my Teaching and Non-Teaching Staff for molding these ones to become what they are.",
].join("\n\n");

export const BLOCKS: BlockDef[] = [
  // ── Home ──
  text("home", "Top banner", "home.hero.eyebrow", "Small line above the headline", "Nursery · Primary · Secondary"),
  text("home", "Top banner", "home.hero.title", "Headline", "Securing a bright future, one giant step at a time"),
  area("home", "Top banner", "home.hero.subtitle", "Introduction", "A school in Sabon Tasha, Kaduna, for children from Nursery to Secondary."),
  image("home", "Top banner", "home.hero.image", "Banner picture", "A wide, bright photo works best (at least 1600 pixels across).", PHOTOS.classroom),
  text("home", "Admission notice", "admissions.notice", "Admission notice", "Admission forms into all classes are on sale.", "Shown on the Home and Admissions pages. Leave empty to hide it."),
  text("home", "About the school", "home.about.title", "Heading", "A school where every child counts"),
  rich("home", "About the school", "home.about.body", "Text", `${VISION}\n\n${MISSION[0]}`),
  image("home", "About the school", "home.about.image", "Picture"),
  list("home", "What we stand for", "home.values", "Values", [T("title", "Title"), A("text", "Short description")], CORE_VALUES, 6),

  // ── About ──
  area("about", "Introduction", "about.intro", "Introduction", "Learn about our school, what we believe, and the people who lead it."),
  rich("about", "Our story", "about.story", "Our story", "Tell parents how the school began, what it stands for and where it is going.\n\nThis is sample text. An Admin can replace it in the content manager."),
  image("about", "Our story", "about.story.image", "Picture"),
  area("about", "Mission and vision", "about.mission", "Mission", MISSION.join("\n\n")),
  area("about", "Mission and vision", "about.vision", "Vision", VISION),
  list("about", "Values", "about.values", "Values", [T("title", "Title"), A("text", "Short description")], CORE_VALUES, 8),
  area("about", "School anthem", "about.anthem", "School anthem", ANTHEM, "One line of the anthem per line. Leave empty to hide it."),
  text("about", "Principal's message", "about.principal.name", "Name", "Bernice Nwaorah Nwabunike"),
  text("about", "Principal's message", "about.principal.title", "Title", "Proprietress"),
  rich("about", "Principal's message", "about.principal.message", "Message", PROPRIETRESS_MESSAGE),
  image("about", "Principal's message", "about.principal.photo", "Photo", undefined, PHOTOS.proprietress),

  // ── Academics ──
  area("academics", "Introduction", "academics.intro", "Introduction", "From the first day in Nursery to the final year of Secondary school, learning here is planned, steady and supported."),
  rich("academics", "Nursery", "academics.nursery.body", "Nursery", "Our Nursery section gives young children a gentle start: early reading, numbers, play and good habits.\n\nReplace this with the school's own description."),
  image("academics", "Nursery", "academics.nursery.image", "Nursery picture", undefined, CLASS_PHOTOS.nursery[1]),
  rich("academics", "Primary", "academics.primary.body", "Primary", "In Primary school, pupils build strong skills in English, mathematics, science and more.\n\nReplace this with the school's own description."),
  image("academics", "Primary", "academics.primary.image", "Primary picture", undefined, CLASS_PHOTOS.primary[1]),
  rich("academics", "Secondary", "academics.secondary.body", "Secondary", "Our Secondary section prepares students for their external examinations and for life after school.\n\nReplace this with the school's own description."),
  image("academics", "Secondary", "academics.secondary.image", "Secondary picture", undefined, CLASS_PHOTOS.secondary[3]),
  rich("academics", "Subjects", "academics.subjects", "Subjects and programmes", "", "List the subjects, clubs or special programmes. Leave empty to hide this part."),

  // ── Admissions ──
  area("admissions", "Introduction", "admissions.intro", "Introduction", "We would be glad to welcome your child. Here is how admission works."),
  list("admissions", "How to apply", "admissions.steps", "Steps", [T("title", "Step"), A("text", "What happens")], [
    { title: "Get the admission form", text: "Collect an admission form from the school office." },
    { title: "Fill in and return it", text: "Complete the form and return it with the documents asked for." },
    { title: "Meet the school", text: "The school will contact you about the next step for your child's class." },
    { title: "Receive your offer", text: "Successful applicants are told how to complete registration." },
  ], 8),
  list("admissions", "What to bring", "admissions.requirements", "Documents", [T("text", "Document")], [
    { text: "Completed admission form" },
    { text: "Child's birth certificate or age declaration" },
    { text: "Recent passport photographs" },
  ], 12),
  rich("admissions", "Fees", "admissions.fees", "Fees and payment", "", "Leave empty to hide. Fees are only shown if the school fills this in."),
  list("admissions", "Questions parents ask", "admissions.faq", "Frequently asked questions", [T("question", "Question"), A("answer", "Answer")], [], 12),

  // ── School life ──
  area("schoollife", "Introduction", "schoollife.intro", "Introduction", "School is more than lessons. Here is a look at the places and activities that shape a child's day."),
  list("schoollife", "Facilities", "schoollife.facilities", "Facilities", [T("title", "Name"), A("text", "Short description"), I("image", "Picture")], [
    { title: "Classrooms", text: "Students read, write and work together at their own desks.", image: PHOTOS.classroom.src },
    { title: "Basketball court", text: "The outdoor court where our teams train and play their matches.", image: PHOTOS.court.src },
    { title: "Playground", text: "Swings and space to play for our Nursery and Primary pupils.", image: CLASS_PHOTOS.nursery[0].src },
    { title: "Outdoor learning space", text: "A shaded space where students also study and take lessons in the open air.", image: PHOTOS.outdoorLesson.src },
  ], 12),
  list("schoollife", "Activities", "schoollife.activities", "Activities and clubs", [T("title", "Name"), A("text", "Short description"), I("image", "Picture")], [
    { title: "Basketball", text: "Boys' and girls' teams train on the school court and play in inter-school competitions.", image: PHOTOS.girlsBasketball.src },
    { title: "Football", text: "Our football team trains through the term and represents the school in matches.", image: PHOTOS.footballTeam.src },
    { title: "Sports for the little ones", text: "Nursery and Primary pupils enjoy games and sports that build teamwork and confidence.", image: PHOTOS.family.src },
    { title: "Health and first aid", text: "Pupils learn to care for themselves and others, and practise basic first aid in white coats and gloves.", image: PHOTOS.firstAid.src },
    { title: "Health talks", text: "Talks that teach our pupils how to keep themselves healthy.", image: PHOTOS.healthTalk.src },
    { title: "Graduation day", text: "Each year we celebrate the pupils and students moving on to their next stage.", image: "/images/school/graduation-class.jpg" },
  ], 12),

  // ── Contact ──
  area("contact", "Introduction", "contact.intro", "Introduction", "Visit, call or send us a message. We will get back to you."),
  text("contact", "Office", "contact.hours", "Office hours", "", "Leave empty to hide. Example: Monday to Friday, 8:00 am to 4:00 pm."),

  // ── Privacy ──
  rich("privacy", "Privacy notice", "privacy.body", "Privacy notice", [
    "## What this notice covers",
    "This notice explains what personal information the school's website and result portal collect, and why.",
    "## Information we collect",
    "- **Enquiries:** your name, phone number, email (optional) and message when you use the enquiry form.",
    "- **Results:** when you open a child's result with a PIN, we record the time, the result requested and a scrambled network code (never your IP address).",
    "- **Pupil records:** held by the school for teaching, assessment and administration.",
    "## How we use it",
    "We use enquiries to reply to you. We use result access records to keep results secure. We do not sell personal information.",
    "## Your choices",
    "You can ask the school office to correct or delete information about you or your child where the law allows.",
    "## Contact",
    "Questions about this notice can be sent to the school office using the details on the Contact page.",
    "*This is a draft. The school should review it, and have it checked against the Nigeria Data Protection Act, before relying on it.*",
  ].join("\n\n")),
];

export const BLOCK_BY_KEY = new Map(BLOCKS.map((b) => [b.key, b]));
export const blocksFor = (page: PageKey) => BLOCKS.filter((b) => b.page === page);

// ── Reading and checking values ──

const isStr = (v: unknown): v is string => typeof v === "string";

/** Returns a clean value of the right shape for the block, or null if what was stored does not fit. */
export function coerceValue(def: BlockDef, raw: unknown): BlockValue | null {
  if (def.type === "image") {
    if (raw === null) return null;
    const r = raw as { url?: unknown; alt?: unknown };
    return r && isStr(r.url) && /^https:\/\/[^\s]+$/i.test(r.url) && r.url.length <= 500 ? { url: r.url, alt: isStr(r.alt) ? r.alt.slice(0, 200) : "" } : null;
  }
  if (def.type === "list") {
    if (!Array.isArray(raw)) return null;
    const keys = def.itemFields!.map((f) => f.key);
    const items = raw
      .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
      .map((i) => Object.fromEntries(keys.map((k) => [k, isStr(i[k]) ? i[k].slice(0, 2000) : ""])))
      .filter((i) => Object.values(i).some((v) => v.trim() !== ""));
    return items.slice(0, def.maxItems ?? 12);
  }
  return isStr(raw) ? raw.slice(0, def.type === "richtext" ? 20000 : def.type === "textarea" ? 1500 : 200) : null;
}

/** Combines saved content with the defaults: anything the Admin has edited wins. */
export function resolveBlocks(page: PageKey, saved: Record<string, unknown>): Record<string, BlockValue> {
  const out: Record<string, BlockValue> = {};
  for (const def of blocksFor(page)) {
    const has = Object.prototype.hasOwnProperty.call(saved, def.key);
    const v = has ? coerceValue(def, (saved[def.key] as { value?: unknown } | undefined)?.value) : null;
    out[def.key] = has && v !== null ? v : def.type === "image" && has ? null : def.default;
  }
  return out;
}

/** Keys that hold content for more than one page's screen, e.g. the admission notice appears on Home and Admissions. */
export const pageOf = (key: string) => BLOCK_BY_KEY.get(key)?.page;
