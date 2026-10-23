// SAMPLE content so the website looks complete while the school collects its real material.
// It is fictional, marked as "sample" in the content manager, and removable with one button.
// No testimonials are included: invented parent quotes would be misleading.

const day = (offset: number, hour = 9) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  d.setUTCHours(hour - 1, 0, 0, 0); // hour in Lagos time
  return d;
};

export const SAMPLE_NEWS = [
  { slug: "welcome-back-to-a-new-term", title: "Welcome back to a new term", category: "School news", authorName: "School Office", excerpt: "A warm welcome to all pupils and parents as the new term begins.", content: "## A fresh start\n\nWe are glad to welcome every pupil back. The first weeks of term are about settling into routines, meeting new teachers and setting goals.\n\n- Be on time every day\n- Come in the correct uniform\n- Bring your books and your best effort\n\nThis is **sample content**. Replace it with the school's own news from the content manager." },
  { slug: "reading-matters-at-every-level", title: "Why reading matters at every level", category: "Learning", authorName: "School Office", excerpt: "Strong readers become strong learners. Here is how parents can help at home.", content: "## Ten minutes a day\n\nThe simplest habit that helps a child most is reading a little every day, aloud or silently, with someone who listens.\n\nThis is *sample content*. Replace it with real articles from the content manager." },
  { slug: "keeping-our-pupils-safe", title: "Keeping our pupils safe", category: "Parents", authorName: "School Office", excerpt: "A reminder about drop-off, pick-up and keeping the school gate orderly.", content: "## Safe arrival and departure\n\nPlease follow the gate arrangements the school announces, and only collect your child yourself or through a person the school knows.\n\nThis is sample content." },
];

export const SAMPLE_EVENTS = [
  { title: "Open day for new families", description: "Come and see the school, meet the teachers and ask questions about admission.", location: "School premises", startsAt: day(14, 10), endsAt: day(14, 13) },
  { title: "Inter-house sports", description: "A friendly day of races and team games for all sections.", location: "School field", startsAt: day(35, 9), endsAt: day(35, 15) },
  { title: "Prize-giving ceremony", description: "Celebrating effort and achievement across the school.", location: "School hall", startsAt: day(70, 11), endsAt: null },
];

export const SAMPLE_STAFF = [
  { name: "Mrs. A. Sample", position: "Head of Nursery", department: "Nursery", bio: "Sample profile. Replace with the real staff member.", sortOrder: 1 },
  { name: "Mr. B. Sample", position: "Head of Primary", department: "Primary", bio: "Sample profile. Replace with the real staff member.", sortOrder: 2 },
  { name: "Mrs. C. Sample", position: "Head of Secondary", department: "Secondary", bio: "Sample profile. Replace with the real staff member.", sortOrder: 3 },
  { name: "Mr. D. Sample", position: "Mathematics Teacher", department: "Secondary", bio: "Sample profile. Replace with the real staff member.", sortOrder: 4 },
];

export const SAMPLE_ANNOUNCEMENT = { title: "Admission", message: "Admission forms into all classes are on sale. Visit the school office for details." };
