const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const hotelRoutes = require('../../routes/hotelRoutes'); // Ensure the path is correct
const userRoutes = require('../../routes/userRoutes'); // Ensure the path is correct
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

const { hotels } = require('../../models/hotel');
const { users } = require('../../models/user');

let hotelControllerBoundaryTest = `HotelController boundary test`;

describe('Hotel Controller', () => {
    describe('boundary', () => {
        let user;

        beforeAll(() => {
            // Mock user for testing
            user = { id: 1, email: 'admin@example.com', password: 'admin123' }; // Password is 'admin123'
            users.push(user);  // Add to users for login
        });

        afterAll(() => {
            // Clear the hotels and users for a clean state after all tests
            hotels.length = 0;
            users.length = 0;
        });

        test(`${hotelControllerBoundaryTest} GET /api/hotels - should return all hotels`, async () => {
            // Create a dummy hotel for testing
            hotels.push({ id: 1, name: 'Hotel Sunshine', location: 'Paris', pricePerNight: 200 });

            const response = await request(app).get('/api/hotels');
            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].name).toMatch(/hotel Sunshine/i);
        });

        test(`${hotelControllerBoundaryTest} GET /api/hotels/:id - should return hotel by id`, async () => {
            const response = await request(app).get('/api/hotels/1');
            expect(response.status).toBe(200);
            expect(response.body.name).toMatch(/hotel Sunshine/i);
        });

        test(`${hotelControllerBoundaryTest} GET /api/hotels/:id - should return 404 for non-existent hotel`, async () => {
            const response = await request(app).get('/api/hotels/999');
            expect(response.status).toBe(404);
            expect(response.body.message).toMatch(/hotel not found/i);
        });

        test(`${hotelControllerBoundaryTest} POST /api/hotels - should create hotel if authenticated`, async () => {
            const agent = request.agent(app); // Create an agent to persist session

            // Simulate login
            await agent.post('/api/users/login').send({ email: 'admin@example.com', password: 'admin123' });

            const response = await agent.post('/api/hotels').send({
                name: 'Hotel California',
                location: 'Los Angeles',
                pricePerNight: 300
            });

            expect(response.status).toBe(201);
            expect(response.body.message).toMatch(/hotel created successfully/i);
            expect(response.body.hotel.name).toMatch(/hotel California/i);
        });

        test(`${hotelControllerBoundaryTest} POST /api/hotels - should return unauthorized if not authenticated`, async () => {
            const response = await request(app).post('/api/hotels').send({
                name: 'Hotel California',
                location: 'Los Angeles',
                pricePerNight: 300
            });

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/unauthorized/i);
        });

        test(`${hotelControllerBoundaryTest} PUT /api/hotels/:id - should update hotel if authenticated`, async () => {
            const agent = request.agent(app); // Create an agent to persist session

            // Simulate login
            await agent.post('/api/users/login').send({ email: 'admin@example.com', password: 'admin123' });

            // Create a hotel for updating
            hotels.push({ id: 2, name: 'Hotel Mirage', location: 'New York', pricePerNight: 250 });

            const response = await agent.put('/api/hotels/2').send({
                name: 'Hotel Mirage Updated',
                location: 'New York',
                pricePerNight: 300
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/hotel updated successfully/i);
            expect(response.body.hotel.name).toMatch(/hotel Mirage Update/i);
        });

        test(`${hotelControllerBoundaryTest} PUT /api/hotels/:id - should return unauthorized if not authenticated`, async () => {
            hotels.push({ id: 3, name: 'Hotel Sunset', location: 'Miami', pricePerNight: 150 });

            const response = await request(app).put('/api/hotels/3').send({
                name: 'Hotel Sunset Updated',
                location: 'Miami',
                pricePerNight: 180
            });

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/unauthorized/i);
        });
    });
});
