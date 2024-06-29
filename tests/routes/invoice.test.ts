import request from "supertest";
import app from "@/app";
import AuthService from "@/services/auth.service";
import CustomerModel from "@/models/customer.model";
import { Types } from "mongoose";
import { buildMockCustomer, buildMockInvoice } from "../mocks";
import InvoiceModel from "@/models/invoice.model";

describe("/invoice", () => {
  let authService: AuthService;

  const user = {
    email: "testuser@example.ca",
    password: "somelongpassword",
    name: "Test UserModel",
    is_admin: false,
    permissions: ["invoice:read"],
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

  describe("GET /invoice", () => {
    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/invoice");
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const response = await request(app)
        .get("/invoice")
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 200 if a user is not an admin, should return an array with just their own invoice records", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get("/invoice")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("invoices");
      expect(response.body.invoices).toHaveLength(1);
    });

    it("should return all invoices if a user is an admin", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      await InvoiceModel.create(buildMockInvoice(userId, customer.id));
      await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get("/invoice")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("invoices");
      expect(response.body.invoices).toHaveLength(2);
    });

    it("should not return deleted invoice records", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      await InvoiceModel.create(buildMockInvoice(userId, customer.id));
      await InvoiceModel.create(
        buildMockInvoice(userId, customer.id, { deleted_at: new Date().toISOString() }),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get("/invoice")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("invoices");
      expect(response.body.invoices).toHaveLength(1);
    });
  });

  describe("GET /invoice/:id", () => {
    it("should return 401 if no token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const invoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const response = await request(app).get(`/invoice/${invoice._id}`);
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const invoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const response = await request(app)
        .get(`/invoice/${invoice._id}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 200 if a user is accessing their own invoice record", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const invoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get(`/invoice/${invoice._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("invoice");
    });

    it("should return 403 if a user is not an admin and is trying to access another user's invoice record", async () => {
      const customerByAdmin = await CustomerModel.create(
        buildMockCustomer(adminUserId),
      );
      const invoiceByAdmin = await InvoiceModel.create(
        buildMockInvoice(adminUserId, customerByAdmin.id),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get(`/invoice/${invoiceByAdmin._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should return the user's invoice record if a user is an admin", async () => {
      const customerByUser = await CustomerModel.create(
        buildMockCustomer(userId),
      );
      const invoiceByUser = await InvoiceModel.create(
        buildMockInvoice(userId, customerByUser.id),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get(`/invoice/${invoiceByUser._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("invoice");
    });

    it("should return 404 if querying a deleted invoice", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const deletedInvoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id, { deleted_at: new Date().toISOString() }));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get(`/invoice/${deletedInvoice._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Invoice not found");
    });
  });

  describe("POST /invoice", () => {
    it("should return 401 if no token is provided", async () => {
      const response = await request(app).post("/invoice");
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const response = await request(app)
        .post("/invoice")
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 403 if the user is not an admin", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .post("/invoice")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)

      expect(response.status).toBe(403);
    });

    it("should return 201 if the user is an admin", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .post("/invoice")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send(buildMockInvoice(adminUserId, customer.id));

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("invoice");
    });
  });

  describe("PATCH /invoice/:id", () => {
    it("should return 401 if no token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const invoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const response = await request(app).patch(`/invoice/${invoice._id}`);
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const invoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const response = await request(app)
        .patch(`/invoice/${invoice.id}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 403 if a user is not an admin and updating another user's invoice record", async () => {
      const customerByAdmin = await CustomerModel.create(
        buildMockCustomer(adminUserId),
      );
      const invoiceByAdmin = await InvoiceModel.create(buildMockInvoice(adminUserId, customerByAdmin.id));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .patch(`/invoice/${invoiceByAdmin._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should return 403 if the user is updating their own invoice record", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const invoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .patch(`/invoice/${invoice._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(403);
    });

    it("should return 201 if a user is an admin updating another user's invoice record", async () => {
      const customerByUser = await CustomerModel.create(
        buildMockCustomer(userId),
      );
      const invoiceByUser = await InvoiceModel.create(
        buildMockInvoice(userId, customerByUser.id),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .patch(`/invoice/${invoiceByUser._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ description: "Updated Description", jobs: ["BEDBUG"], amount: 510, service_date: new Date().toISOString(), payment_date: new Date().toISOString() });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("invoice");
      expect(response.body.invoice).toMatchObject({
        description: "Updated Description",
        jobs: ["BEDBUG"],
        amount: 510,
        service_date: expect.any(String),
        payment_date: expect.any(String),
        customer_id: customerByUser.id,
        user_id: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it("should return 400 if an admin is updating the [customer_id, user_id] field on another user's invoice record", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const invoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .patch(`/invoice/${invoice._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({
          customer_id: "667f4efe80dece984ff1c1ac",
          user_id: "6679ffe2dc6c10ac1b61b54c",
        });

      expect(response.status).toBe(400);
    });

    it("should return 404 if an admin is updating a deleted invoice record", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId),);
      const deletedInvoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id, { deleted_at: new Date().toISOString() }));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .patch(`/invoice/${deletedInvoice._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ description: "Updated Description" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Invoice not found");
    });
  });

  describe("DELETE /invoice/:id", () => {
    it("should return 401 if no token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const invoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const response = await request(app).delete(`/invoice/${invoice._id}`);
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const invoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id));

      const response = await request(app)
        .delete(`/invoice/${invoice._id}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 403 if a user is not an admin and deleting another user's invoice record", async () => {
      const customerByAdmin = await CustomerModel.create(
        buildMockCustomer(adminUserId),
      );
      const invoiceByAdmin = await InvoiceModel.create(
        buildMockInvoice(adminUserId, customerByAdmin.id),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .delete(`/invoice/${invoiceByAdmin._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should return 404 if the invoice record does not exist", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .delete(`/invoice/6679ffe2dc6c10ac1b61b54c`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Invoice not found");
    });

    it("should return 200 if a user is an admin deleting another user's invoice record", async () => {
      const customerByUser = await CustomerModel.create(
        buildMockCustomer(userId),
      );
      const invoiceByUser = await InvoiceModel.create(
        buildMockInvoice(userId, customerByUser.id),
      );

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .delete(`/invoice/${invoiceByUser._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("invoice");
      expect(response.body.invoice.deleted_at).toBeTruthy();
    });

    it("should return 404 if deleting a deleted invoice record", async () => {
      const customer = await CustomerModel.create(buildMockCustomer(userId));
      const deletedInvoice = await InvoiceModel.create(buildMockInvoice(userId, customer.id, { deleted_at: new Date().toISOString() }));

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .delete(`/invoice/${deletedInvoice._id}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Invoice not found");
    });
  });
});
