import request from "supertest";
import app from "@/app";
import AuthService from "@/services/auth.service";
import UserModel from "@/models/user.model";

describe("/user", () => {
  let authService: AuthService;

  const user = {
    email: "testuser@example.ca",
    password: "somelongpassword",
    name: "Test UserModel",
    is_admin: false,
    permissions: ["user:read", "user:update"],
    address: "1234 Test St",
    address2: "Apt 123",
    city: "Test City",
    postal_code: "12345",
    phone: "123-456-7890",
  };
  let userId: string;

  const adminUser = {
    ...user,
    email: "testadminuser@example.ca",
    is_admin: true,
  };
  let adminUserId: string;

  beforeEach(async () => {
    authService = new AuthService();

    await authService.register(user);
    await authService.register(adminUser);

    const users = await UserModel.find();

    userId = users[0]?._id?.toString() ?? "";
    adminUserId = users[1]?._id?.toString() ?? "";
  });

  describe("GET /user", () => {
    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/user");
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const response = await request(app)
        .get("/user")
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 403 if a user is not an admin", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get("/user")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should return the list of users if a user is an admin", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get("/user")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("users");
      expect(response.body.users).toHaveLength(2);
      expect(response.body.users[0]).not.toHaveProperty("password");
    });
  });

  describe("GET /user/:id", () => {
    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get(`/user/${userId}`);
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const response = await request(app)
        .get(`/user/${userId}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 200 if a user is accessing their own user record", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 403 if a user is not an admin and is trying to access another user's record", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get(`/user/${adminUserId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should return the user record if a user is an admin", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).not.toHaveProperty("password");
    });
  });

  describe("PATCH /user/:id", () => {
    it("should return 401 if no token is provided", async () => {
      const response = await request(app).patch(`/user/${userId}`);
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const response = await request(app)
        .patch(`/user/${userId}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 403 if a user is not an admin and updating another user's record", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .patch(`/user/${adminUserId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should return 201 if the user is updating their own record", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .patch(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.name).toBe("Updated Name");
    });

    it("should return 201 if a user is an admin updating another user", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .patch(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.name).toBe("Updated Name");
    });

    it("should return 400 if a user is updating an email that is taken", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .patch(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ email: adminUser.email });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Email is already taken");
    });

    it("should return 401 if a user is updating the customers field on their own record", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .patch(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({
          customers: ["6679ffe2dc6c10ac1b61b54c", "6679ffe8811e76e66515eafc"],
        });

      expect(response.status).toBe(401);
    });

    it("should return 201 if an admin is updating the customers field on a user record", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .patch(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({
          customers: ["6679ffe2dc6c10ac1b61b54c", "6679ffe8811e76e66515eafc"],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.customers).toHaveLength(2);
    });
  });

  describe("DELETE /user/:id", () => {
    it("should return 401 if no token is provided", async () => {
      const response = await request(app).delete(`/user/${userId}`);
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const response = await request(app)
        .delete(`/user/${userId}`)
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should return 403 if a user is not an admin and deleting another user's record", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .delete(`/user/${adminUserId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
    });

    it("should return 200 if a user is an admin deleting another user", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .delete(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.body.user.deleted_at).toBeTruthy();
    });
  });
});