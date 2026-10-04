const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
const dateOnly = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Africa/Lagos" });

export const formatDateTime = (d: Date | null | undefined) => (d ? dateTime.format(d) : "—");
export const formatDate = (d: Date | null | undefined) => (d ? dateOnly.format(d) : "—");
