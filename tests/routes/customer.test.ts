import request from "supertest";
import app from "@/app";
import AuthService from "@/services/auth.service";
import CustomerModel from "@/models/customer.model";
import { Types } from "mongoose";
import { buildMockCustomer } from "../mocks/customer";

describe("/customer", () => {
  let authService: AuthService;

  const user = {
    email: "testuser@example.ca",
    password: "somelongpassword",
    name: "Test UserModel",
    is_admin: false,
    permissions: ["customer:read", "customer:update"],
    address: "1234 Test St",
    address2: "Apt 123",
    city: "Test City",
    postal_code: "12345",
    phone: "123-456-7890",
  };
  let userId: Types.ObjectId;

  const adminUser = {
    ...user,
    email: "testadminuser@example.ca",
    is_admin: true,
  };
  let adminUserId: Types.ObjectId;

  beforeEach(async () => {
    authService = new AuthService();

    const createdUserRecord = await authService.register(user);
    const createdAdminUserRecord = await authService.register(adminUser);

    userId = createdUserRecord._id;
    adminUserId = createdAdminUserRecord._id;
  });

  describe("GET /customer", () => {
    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/customer");
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const response = await request(app)
        .get("/customer")
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 200 if a user is not an admin, should return an array with just their own customer records", async () => {
      await CustomerModel.create(buildMockCustomer(userId));
      await CustomerModel.create(buildMockCustomer(userId));
      await CustomerModel.create(buildMockCustomer(adminUserId));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get("/customer")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("customers");
      expect(response.body.customers).toHaveLength(2);
    });

    it("should return the list of customers if a user is an admin", async () => {
      await CustomerModel.create(buildMockCustomer(userId));
      await CustomerModel.create(buildMockCustomer(userId));
      await CustomerModel.create(buildMockCustomer(adminUserId));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get("/customer")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("customers");
      expect(response.body.customers).toHaveLength(3);
    });
  });

  describe("GET /customer/:id", () => {
    it("should return 401 if no token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const response = await request(app).get(`/customer/${customer._id}`);
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const response = await request(app)
        .get(`/customer/${customer._id}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 200 if a user is accessing their own customer record", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get(`/customer/${customer._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("customer");
    });

    it("should return 403 if a user is not an admin and is trying to access another user's customer record", async () => {
      const customerByAdmin = await CustomerModel.create(
        buildMockCustomer(adminUserId),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get(`/customer/${customerByAdmin._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should return the user's customer record if a user is an admin", async () => {
      const customerByUser = await CustomerModel.create(
        buildMockCustomer(userId),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get(`/customer/${customerByUser._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("customer");
    });
  });

  describe("PATCH /customer/:id", () => {
    it("should return 401 if no token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const response = await request(app).patch(`/customer/${customer._id}`);
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const response = await request(app)
        .patch(`/customer/${customer.id}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 403 if a user is not an admin and updating another user's customer record", async () => {
      const customerByAdmin = await CustomerModel.create(
        buildMockCustomer(adminUserId),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .patch(`/customer/${customerByAdmin._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should return 201 if the user is updating their own customer record", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .patch(`/customer/${customer._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("customer");
      expect(response.body.customer.name).toBe("Updated Name");
    });

    it("should return 201 if a user is an admin updating another user's customer record", async () => {
      const customerByUser = await CustomerModel.create(
        buildMockCustomer(userId),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .patch(`/customer/${customerByUser._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("customer");
      expect(response.body.customer.name).toBe("Updated Name");
    });

    it("should return 409 if a user is updating a name that is taken", async () => {
      const customer1 = await CustomerModel.create(
        buildMockCustomer(userId, {
          name: "Test Name",
        }),
      );
      const customer2 = await CustomerModel.create(buildMockCustomer(userId));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .patch(`/customer/${customer2._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ name: "Test Name" });

      console.log({ body: response.body });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe(
        'Plan executor error during findAndModify :: caused by :: E11000 duplicate key error collection: test.Customer index: name_1 dup key: { name: "Test Name" }',
      );
    });

    it("should return 403 if a user is updating the [status, category, invoice_amount, invoices_per_month, user_id] field on their own customer record", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .patch(`/customer/${customer._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({
          status: "INACTIVE",
          category: "HOMECALL",
          invoice_amount: 25,
          invoices_per_month: 3,
          user_id: "6679ffe2dc6c10ac1b61b54c",
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Only admins may update these fields");
    });

    it("should return 201 if an admin is updating the [status, category, invoice_amount, invoices_per_month, user_id] field on a customer record", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .patch(`/customer/${customer._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({
          status: "INACTIVE",
          category: "HOMECALL",
          invoice_amount: 25,
          invoices_per_month: 3,
          user_id: "6679ffe2dc6c10ac1b61b54c",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Customer updated");
      expect(response.body).toHaveProperty("customer");
      expect(response.body.customer.status).toBe("INACTIVE");
      expect(response.body.customer.category).toBe("HOMECALL");
      expect(response.body.customer.invoice_amount).toBe(25);
      expect(response.body.customer.invoices_per_month).toBe(3);
      expect(response.body.customer.user_id).toBe("6679ffe2dc6c10ac1b61b54c");
    });
  });

  describe("DELETE /customer/:id", () => {
    it("should return 401 if no token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const response = await request(app).delete(`/customer/${customer._id}`);
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const response = await request(app)
        .delete(`/customer/${customer._id}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 403 if a user is not an admin and deleting another user's customer record", async () => {
      const customerByAdmin = await CustomerModel.create(
        buildMockCustomer(adminUserId),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .delete(`/customer/${customerByAdmin._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should return 404 if the customer record does not exist", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .delete(`/customer/6679ffe2dc6c10ac1b61b54c`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Customer not found");
    });

    it("should return 200 if a user is an admin deleting another user's customer record", async () => {
      const customerByUser = await CustomerModel.create(
        buildMockCustomer(userId),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .delete(`/customer/${customerByUser._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("customer");
      expect(response.body.customer.deleted_at).toBeTruthy();
    });
  });
});
