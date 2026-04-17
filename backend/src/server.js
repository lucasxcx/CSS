const app = require("./app");
const deliveryModel = require("./models/deliveryModel");

const PORT = process.env.PORT || 4000;

const bootstrap = async () => {
  await deliveryModel.createTable();

  app.listen(PORT, () => {
    console.log(`Servidor backend rodando em http://localhost:${PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("Falha ao iniciar servidor:", error);
  process.exit(1);
});
