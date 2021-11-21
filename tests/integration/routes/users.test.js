const request = require("supertest");
const bcrypt = require("bcrypt");
const { User } = require("../../../models/user");

describe("/api/users", () => {
  jest.setTimeout(60000);

  let server;
  let user;

  beforeEach(async () => {
    server = require("../../../index");

    user = new User({
      name: "12345",
      email: "12345@mail.com",
      password: "12345",
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
  });

  afterEach(async () => {
    await server.close();
    await User.deleteMany({});
  });

  describe("GET /me", () => {
    it("should return 401 if client is not logged in", async () => {
      const res = await request(server).get("/api/users/me");

      expect(res.status).toBe(401);
    });

    it("should return the user", async () => {
      const token = user.generateAuthToken();

      const res = await request(server)
        .get("/api/users/me")
        .set("x-auth-token", token);

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("email", user.email);
    });
  });

  describe("POST /", () => {
    let name, email, password;

    const exec = () => {
      return request(server).post("/api/users").send({ name, email, password });
    };

    beforeEach(() => {
      name = "abcde";
      email = "abcde@mail.com";
      password = "abcde";
    });

    it("should return 400 if name is less than 5 characters", async () => {
      name = "abc";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if name is more than 50 characters", async () => {
      name = new Array(52).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if email is less than 5 characters", async () => {
      email = "abc";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if email is more than 255 characters", async () => {
      email = new Array(257).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if email is invalid", async () => {
      email = "abced";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if password is less than 5 characters", async () => {
      password = "abc";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if password is more than 255 characters", async () => {
      password = new Array(257).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if user already exist", async () => {
      email = "12345@mail.com";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return the user if input is valid", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", name);
      expect(res.body).toHaveProperty("email", email);
    });
  });
});
