/** True on the separate demo deployment (its own database copy), where the practice school can be loaded. */
export const isDemoSite = () => process.env.DEMO_MODE === "true";
