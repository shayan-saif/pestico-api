import { connect, closeDatabase, clearDatabase } from "./setupTestDB";

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  await clearDatabase();
});
