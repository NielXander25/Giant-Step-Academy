import type { ContentType } from "@/lib/validators/cms";

// How each kind of website content looks in the Admin screens.
export type FormField = { name: string; label: string; type: "text" | "textarea" | "richtext" | "image" | "select" | "datetime" | "number"; required?: boolean; help?: string; options?: { value: string; label: string }[] };

const STATUS: FormField = { name: "status", label: "Show on the website?", type: "select", options: [{ value: "PUBLISHED", label: "Yes, published" }, { value: "DRAFT", label: "No, keep as a draft" }] };

export const MODULES: Record<ContentType, { label: string; singular: string; intro: string; fields: FormField[] }> = {
  news: { label: "News", singular: "article", intro: "Articles shown on the News page and the home page.", fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "excerpt", label: "Short summary", type: "textarea", help: "Shown on the news cards." },
    { name: "content", label: "Article", type: "richtext", required: true },
    { name: "coverImageUrl", label: "Cover picture", type: "image" },
    { name: "category", label: "Category", type: "text", help: "For example School news, Parents, Learning." },
    { name: "authorName", label: "Written by", type: "text" },
    { name: "slug", label: "Web address ending (optional)", type: "text", help: "Made from the title if left empty." },
    STATUS] },
  events: { label: "Events", singular: "event", intro: "Dates shown on the Events page.", fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Details", type: "textarea" },
    { name: "location", label: "Where", type: "text" },
    { name: "startsAt", label: "Starts", type: "datetime", required: true },
    { name: "endsAt", label: "Ends (optional)", type: "datetime" },
    { name: "imageUrl", label: "Picture", type: "image" }, STATUS] },
  gallery: { label: "Gallery", singular: "picture", intro: "Pictures on the Gallery page. Upload many at once below.", fields: [
    { name: "imageUrl", label: "Picture", type: "image", required: true },
    { name: "caption", label: "Caption", type: "text" },
    { name: "category", label: "Group", type: "text", help: "For example Sports, Graduation. Pictures with the same group can be filtered." },
    { name: "sortOrder", label: "Order (smaller shows first)", type: "number" }, STATUS] },
  staff: { label: "Staff", singular: "staff profile", intro: "People shown on the Staff page.", fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "position", label: "Position", type: "text", required: true },
    { name: "department", label: "Section or department", type: "text" },
    { name: "photoUrl", label: "Photo", type: "image" },
    { name: "bio", label: "Short biography", type: "textarea" },
    { name: "sortOrder", label: "Order (smaller shows first)", type: "number" }, STATUS] },
  announcements: { label: "Announcements", singular: "announcement", intro: "A notice bar at the very top of every page.", fields: [
    { name: "title", label: "Label", type: "text", required: true, help: "For example Admission or Notice." },
    { name: "message", label: "Message", type: "textarea", required: true },
    { name: "startsAt", label: "Show from (optional)", type: "datetime" },
    { name: "endsAt", label: "Hide after (optional)", type: "datetime" }, STATUS] },
  testimonials: { label: "Testimonials", singular: "testimonial", intro: "Real words from parents. Only add quotes you have permission to use.", fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "relationship", label: "Relationship to the school", type: "text", help: "For example Parent of a Primary 4 pupil." },
    { name: "quote", label: "What they said", type: "textarea", required: true },
    { name: "photoUrl", label: "Photo (optional)", type: "image" }, STATUS] },
};
