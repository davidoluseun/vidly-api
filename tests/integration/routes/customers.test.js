const { Customer } = require("../../../models/customer");
const { User } = require("../../../models/user");
const mongoose = require("mongoose");
const request = require("supertest");

describe("/api/customers", () => {
  let server;

  beforeEach(() => {
    server = require("../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Customer.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all customers", async () => {
      await Customer.collection.insertMany([
        { name: "customer1", phone: "12345" },
        { name: "customer2", phone: "678910" },
      ]);

      const res = await request(server).get("/api/customers");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((c) => c.name === "customer1")).toBeTruthy();
      expect(res.body.some((c) => c.name === "customer2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return 404 if id is invalid", async () => {
      const res = await request(server).get("/api/customers/1");

      expect(res.status).toBe(404);
    });

    it("should return 404 if no customer with the given id exist", async () => {
      const id = mongoose.Types.ObjectId();

      const res = await request(server).get("/api/customers/" + id);

      expect(res.status).toBe(404);
    });

    it("should return a customer if id is valid", async () => {
      const customer = new Customer({ name: "customer1", phone: "12345" });
      await customer.save();

      const res = await request(server).get("/api/customers/" + customer._id);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", customer.name);
    });
  });

  describe("POST /", () => {
    let token, name, phone, isGold;

    const exec = () => {
      return request(server)
        .post("/api/customers")
        .set("x-auth-token", token)
        .send({ name, phone, isGold });
    };

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = "customer1";
      phone = "12345";
      isGold = false;
    });

    it("should return 401 if client is not logged in", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return 400 if name is less than 5 characters", async () => {
      name = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if name is more than 50 characters", async () => {
      name = new Array(52).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if phone is less than 5 characters", async () => {
      phone = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if phone is more than 50 characters", async () => {
      phone = new Array(52).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should save the customer if input is valid", async () => {
      await exec();

      const customer = await Customer.find({ name: "customer1" });

      expect(customer).not.toBeNull();
    });

    it("should return the customer if input is valid", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", "customer1");
    });
  });

  describe("POST /:id", () => {
    let token, customer, newName, newPhone, newIsGold;

    const exec = () => {
      return request(server)
        .put("/api/customers/" + id)
        .set("x-auth-token", token)
        .send({ name: newName, phone: newPhone, isGold: newIsGold });
    };

    beforeEach(async () => {
      token = new User().generateAuthToken();
      customer = new Customer({ name: "customer1", phone: "12345" });
      await customer.save();

      id = customer._id;
      newName = "updated name";
      newPhone = "678910";
      newIsGold = true;
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

    it("should return 400 if name is less than 5 characters", async () => {
      newName = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if name is more than 50 characters", async () => {
      newName = new Array(52).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if phone is less than 5 characters", async () => {
      newPhone = "1234";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if phone is more than 50 characters", async () => {
      newPhone = new Array(52).join("a");

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 404 if no customer with the given id exist", async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should update the customer if input is valid", async () => {
      await exec();

      const updatedCustomer = await Customer.findById(id);

      expect(updatedCustomer.name).toBe(newName);
      expect(updatedCustomer.phone).toBe(newPhone);
      expect(updatedCustomer.isGold).toBe(newIsGold);
    });

    it("should return the updated customer if input is valid", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", newName);
      expect(res.body).toHaveProperty("phone", newPhone);
      expect(res.body).toHaveProperty("isGold", newIsGold);
    });
  });

  describe("DELETE /:id", () => {
    let id, token, customer;

    const exec = () => {
      return request(server)
        .delete("/api/customers/" + id)
        .set("x-auth-token", token);
    };

    beforeEach(async () => {
      customer = new Customer({ name: "customer1", phone: "12345" });
      await customer.save();

      id = customer._id;
      token = new User({ isAdmin: true }).generateAuthToken();
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

    it("should return 404 if no customer with the given id exist", async () => {
      id = mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should delete the customer if it exist", async () => {
      await exec();

      const customerInDb = await Customer.findById(id);

      expect(customerInDb).toBeNull();
    });

    it("should return the deleted customer", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("_id", customer._id.toHexString());
      expect(res.body).toHaveProperty("name", customer.name);
    });
  });
});
