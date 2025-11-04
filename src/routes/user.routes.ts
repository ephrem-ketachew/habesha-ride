
import { Router } from 'express';
import { protect } from "../middleware/auth.middleware.js";
import { userProfile,
         updateProfileHandler
 } from "../controllers/user.controller.js";
 import { updateMeSchema } from '../validation/user.schema.js';
 import { validate } from '../middleware/validate.middleware.js';


const router = Router();

router.get('/userProfile', protect, userProfile);
router.patch('/updateProfile', protect, validate(updateMeSchema), updateProfileHandler);

export default router;
