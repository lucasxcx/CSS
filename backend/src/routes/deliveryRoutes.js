const express = require("express");
const deliveryController = require("../controllers/deliveryController");

const router = express.Router();

router.post("/deliveries/confirm", deliveryController.confirmDelivery);
router.get("/deliveries", deliveryController.listDeliveries);

module.exports = router;
