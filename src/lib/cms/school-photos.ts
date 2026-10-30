// The school's own photos, shipped with the website (public/images/school).
// The classroom photo is the default home banner. Event photos (sports, matches, graduation) appear on the Events
// page only. Class photos appear on the Academics page under their section, and staff photos on the Staff page.
// The class, staff and proprietress photos were cut from the school magazine. An Admin can replace the banner,
// section pictures and proprietress photo from the content manager.

export type SchoolPhoto = { src: string; alt: string; caption: string; category: string };

const p = (file: string, alt: string, caption: string, category: string): SchoolPhoto => ({ src: `/images/school/${file}`, alt, caption, category });

export const PHOTOS = {
  classroom: p("classroom.jpg", "Secondary students in uniform reading and writing at their desks in class", "Hard at work in class", "Classroom"),
  nurseryClass: p("nursery-class.jpg", "Nursery pupils in their uniforms with their teachers", "Our Nursery class with their teachers", "Nursery"),
  family: p("giant-step-family.jpg", "Young pupils in yellow sports kits playing together", "The Giant Step Academy family at play", "Sports"),
  footballTeam: p("football-team.jpg", "The school football team in their kits", "Our football team", "Sports"),
  girlsBasketball: p("basketball-girls.jpg", "The girls' basketball team in yellow kits", "The girls' basketball team", "Sports"),
  matchDay: p("basketball-match-day.jpg", "Basketball players posing on the court after a match", "Basketball match day", "Sports"),
  boysCloseup: p("basketball-boys-closeup.jpg", "Basketball players crouching together on the court", "Ready for the game", "Sports"),
  teamYellow: p("basketball-team-yellow.jpg", "Basketball players lined up in yellow kits", "Lined up before tip-off", "Sports"),
  interSchool: p("basketball-inter-school.jpg", "Two basketball teams lined up at an inter-school competition", "Inter-school basketball", "Sports"),
  court: p("basketball-court.jpg", "Students and coaches on an outdoor basketball court", "On the court with our coaches", "Sports"),
  firstAid: p("first-aid-practice.jpg", "Pupils in white coats and gloves practising bandaging a hand", "Practising first aid", "Health"),
  healthTalk: p("health-talk.jpg", "Pupils in white coats listening to a health talk", "A health talk for our pupils", "Health"),
  outdoorLesson: p("outdoor-lesson.jpg", "Students writing at desks during a lesson under a shaded canopy", "Learning outdoors", "Classroom"),
  studentsGroup: p("students-group.jpg", "Secondary students in grey uniforms seated and standing in rows with a teacher", "Our students", "Classroom"),
  proprietress: p("proprietress.jpg", "Bernice Nwaorah Nwabunike, Proprietress of Giant Step Academy", "Our Proprietress", "Staff"),
};

const GRADUATION_PHOTOS: SchoolPhoto[] = [
  p("graduation-class.jpg", "Graduating students in caps and sashes standing with a teacher", "Our graduating class", "Graduation"),
  p("graduation-celebration.jpg", "Graduating students celebrating, one lifting his cap", "Celebrating the big day", "Graduation"),
  p("graduation-seated.jpg", "Graduating students seated in caps and sashes", "Graduates at the ceremony", "Graduation"),
  p("graduation-little-ones.jpg", "Young pupils in party clothes at the graduation ceremony", "The little ones join the celebration", "Graduation"),
];

/** Pictures from school events, shown on the Events page: graduation first, then sports and school days. */
export const EVENT_GROUPS: { title: string; photos: SchoolPhoto[] }[] = [
  { title: "Graduation day", photos: GRADUATION_PHOTOS },
  {
    title: "Sports, matches and school days",
    photos: [PHOTOS.nurseryClass, PHOTOS.family, PHOTOS.footballTeam, PHOTOS.girlsBasketball, PHOTOS.matchDay, PHOTOS.boysCloseup, PHOTOS.teamYellow, PHOTOS.interSchool, PHOTOS.court],
  },
];

const cls = (file: string, caption: string, category: string) => p(`class-${file}.jpg`, `${caption} class photo`, caption, category);

/** Class photos, shown on the Academics page under each section. */
export const CLASS_PHOTOS: Record<"nursery" | "primary" | "secondary", SchoolPhoto[]> = {
  nursery: [cls("pre-nursery", "Pre-Nursery", "Nursery"), cls("nursery-1", "Nursery One", "Nursery"), cls("nursery-2", "Nursery Two graduating pupils", "Nursery")],
  primary: [
    cls("basic-1", "Basic One pupils", "Primary"), cls("basic-2", "Basic Two pupils", "Primary"), cls("basic-3", "Basic Three pupils", "Primary"),
    cls("basic-4", "Basic Four pupils", "Primary"), cls("basic-5-graduating", "Basic Five graduating pupils", "Primary"),
  ],
  secondary: [
    cls("basic-7", "Basic Seven students", "Secondary"), cls("basic-8", "Basic Eight students", "Secondary"),
    cls("basic-9-graduating", "Basic Nine graduating students", "Secondary"), cls("ss-1", "SS One students", "Secondary"),
  ],
};

/** Portraits of the school's leaders, shown first on the Staff page. */
export const LEADER_PHOTOS: SchoolPhoto[] = [
  // No clear photo of the Principal yet: a silhouette stands in until the school sends one.
  p("silhouette.svg", "Photo of Mr. Akpidi Mbagishor Uguge, Principal, coming soon", "Mr. Akpidi Mbagishor Uguge, Principal", "Staff"),
  p("vice-principal.jpg", "Mrs Ozioma Uzo, Vice Principal", "Mrs. Ozioma Uzo, Vice Principal", "Staff"),
  p("pta-chairman.jpg", "Mr Chinedu Ogbe, P.T.A. Chairman", "Mr. Chinedu Ogbe, P.T.A. Chairman", "Staff"),
];

/** Group photos of the school's staff, shown on the Staff page. */
export const STAFF_PHOTOS: SchoolPhoto[] = [
  p("staff-secondary.jpg", "The Secondary section staff", "Secondary section staff", "Staff"),
  p("staff-primary.jpg", "The Primary section staff", "Primary section staff", "Staff"),
  p("staff-caregivers.jpg", "The school's care-givers", "Giant Step Academy care-givers", "Staff"),
  p("pta-exco.jpg", "The Parent-Teacher Association executive committee", "P.T.A. Exco", "Staff"),
  p("chief-security.jpg", "Udechukwu Ibegbulam, Chief Security, in his security uniform", "Udechukwu Ibegbulam, Chief Security", "Staff"),
];
