import User from "../models/user.model.js";
import AppError from "../utils/appError.util.js";
import { UpdateProfileInput } from "../validation/user.schema.js";

export const updatePrfile = async (userId: string, payload: UpdateProfileInput) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!user) throw new AppError("User not found", 404);
  return user;
};
