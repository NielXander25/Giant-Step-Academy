// The school's own photos, shipped with the website (public/images/school) so the site has real pictures from
// day one. They are only defaults: anything an Admin sets in the content manager replaces them, and once the
// Gallery has pictures of its own these are no longer shown there.

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
};

/** What the Gallery shows until the school adds its own pictures. */
export const DEFAULT_GALLERY = Object.values(PHOTOS).map((ph, i) => ({ id: `school-photo-${i}`, imageUrl: ph.src, caption: ph.caption, category: ph.category }));

/** The Gallery's own pictures, or the school's photos while it has none. */
export function galleryOrDefaults<T extends { id: string; imageUrl: string; caption: string | null; category: string | null }>(items: T[]) {
  return items.length > 0 ? items : DEFAULT_GALLERY;
}
