import { Router } from "express";
import auth from "../middlewares/auth";
import { authController }        from "../modules/auth/auth.controller";
import { recordsController }     from "../modules/records/records.controller";
import { activityLogController } from "../modules/activityLog/activityLog.controller";
import { templatesController } from "../modules/templates/templates.controller";

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post  ("/auth/login",           authController.login);
router.post  ("/auth/register",        auth, authController.register);
router.get   ("/auth/admins",          auth, authController.getAdmins);
router.delete("/auth/admins/:id",      auth, authController.deleteAdmin);
router.put   ("/auth/change-password", auth, authController.changePassword);
router.put   ("/auth/change-email",    auth, authController.changeEmail);
router.put   ("/auth/change-username", auth, authController.changeUsername);

// ── Public tracking (no auth) ─────────────────────────────────────────────────
router.get("/track/:trackingCode", recordsController.trackRecord);

// ── Records ───────────────────────────────────────────────────────────────────
router.get   ("/records/stats",              auth, recordsController.getStats);
router.get   ("/records",                    auth, recordsController.getRecords);
router.post  ("/records",                    auth, recordsController.createRecord);
router.post  ("/records/bulk",               auth, recordsController.bulkCreate);
router.delete("/records/bulk-delete",        auth, recordsController.bulkDelete);
router.put   ("/records/bulk-receive",       auth, recordsController.bulkReceive);
router.put   ("/records/bulk-release",       auth, recordsController.bulkRelease);
router.get   ("/records/:id",                auth, recordsController.getSingleRecord);
router.put   ("/records/:id",                auth, recordsController.updateRecord);
router.put   ("/records/:id/receive",        auth, recordsController.receiveRecord);
router.put   ("/records/:id/release",        auth, recordsController.releaseRecord);
router.put   ("/records/:id/archive",        auth, recordsController.archiveRecord);
router.put   ("/records/:id/unarchive",      auth, recordsController.unarchiveRecord);
router.delete("/records/:id",                auth, recordsController.deleteRecord);

// ── Comments ──────────────────────────────────────────────────────────────────
router.get   ("/records/:id/comments",              auth, recordsController.getComments);
router.post  ("/records/:id/comments",              auth, recordsController.createComment);
router.delete("/records/:id/comments/:commentId",   auth, recordsController.deleteComment);

// ── Activity Logs ─────────────────────────────────────────────────────────────
router.get   ("/activity-logs", auth, activityLogController.getLogs);
router.delete("/activity-logs", auth, activityLogController.clearAll);

// ── Templates ─────────────────────────────────────────────────────────────────
router.get   ("/templates",     auth, templatesController.getTemplates);
router.post  ("/templates",     auth, templatesController.createTemplate);
router.put   ("/templates/:id", auth, templatesController.updateTemplate);
router.delete("/templates/:id", auth, templatesController.deleteTemplate);
router.delete("/templates/:id", auth, templatesController.deleteTemplate);

export default router;