import { PaymentCreatedListener } from "./nats/events/listeners/payment/payment-created";
import { randomBytes } from "crypto";
import express from "express";
import "express-async-errors";
import cookieSession from "cookie-session";
import { connectDb } from "./database/db";
import {
  errorHandler,
  Page404,
  currentUserMiddleware,
} from "@jogeshgupta-microservices/common";

import methodOverride from "method-override";
import { natsWrapper } from "./nats/connection/natsWrapper";
import { OrderRouter } from "./routes/order";
import { TicketCreatedListener } from "./nats/events/listeners/ticket/ticket-created";
import { TicketUpdatedListener } from "./nats/events/listeners/ticket/ticket-updated";
import { ExpirationCompleteListener } from "./nats/events/listeners/expiration/expiration-complete";
const app = express();

app.set("trust proxy", true);
app.use(express.json());
app.use(express.Router());
app.use(methodOverride());
app.use(
  cookieSession({
    signed: false,
    secure: true,
  })
);
app.use(currentUserMiddleware);
app.use("/api/orders", OrderRouter);
app.all("*", () => {
  throw new Page404();
});

(async function () {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_KEY must be defined");
  }
  if (!process.env.MONGO_URI) {
    throw new Error("Mongo Uri must be defined");
  }
  if (!process.env.NATS_URL) {
    throw new Error("Nats URL must be defined");
  }
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error("nats cluster id must be defined");
  }
  if (!process.env.NATS_CLIENT_ID) {
    throw new Error("nats client id must be defined");
  }
  try {
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );

    natsWrapper.client.on("close", () => {
      console.log("Nats connection closed!!");
      process.exit();
    });
    process.on("SIGINT", () => natsWrapper.client.close());
    process.on("SIGTERM", () => natsWrapper.client.close());

    const ticketCreated = new TicketCreatedListener(
      natsWrapper.client
    ).listen();

    const ticketUpdated = new TicketUpdatedListener(
      natsWrapper.client
    ).listen();

    const expirationComplete = new ExpirationCompleteListener(
      natsWrapper.client
    ).listen();

    const paymentCreated = new PaymentCreatedListener(
      natsWrapper.client
    ).listen();
    await connectDb(process.env.MONGO_URI);
    console.log("DB connected");
  } catch (err) {
    console.log(err);
  }
  app.listen(3000, () => {
    console.log("Listening on port 3000...");
  });
})();

app.use(errorHandler);
