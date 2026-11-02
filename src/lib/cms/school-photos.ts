// The school's own photos (public/images), and the leaders shown by name on About Us.
// Gallery and Events shows the albums in this order; Graduation stays last. The Proprietress's photo sits beside her
// message on About Us. An Admin can add more pictures in the content manager.

export type Leader = { name: string; role: string };

export const LEADERS: Leader[] = [
  { name: "Bernice Nwaorah Nwabunike", role: "Proprietress" },
  { name: "Mr. Akpidi Mbagishor Uguge", role: "Principal" },
  { name: "Mrs. Ozioma Uzo", role: "Vice Principal" },
  { name: "Mr. Chinedu Ogbe", role: "P.T.A. Chairman" },
];

export const PROPRIETRESS_PHOTO = { src: "/images/school/proprietress.jpg", alt: "Mrs. Bernice Nwaorah Nwabunike, Proprietress of Giant Step Academy, seated on a yellow armchair" };

export type GalleryPhoto = { src: string; alt: string; caption: string; width: number; height: number };
export type GalleryAlbum = { key: string; title: string; intro: string; color: string; photos: GalleryPhoto[] };

const g = (file: string, width: number, height: number, caption: string, alt: string): GalleryPhoto => ({ src: `/images/gallery/${file}`, width, height, caption, alt });

export const GALLERY_ALBUMS: GalleryAlbum[] = [
  {
    key: "learning", title: "Learning", intro: "From play-based Nursery lessons to hands-on science in the laboratory.", color: "#0071e3",
    photos: [
      g("science-lab.jpg", 1080, 809, "Practical science in our laboratory", "Secondary students in white lab coats carrying out experiments in the school laboratory"),
      g("nursery-classroom.jpg", 1020, 765, "Learning through play in Nursery", "Nursery pupils at small orange tables with toys and picture books, with their teacher"),
      g("outdoor-lesson.jpg", 1020, 765, "A lesson in the open air", "Students taking notes at desks under a canopy while a teacher speaks"),
      g("students-in-uniform.jpg", 1080, 809, "Our secondary students", "Five secondary students in grey sweaters and checked uniforms"),
    ],
  },
  {
    key: "career-summit", title: "Career Summit 2025", intro: "Students explored the professions they dream of, with talks and live demonstrations.", color: "#ff9500",
    photos: [
      g("career-summit.jpg", 1033, 1077, "Future engineers in hard hats and vests", "Students wearing hard hats and high-visibility vests at the 2025 Career Summit"),
      g("first-aid-demonstration.jpg", 1280, 720, "A first aid demonstration", "Pupils in white coats and gloves demonstrating first aid on a classmate"),
      g("career-talk.jpg", 1120, 504, "Listening to a guest speaker", "A speaker on a stage addressing pupils seated under a decorated canopy"),
    ],
  },
  {
    key: "sports", title: "Sports", intro: "Basketball, football and games that build teamwork and confidence.", color: "#34c759",
    photos: [
      g("football-team.jpg", 1280, 1252, "Our football team", "The school football team in striped kits, the goalkeeper holding the ball"),
      g("basketball-teams.jpg", 1280, 554, "Basketball match day", "Two basketball teams, in yellow and in navy and pink, lined up on the court"),
      g("little-ones-sports.jpg", 1080, 736, "The little ones at play", "Young pupils in yellow sports kits playing together"),
    ],
  },
  {
    key: "enterprise", title: "Projects and enterprise", intro: "Students learn by making: products, practical projects and care for our grounds.", color: "#af52de",
    photos: [
      g("enterprise-products.jpg", 765, 1020, "Products made by our students", "Bottles of antiseptic and a jar of snacks labelled Giant Step Academy"),
      g("practical-project.jpg", 780, 1040, "A practical project in the school garden", "Students filling a tank with water using a hose beside the school garden"),
    ],
  },
  {
    key: "staff", title: "Our staff", intro: "The teachers who make every school day count.", color: "#32ade6",
    photos: [g("staff.jpg", 864, 1080, "Giant Step Academy staff", "Three members of staff smiling in navy Giant Step Academy staff T-shirts")],
  },
  {
    key: "graduation", title: "Graduation day", intro: "Celebrating the students moving on to their next stage.", color: "#ffcc00",
    photos: [g("graduation.jpg", 780, 1040, "Our graduating class", "Graduating students in caps and sashes standing with a teacher")],
  },
];
