const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const userRoutes = require('../../routes/userRoutes'); // Adjust path if necessary
const app = express();

// Middleware setup for the app
app.use(bodyParser.json());
app.use(session({
    secret: 'user-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Use user routes
app.use('/api/users', userRoutes);

let userRoutesBoundaryTest = `UserRoutes boundary test`;

const { users } = require('../../models/user');  // Assuming this is your user model
let agent;

describe('User Routes', () => {
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
            // Clear the users for a clean state after tests
            users.length = 0;
        });

        test(`${userRoutesBoundaryTest} POST /api/users/register - should return 400 if user already exists`, async () => {
            // Register a user first
            await request(app).post('/api/users/register').send({
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'password123',
                age: 25
            });

            // Try to register the same user again
            const response = await request(app).post('/api/users/register').send({
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'password123',
                age: 25
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/user already exists/i);
        });

        test(`${userRoutesBoundaryTest} POST /api/users/login - should return 400 if credentials are invalid`, async () => {
            const response = await agent.post('/api/users/login').send({
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/invalid credentials/i);
        });
    });
});
