import { Router } from "express";

// The free-text contact exchange flow has been replaced by structured profile
// contact fields (contactPhone, instagram, snapchat, twitter, tiktok) that are
// automatically revealed to mutual connects via GET /api/groups/connections.
// This router is intentionally empty; the file is kept to avoid removing the
// import in routes/index.ts.

const router = Router();

export default router;
