import express from "express";
import "express-async-errors";
import { errorHandler } from "./middlewares/error-handler";
import { authRouter } from "./routes/auth";
import methodOverride from "method-override";
import type { ErrorRequestHandler } from "express";
import { Page404 } from "./utils/page404";
const app = express();

app.use(express.json());
app.use(express.Router());
app.use(methodOverride());
app.use("/api/users", authRouter);
app.all("*", () => {
  throw new Page404();
});
app.listen(3000, () => {
  console.log("Listening on port 3000...");
});

app.use(errorHandler);
app.use(((err, req, res, next) => {}) as ErrorRequestHandler); // ok
