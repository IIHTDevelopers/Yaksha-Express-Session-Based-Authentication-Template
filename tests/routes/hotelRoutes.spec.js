const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const hotelRoutes = require('../../routes/hotelRoutes'); // Adjust path if necessary
const userRoutes = require('../../routes/userRoutes'); // Adjust path if necessary
const app = express();

// Middleware setup for the app
app.use(bodyParser.json());
app.use(session({
  secret: 'hotel-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Use routes
app.use('/api', hotelRoutes);
app.use('/api/users', userRoutes);

const { hotels } = require('../../models/hotel'); // Assuming this is your hotel model
const { users } = require('../../models/user'); // Assuming this is your user model
let agent;

let hotelRoutesBoundaryTest = `HotelRoutesRoutes boundary test`;

describe('Hotel Routes', () => {
  describe('boundary', () => {
    let user;

    beforeAll(() => {
      // Create an agent to persist session
      agent = request.agent(app);

      // Add a mock user for login
      user = { id: 1, email: 'john@example.com', password: 'password123' }; // Password is 'password123'
      users.push(user);  // Add to users for login
    });

    afterAll(() => {
      // Clear the hotels and users for a clean state after all tests
      hotels.length = 0;
      users.length = 0;
    });

    // Public route tests

    test(`${hotelRoutesBoundaryTest} GET /api/hotels - should return all hotels`, async () => {
      // Create a dummy hotel for testing
      hotels.push({ id: 1, name: 'Hotel Sunshine', location: 'Paris', pricePerNight: 200 });

      const response = await request(app).get('/api/hotels');
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toBe('Hotel Sunshine');
    });

    test(`${hotelRoutesBoundaryTest} GET /api/hotels/:id - should return hotel by id`, async () => {
      const response = await request(app).get('/api/hotels/1');
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Hotel Sunshine');
    });

    test(`${hotelRoutesBoundaryTest} GET /api/hotels/:id - should return 404 for non-existent hotel`, async () => {
      const response = await request(app).get('/api/hotels/999');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Hotel not found');
    });

    test(`${hotelRoutesBoundaryTest} POST /api/hotels - should return unauthorized if not authenticated`, async () => {
      const response = await request(app).post('/api/hotels').send({
        name: 'Hotel California',
        location: 'Los Angeles',
        pricePerNight: 300
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    test(`${hotelRoutesBoundaryTest} PUT /api/hotels/:id - should return unauthorized if not authenticated`, async () => {
      hotels.push({ id: 3, name: 'Hotel Sunset', location: 'Miami', pricePerNight: 150 });

      const response = await request(app).put('/api/hotels/3').send({
        name: 'Hotel Sunset Updated',
        location: 'Miami',
        pricePerNight: 180
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });
});
