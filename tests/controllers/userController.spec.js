const request = require('supertest');
const bcrypt = require('bcrypt');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const userRoutes = require('../../routes/userRoutes'); // Ensure the path is correct
const { logoutUser, registerUser, loginUser } = require('../../controllers/userController'); // Adjust the path
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

jest.mock('bcrypt');  // Mock bcrypt module

const { users } = require('../../models/user');  // Assuming this is your user model
let agent;

let userControllerBoundaryTest = `UserController boundary test`;

describe('User Controller', () => {
    describe('boundary', () => {
        beforeAll(() => {
            // Create an agent to persist session
            agent = request.agent(app);
        });

        afterAll(() => {
            // Clear the users for a clean state after tests
            users.length = 0;
        });

        test(`${userControllerBoundaryTest} POST /api/users/register - should register a new user`, async () => {
            const response = await request(app).post('/api/users/register').send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                age: 30
            });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.user.email).toBe('john@example.com');
        });

        test(`${userControllerBoundaryTest} POST /api/users/register - should return 400 if user already exists`, async () => {
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
            expect(response.body.message).toBe('User already exists');
        });

        test(`${userControllerBoundaryTest} POST /api/users/login - should login the user successfully`, async () => {
            // Register a user first
            await request(app).post('/api/users/register').send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                age: 30
            });

            // Login the user
            const response = await agent.post('/api/users/login').send({
                email: 'john@example.com',
                password: 'password123'
            });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Login successful');
        });

        test(`${userControllerBoundaryTest} POST /api/users/login - should return 400 if credentials are invalid`, async () => {
            // Try to login with invalid credentials
            const response = await agent.post('/api/users/login').send({
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid credentials');
        });

        test(`${userControllerBoundaryTest} POST /api/users/logout - should logout the user successfully`, async () => {
            // Register and login the user
            await request(app).post('/api/users/register').send({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                age: 30
            });

            await agent.post('/api/users/login').send({
                email: 'john@example.com',
                password: 'password123'
            });

            // Logout the user
            const response = await agent.post('/api/users/logout');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Logged out successfully');
        });

        test(`${userControllerBoundaryTest} should have session.destroy in logoutUser method`, () => {
            // Convert the logoutUser function to a string
            const logoutUserStr = logoutUser.toString();

            // Check if the .session.destroy method is present in the function code as a string
            expect(logoutUserStr).toContain('.session.destroy');
        });

        test(`${userControllerBoundaryTest} registerUser should use bcrypt.hash as a string`, () => {
            // Convert the registerUser function to a string
            const registerUserStr = registerUser.toString();

            // Check if .hash is used in the function code as a string
            expect(registerUserStr).toContain('.hash');
        });

        test(`${userControllerBoundaryTest} loginUser should use bcrypt.compare as a string`, () => {
            // Convert the loginUser function to a string
            const loginUserStr = loginUser.toString();

            // Check if .compare is used in the function code as a string
            expect(loginUserStr).toContain('.compare');
        });
    });
});
