import request from "supertest";
import app from "@/app";
import AuthService from "@/services/auth.service";
import { Types } from "mongoose";
import UserService from "@/services/user.service";

describe("/user", () => {
  let authService: AuthService;
  let userService: UserService;

  const user = {
    email: "testuser@example.ca",
    password: "somelongpassword",
    name: "Test User",
    is_admin: false,
    permissions: ["user:update"],
    address: "1234 Test St",
    address2: "Apt 123",
    city: "Test City",
    postal_code: "12345",
    phone: "123-456-7890",
  };
  let userId: Types.ObjectId;

  const adminUser = {
    ...user,
    name: "Test Admin UserModel",
    email: "testadminuser@example.ca",
    is_admin: true,
  };
  let adminUserId: Types.ObjectId;

  beforeEach(async () => {
    authService = new AuthService();
    userService = new UserService();

    const createdUserRecord = await authService.register(user);
    const createdAdminUserRecord = await authService.register(adminUser);

    userId = createdUserRecord._id;
    adminUserId = createdAdminUserRecord._id;
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

    it("should not return deleted users", async () => {
      await userService.deleteUser(userId);

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get("/user")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("users");
      expect(response.body.users).toHaveLength(1);
    });

    it("should query a user by name using regex query", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get("/user?name=adm")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("users");
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].name).toBe(adminUser.name);
    });

    it("should filter admin users", async () => {
      await userService.deleteUser(userId);

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get("/user?is_admin=true")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("users");
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].name).toBe(adminUser.name);
    });

    it("should filter for deleted users", async () => {
      await userService.deleteUser(userId);

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get("/user?deleted_at=true")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("users");
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].name).toBe(user.name);
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

    it("should return 403 if a user is not an admin", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(403);
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

    it("should return 404 if querying a deleted user", async () => {
      await userService.deleteUser(userId);

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .get(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("User not found");
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

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("Only admins may update these fields");
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

    it("should return 404 when updating a deleted user", async () => {
      await userService.deleteUser(userId);

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .patch(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("User not found");
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

    it("should return 404 if the user does not exist", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .delete(`/user/6679ffe2dc6c10ac1b61b54c`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("User not found");
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

    it("should return 404 when deleting a deleted user", async () => {
      await userService.deleteUser(userId);

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .delete(`/user/${userId}`)
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("User not found");
    });
  });
});
