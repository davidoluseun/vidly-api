const { Rental, valFn } = require("../models/rental");
const { Customer } = require("../models/customer");
const { Movie } = require("../models/movie");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const validateId = require("../middleware/validateObjectId");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const rentals = await Rental.find().sort("-dateOut");
  res.send(rentals);
});

router.post("/", [auth, validate(valFn)], async (req, res) => {
  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).send("Invalid customer.");

  const movie = await Movie.findById(req.body.movieId);
  if (!movie) return res.status(400).send("Invalid movie.");

  if (movie.numberInStock === 0)
    return res.status(400).send("Movie not in stock.");

  let rental = await Rental.lookup(req.body.customerId, req.body.movieId);

  if (rental && !rental.dateReturned)
    return res.status(400).send("Rental already processed.");

  if (rental && rental.dateReturned) await Rental.findByIdAndDelete(rental._id);

  rental = new Rental({
    customer: { _id: customer._id, name: customer.name, phone: customer.phone },
    movie: {
      _id: movie._id,
      title: movie.title,
      dailyRentalRate: movie.dailyRentalRate,
    },
  });

  const session = await Rental.startSession();
  session.startTransaction();

  try {
    await rental.save({ session });

    movie.numberInStock--;
    await movie.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.send(rental);
  } catch (ex) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).send("Something failed.");
  }
});

router.get("/:id", validateId, async (req, res) => {
  const rental = await Rental.findById(req.params.id);

  if (!rental)
    return res.status(404).send("The rental with the given ID was not found.");

  res.send(rental);
});

module.exports = router;
