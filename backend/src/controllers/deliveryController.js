const deliveryService = require("../services/deliveryService");

const confirmDelivery = async (request, response, next) => {
  try {
    const delivery = await deliveryService.confirmDelivery(request.body);

    response.status(201).json({
      message: "Entrega confirmada com sucesso.",
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

const listDeliveries = async (_request, response, next) => {
  try {
    const deliveries = await deliveryService.listDeliveries();

    response.json({
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  confirmDelivery,
  listDeliveries,
};
