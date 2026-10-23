"use server";

import { revalidateTag } from "next/cache";
import { defineAction } from "@/lib/action";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import {
  announcementInput, deleteContentInput, emptyCms, eventInput, galleryBulkInput, galleryInput, markEnquiryInput, newsInput,
  resetBlockInput, savePageInput, staffInput, testimonialInput,
} from "@/lib/validators/cms";
import type { PageKey } from "./blocks";
import * as cms from "./service";

// Every change clears the public site's cache so visitors see it straight away.
const fresh = <T>(result: T): T => {
  revalidateTag("site");
  return result;
};

const admin = { roles: ADMIN_ROLES } as const;

export const saveNewsAction = defineAction({ ...admin, input: newsInput, handler: async ({ user, input }) => fresh(await cms.saveNews(user, input)) });
export const saveEventAction = defineAction({ ...admin, input: eventInput, handler: async ({ user, input }) => fresh(await cms.saveEvent(user, input)) });
export const saveGalleryAction = defineAction({ ...admin, input: galleryInput, handler: async ({ user, input }) => fresh(await cms.saveGalleryItem(user, input)) });
export const addGalleryItemsAction = defineAction({ ...admin, input: galleryBulkInput, handler: async ({ user, input }) => fresh(await cms.addGalleryItems(user, input)) });
export const saveStaffAction = defineAction({ ...admin, input: staffInput, handler: async ({ user, input }) => fresh(await cms.saveStaff(user, input)) });
export const saveAnnouncementAction = defineAction({ ...admin, input: announcementInput, handler: async ({ user, input }) => fresh(await cms.saveAnnouncement(user, input)) });
export const saveTestimonialAction = defineAction({ ...admin, input: testimonialInput, handler: async ({ user, input }) => fresh(await cms.saveTestimonial(user, input)) });
export const deleteContentAction = defineAction({ ...admin, input: deleteContentInput, handler: async ({ user, input }) => fresh(await cms.deleteContent(user, input.type, input.id)) });

export const savePageAction = defineAction({ ...admin, input: savePageInput, handler: async ({ user, input }) => fresh(await cms.savePageBlocks(user, input.page as PageKey, input.values)) });
export const resetBlockAction = defineAction({ ...admin, input: resetBlockInput, handler: async ({ user, input }) => fresh(await cms.resetBlock(user, input.key)) });

export const loadSampleAction = defineAction({ ...admin, input: emptyCms, handler: async ({ user }) => fresh(await cms.loadSampleContent(user)) });
export const removeSampleAction = defineAction({ ...admin, input: emptyCms, handler: async ({ user }) => fresh(await cms.removeSampleContent(user)) });

export const markEnquiryAction = defineAction({ ...admin, input: markEnquiryInput, handler: async ({ user, input }) => cms.markEnquiry(user, input.enquiryId, input.handled) });
