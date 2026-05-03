import { createServer } from "./app.js";

const start = async () => {
  const app = await createServer();

  try {
    await app.listen({
      port: Number(process.env.PORT ?? 3000),
      host: "0.0.0.0",
    });

    app.log.info("Server started");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
