import request from "supertest";
import app from "@/app";
import AuthService from "@/services/auth.service";

describe("/auth", () => {
  let authService: AuthService;
  const user = {
    email: "testuser@example.ca",
    password: "somelongpassword",
    name: "Test UserModel",
    is_admin: false,
    permissions: [],
    address: "1234 Test St",
    address2: "Apt 123",
    city: "Test City",
    postal_code: "12345",
    phone: "123-456-7890",
  };
  const adminUser = {
    ...user,
    email: "testadminuser@example.ca",
    is_admin: true,
  };

  beforeEach(async () => {
    authService = new AuthService();
    await authService.register(user);
    await authService.register(adminUser);
  });

  describe("GET /verify", () => {
    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/auth");
      expect(response.status).toBe(401);
    });

    it("should return 403 if invalid token is provided", async () => {
      const response = await request(app)
        .get("/auth")
        .set("Authorization", "Bearer invalid");

      expect(response.status).toBe(403);
    });

    it("should verify the token and return the user", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .get("/auth")
        .set("Authorization", `Bearer ${loginResponse.body.token}`);

      const { password, ...userWithoutPassword } = user;

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        user: userWithoutPassword,
      });
    });
  });

  describe("POST /login", () => {
    it("should login and return a token", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const { password, ...userWithoutPassword } = user;

      expect(response.status).toBe(200);
      console.log(response.body);
      expect(response.body).toMatchObject({
        user: userWithoutPassword,
        token: expect.any(String),
      });
    });
  });

  describe("POST /register", () => {
    it("should return 400 if an email is already in use", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .post("/auth/register")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send(user);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toMatch(
        "User with that email already exists",
      );
    });

    it("should return 403 if user is not admin", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      const response = await request(app)
        .post("/auth/register")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({});

      expect(response.status).toBe(403);
    });

    it("should return 201 if user is an admin", async () => {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: adminUser.email, password: adminUser.password });

      const response = await request(app)
        .post("/auth/register")
        .set("Authorization", `Bearer ${loginResponse.body.token}`)
        .send({
          ...user,
          email: "someotheruser@example.com",
        });

      expect(response.status).toBe(201);
    });
  });
});
