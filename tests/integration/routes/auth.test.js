const { User } = require("../../../models/user");
const bcrypt = require("bcrypt");
const request = require("supertest");

describe("/api/auth", () => {
  jest.setTimeout(60000);
  let server;
  let email, password;

  const exec = () => {
    return request(server).post("/api/auth").send({ email, password });
  };

  beforeEach(async () => {
    server = require("../../../index");

    email = "12345@mail.com";
    password = "12345";

    const user = new User({ name: "12345", email, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
  });

  afterEach(async () => {
    await server.close();
    await User.deleteMany({});
  });

  it("should return 400 if email is less than 5 characters", async () => {
    email = "1234";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 400 if email is more than 255 characters", async () => {
    email = new Array(257).join("a");

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 400 if email is invalid", async () => {
    email = "12345";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 400 if password is less than 5 characters", async () => {
    password = "1234";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 400 if password is more than 255 characters", async () => {
    password = new Array(257).join("a");

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 400 if no user with the given email exist", async () => {
    email = "abcde@gmail.com";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 400 if user password is invalid", async () => {
    password = "abcde";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 200 if input is valid", async () => {
    const res = await exec();

    expect(res.status).toBe(200);
  });
});
