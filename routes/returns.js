const { Rental } = require("../models/rental");
const { Movie } = require("../models/movie");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

router.post("/", [auth, validate(validateReturn)], async (req, res) => {
  const rental = await Rental.lookup(req.body.customerId, req.body.movieId);

  if (!rental) return res.status(404).send("Rental not found.");

  if (rental.dateReturned)
    return res.status(400).send("Return already processed.");

  rental.return();

  const session = await Rental.startSession();
  session.startTransaction();

  try {
    await rental.save({ session });

    await Movie.updateOne(
      { _id: req.body.movieId },
      { $inc: { numberInStock: 1 } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.send(rental);
  } catch (ex) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).send("Something failed.");
  }
});

function validateReturn(req) {
  const schema = Joi.object().keys({
    customerId: Joi.objectId().required(),
    movieId: Joi.objectId().required(),
  });

  return schema.validate(req);
}

module.exports = router;
