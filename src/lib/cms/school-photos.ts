// The school's leaders, shown by name on the About Us page. The site carries no photos of its own: pictures appear
// only where an Admin uploads them in the content manager.

export type Leader = { name: string; role: string };

export const LEADERS: Leader[] = [
  { name: "Bernice Nwaorah Nwabunike", role: "Proprietress" },
  { name: "Mr. Akpidi Mbagishor Uguge", role: "Principal" },
  { name: "Mrs. Ozioma Uzo", role: "Vice Principal" },
  { name: "Mr. Chinedu Ogbe", role: "P.T.A. Chairman" },
];
