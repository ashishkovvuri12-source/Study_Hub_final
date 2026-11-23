"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const generateToken = (user) => {
    const secret = process.env.JWT_SECRET || 'studyhub_super_secret_jwt_key_2024';
    return jsonwebtoken_1.default.sign({
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        name: user.name
    }, secret, { expiresIn: '7d' });
};
// @desc    Register a new user
// @route   POST /api/auth/signup
const signup = async (req, res) => {
    try {
        const { username, name, email, password, role } = req.body;
        if (!username || !name || !email || !password) {
            res.status(400).json({ success: false, message: 'All fields are required (username, name, email, password).' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
            return;
        }
        const cleanUsername = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();
        // Check if user or email already exists
        const existingUser = await User_1.User.findOne({
            $or: [{ username: cleanUsername }, { email: cleanEmail }]
        });
        if (existingUser) {
            const msg = existingUser.username === cleanUsername
                ? 'Username is already taken. Please choose another.'
                : 'Email is already registered. Please sign in instead.';
            res.status(400).json({ success: false, message: msg });
            return;
        }
        const userRole = role === 'admin' ? 'admin' : 'student';
        const newUser = await User_1.User.create({
            username: cleanUsername,
            name: name.trim(),
            email: cleanEmail,
            password,
            role: userRole
        });
        const token = generateToken(newUser);
        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error creating user account.' });
    }
};
exports.signup = signup;
// @desc    Authenticate user and get token
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) {
            res.status(400).json({ success: false, message: 'Please enter both username and password.' });
            return;
        }
        const cleanUsername = username.trim().toLowerCase();
        const user = await User_1.User.findOne({ username: cleanUsername });
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid username or password.' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid username or password.' });
            return;
        }
        // Role check if tab selected specifically
        if (role && user.role !== role) {
            res.status(403).json({
                success: false,
                message: `This account does not have ${role} privileges. Current role is: ${user.role}.`
            });
            return;
        }
        const token = generateToken(user);
        res.status(200).json({
            success: true,
            message: 'Signed in successfully!',
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Login failed.' });
    }
};
exports.login = login;
// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const user = await User_1.User.findById(req.user.id).select('-password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found.' });
            return;
        }
        res.status(200).json({
            success: true,
            user
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching user profile.' });
    }
};
exports.getMe = getMe;
