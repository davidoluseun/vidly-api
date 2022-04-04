const request = require("supertest");
const mongoose = require("mongoose");
const { Rental } = require("../../../models/rental");
const { Customer } = require("../../../models/customer");
const { Movie } = require("../../../models/movie");
const { Genre } = require("../../../models/genre");

jest.setTimeout(20000);

describe("/api/rentals", () => {
  let server;

  beforeEach(() => {
    server = require("../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Rental.deleteMany({});
    await Customer.deleteMany({});
    await Genre.deleteMany({});
    await Movie.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all rentals", async () => {
      const genre1 = new Genre({ name: "genre1" });
      const genre2 = new Genre({ name: "genre2" });
      const movie1 = new Movie({
        title: "movie1",
        genre: { _id: genre1._id, name: genre1.name },
        numberInStock: 9,
        dailyRentalRate: 2,
      });
      const movie2 = new Movie({
        title: "movie2",
        genre: { _id: genre2._id, name: genre2.name },
        numberInStock: 0,
        dailyRentalRate: 5,
      });

      const customer1 = new Customer({ name: "customer1", phone: "12345" });
      const customer2 = new Customer({ name: "customer2", phone: "678910" });
      const rental1 = new Rental({
        customer: {
          _id: customer1._id,
          name: customer1.name,
          phone: customer1.phone,
        },
        movie: {
          _id: movie1._id,
          title: movie1.title,
          dailyRentalRate: movie1.dailyRentalRate,
        },
      });

      const rental2 = new Rental({
        customer: {
          _id: customer2._id,
          name: customer2.name,
          phone: customer2.phone,
        },
        movie: {
          _id: movie2._id,
          title: movie2.title,
          dailyRentalRate: movie2.dailyRentalRate,
        },
      });

      const genres = [genre1, genre2];
      const movies = [movie1, movie2];
      const customers = [customer1, customer2];
      const rentals = [rental1, rental2];

      await Genre.collection.insertMany(genres);
      await Movie.collection.insertMany(movies);
      await Customer.collection.insertMany(customers);
      await Rental.collection.insertMany(rentals);

      const res = await request(server).get("/api/rentals");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((r) => r.movie.title === "movie1")).toBeTruthy();
      expect(res.body.some((r) => r.movie.title === "movie2")).toBeTruthy();
      expect(
        res.body.some((r) => r.customer.name === "customer1")
      ).toBeTruthy();
      expect(
        res.body.some((r) => r.customer.name === "customer1")
      ).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return 404 if id is invalid", async () => {
      const res = await request(server).get("/api/rentals/1");

      expect(res.status).toBe(404);
    });

    it("should return 404 if no rental with the given id exist", async () => {
      const id = mongoose.Types.ObjectId();
      
      const res = await request(server).get("/api/rentals/" + id);

      expect(res.status).toBe(404);
    });

    it("should return a rental if id is valid", async () => {
      const genre = new Genre({ name: "genre" });
      const movie = new Movie({
        title: "movie",
        genre: { _id: genre._id, name: genre.name },
        numberInStock: 9,
        dailyRentalRate: 2,
      });

      const customer = new Customer({ name: "customer", phone: "12345" });

      const rental = new Rental({
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
        },
        movie: {
          _id: movie._id,
          title: movie.title,
          dailyRentalRate: movie.dailyRentalRate,
        },
      });

      await genre.save();
      await movie.save();
      await customer.save();
      await rental.save();

      const res = await request(server).get("/api/rentals/" + rental._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("movie.title", movie.title);
      expect(res.body).toHaveProperty("customer.name", customer.name);
    });
  });
});
