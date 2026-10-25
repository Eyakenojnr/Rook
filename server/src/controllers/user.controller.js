import * as userService from '../services/user.service.js';
import AppError from '../utils/appError.js';


export const getProfile = async (req, res, next) => {
    try {
        const data = await userService.getUserProfileDashbooard(req.user.id);
        res.status(200).json({
            status: 'success',
            data,
        });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            throw new AppError('Both currentPassword and newPassword are required.', 422);
        }

        const result = await userService.changePassword(req.user.id, currentPassword, newPassword);

        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};