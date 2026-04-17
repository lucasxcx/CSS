const express = require("express");
const cors = require("cors");
const path = require("path");
const deliveryRoutes = require("./routes/deliveryRoutes");

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use(deliveryRoutes);
app.use("/api", deliveryRoutes);

app.use((error, _request, response, _next) => {
  const statusCode = error.statusCode ?? 500;

  response.status(statusCode).json({
    message: error.message ?? "Erro inesperado no servidor.",
  });
});

module.exports = app;
