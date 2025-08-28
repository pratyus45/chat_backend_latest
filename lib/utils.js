import jwt from 'jsonwebtoken';
//function to generate a JWT token
export const generateToken = (userId) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET);
        expiresIn: '30d' // Token will expire in 30 days)
        return token;
}