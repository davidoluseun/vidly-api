const request = require("supertest");
const { Movie } = require("../../../models/movie");
const { Genre } = require("../../../models/genre");
const { User } = require("../../../models/user");
const mongoose = require("mongoose");

jest.setTimeout(10000);

describe("/api/movies", () => {
  let server;

  beforeEach(() => {
    server = require("../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Movie.deleteMany({});
    await Genre.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all movies", async () => {
      const genre1 = new Genre({ name: "genre1" });
      const genre2 = new Genre({ name: "genre2" });
      const genres = [genre1, genre2];

      const movie1 = {
        title: "movie1",
        genre: genre1,
        numberInStock: 7,
        dailyRentalRate: 2,
      };
      const movie2 = {
        title: "movie2",
        genre: genre1,
        numberInStock: 18,
        dailyRentalRate: 5,
      };
      const movies = [movie1, movie2];

      await Genre.collection.insertMany(genres);
      await Movie.collection.insertMany(movies);

      const res = await request(server).get("/api/movies");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((m) => m.title === "movie1")).toBeTruthy();
      expect(res.body.some((m) => m.title === "movie2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return 404 if id is invalid", async () => {
      const res = await request(server).get("/api/movies/1");

      expect(res.status).toBe(404);
    });

    it("should return 404 if no movie with the given id exist", async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get("/api/movies/" + id);

      expect(res.status).toBe(404);
    });

    it("should return a movie if id is valid", async () => {
      const genre = new Genre({ name: "genre1" });
      const movie = new Movie({
        title: "movie1",
        genre: { _id: genre._id, name: genre.name },
        numberInStock: 7,
        dailyRentalRate: 2,
      });

      await genre.save();
      await movie.save();

      const res = await request(server).get("/api/movies/" + movie._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("title", movie.title);
    });
  });

  describe("POST /", () => {
    let token;
    let title;
    let genre;
    let genreId;
    let numberInStock;
    let dailyRentalRate;

    const exec = () => {
      return request(server)
        .post("/api/movies")
        .set("x-auth-token", token)
        .send({ title, genreId, numberInStock, dailyRentalRate });
    };

    beforeEach(async () => {
      genre = new Genre({ name: "genre1" });
      await genre.save();

      token = new User().generateAuthToken();
      title = "movie1";
      genreId = genre._id;
      numberInStock = 7;
      dailyRentalRate = 2;
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return 400 if title is less than 5 characters", async () => {
      title = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if title is more than 255 characters", async () => {
      title = new Array(257).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if numberInStock is less than 0", async () => {
      numberInStock = -1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if numberInStock is more than 255", async () => {
      numberInStock = 256;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if dailyRentalRate is less than 0", async () => {
      dailyRentalRate = -1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if dailyRentalRate is more than 255", async () => {
      dailyRentalRate = 256;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if genreId is invalid", async () => {
      genreId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should save the movie if it is valid", async () => {
      await exec();

      const movie = await Movie.find({ title: "movie1" });

      expect(movie).not.toBeNull();
    });

    it("should return the movie if it is valid", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("title", "movie1");
      expect(res.body).toHaveProperty("genre._id", genre._id.toHexString());
      expect(res.body).toHaveProperty("genre.name", genre.name);
      expect(res.body).toHaveProperty("numberInStock", 7);
      expect(res.body).toHaveProperty("dailyRentalRate", 2);
    });
  });

  describe("PUT /:id", () => {
    let id;
    let token;
    let title;
    let genre;
    let genreId;
    let numberInStock;
    let dailyRentalRate;

    const exec = () => {
      return request(server)
        .put("/api/movies/" + id)
        .set("x-auth-token", token)
        .send({ title, genreId, numberInStock, dailyRentalRate });
    };

    beforeEach(async () => {
      genre = new Genre({ name: "genre1" });

      const movie = new Movie({
        title: "movie1",
        genre: { _id: genre._id, name: genre.name },
        numberInStock: 7,
        dailyRentalRate: 2,
      });

      await genre.save();
      await movie.save();

      token = new User().generateAuthToken();
      id = movie._id;
      title = "new movie";
      genreId = genre._id;
      numberInStock = 9;
      dailyRentalRate = 1;
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return 404 if id is invalid", async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return 400 if title is less than 5 characters", async () => {
      title = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if title is more than 255 characters", async () => {
      title = new Array(257).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if numberInStock is less than 0", async () => {
      numberInStock = -1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if numberInStock is more than 255", async () => {
      numberInStock = 256;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if dailyRentalRate is less than 0", async () => {
      dailyRentalRate = -1;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if dailyRentalRate is more than 255", async () => {
      dailyRentalRate = 256;

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if genreId is invalid", async () => {
      genreId = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 404 if no movie with the given id exist", async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should update the movie if it is valid", async () => {
      await exec();

      const movie = await Movie.find({ title });

      expect(movie).not.toBeNull();
    });

    it("should return the movie if it is valid", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id", id.toHexString());
      expect(res.body).toHaveProperty("title", title);
      expect(res.body).toHaveProperty("genre._id", genre._id.toHexString());
      expect(res.body).toHaveProperty("genre.name", genre.name);
      expect(res.body).toHaveProperty("numberInStock", numberInStock);
      expect(res.body).toHaveProperty("dailyRentalRate", dailyRentalRate);
    });
  });

  describe("DELETE /:id", () => {
    let id;
    let token;
    let genre;
    let movie;

    const exec = () => {
      return request(server)
        .delete("/api/movies/" + id)
        .set("x-auth-token", token)
        .send();
    };

    beforeEach(async () => {
      genre = new Genre({ name: "genre1" });

      movie = new Movie({
        title: "movie1",
        genre: { _id: genre._id, name: genre.name },
        numberInStock: 7,
        dailyRentalRate: 2,
      });

      await genre.save();
      await movie.save();

      token = new User({ isAdmin: true }).generateAuthToken();
      id = movie._id;
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return 403 if user is not an admin", async () => {
      token = new User({ isAdmin: false }).generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(403);
    });

    it("should return 404 if id is invalid", async () => {
      id = 1;

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return 404 if no movie with the given id exist", async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should delete the movie if it exist", async () => {
      await exec();

      const movieInDb = await Movie.findById(id);

      expect(movieInDb).toBeNull();
    });

    it("should return the deleted movie", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id", movie._id.toHexString());
      expect(res.body).toHaveProperty("title", movie.title);
      expect(res.body).toHaveProperty("genre._id", genre._id.toHexString());
      expect(res.body).toHaveProperty("genre.name", genre.name);
      expect(res.body).toHaveProperty("numberInStock", movie.numberInStock);
      expect(res.body).toHaveProperty("dailyRentalRate", movie.dailyRentalRate);
    });
  });
});
