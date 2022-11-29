import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { CustomError } from "../utils/customErr";
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ errors: err.serializeError() });
  }

  res.status(400).json({
    errors: [
      {
        message: "Something went wrong",
      },
    ],
  });
};

export { errorHandler };
