import { NextFunction } from "express";
import { Request, Response } from 'express';
import { ApiResponse } from '../types/common';
import {  LoginBody, LoginResponse, RegistrationResponse } from '../types/auth';
import RegistrationBody from "../types/auth"; 
import { validateRequestWithZod } from '../middleware/validateRequestMiddleware';
import { registerSchemaRules } from '../schemas/auth/registerRequest';
import { User } from '../models/user';
import { createErrorJson, createSuccessJson } from '../utils/responseWrapper';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { HASH_SALT, jwtLoginExpiresInTime, jwtLoginExpiresInTimeRememberMe, jwtResetPasswordExpiresInTime } from '../constants/common';
import { loginSchemaRules } from "../schemas/auth/logiinRequest";
import { role } from "../constants/user";

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// /auth/register
// Register user and get data for login
export const register = [
    validateRequestWithZod(registerSchemaRules), // assuming validation rules are correctly defined
    async (
        req: Request<{}, {}, RegistrationBody>,
        res: Response<ApiResponse<RegistrationResponse>>
    ) => {
        // console.log({req});

        const email = req.body.email ;
        const password = req.body.password;

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                res.status(400).json(createErrorJson([{ type: 'register', msg: 'BE_user_already_exists' }]));
                return;
            }

            const hashedPassword = await bcrypt.hash(password, HASH_SALT);

            const newUser = new User({
                email,
                password: hashedPassword,
                firstName: req.body.firstName, // ako želiš da ostane prazan ako nije poslat
                lastName: req.body.lastName,
                role:role.user,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await newUser.save();

            // Create token for login user on registration
            const expiresIn = jwtLoginExpiresInTime;

            const token = jwt.sign({ email: newUser.email, id: newUser._id }, JWT_SECRET, { expiresIn });

            const userId= newUser._id.toString();

            const { password: _, _id: s, ...addedUser } = newUser.toObject();

            const publicUser = {
                _id: userId,
                ...addedUser
            };
             
            const response: RegistrationResponse = {
                token: token,
                user:publicUser
            }

            res.status(201).json(
                createSuccessJson<RegistrationResponse>("BE_user_registered_successfully", response));
            }


            catch (error) {
                console.error(error);
                res.status(500).json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
            }
                
        }
    ];



export const test = [
    validateRequestWithZod(registerSchemaRules)
    ,
    async (
    req: Request<{}, {}, RegistrationBody>,
    res: Response<{
        radi: string
    },{}>
) => {
    console.log(req)

    const email = req.body?.email || '';
    const password = req.body?.password || '';

    const hashedPassword = password;


    const newUser = new User({
        password: hashedPassword,
        firstName: req.body.firstName || '', // ako želiš da ostane prazan ako nije poslat
        lastName: req.body.lastName || '',
        createdAt: new Date(),
        updatedAt: new Date(),


    });

    newUser.email = email;

    console.log({newUser})

    await newUser.save()

    res.json({"radi": "user"})

    return;


}]

export async function test2(req: any, res:any) {
    return res.send("123")
}

export const login= [
    validateRequestWithZod(loginSchemaRules),

    async(
        req: Request<{}, {}, LoginBody>, 
        res:Response<ApiResponse<LoginResponse | null>>
    ) => {

        const email = req.body.email ;
        const password = req.body.password;

    try{
        const user= await User.findOne({email})

        if(!user){
            res.status(400).json(createErrorJson([{ type: 'login', msg: 'BE_email_not_exist' }]));
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            res.status(400).json(createErrorJson([{ type: 'login', msg: 'BE_invalid_password' }]));
            return;
        }

        const expiresIn = jwtLoginExpiresInTime;

        const userId= user._id.toString();

        const {
            password:_,
            _id:__v,
            ...rest


        }=user.toObject()

        const publicUser={_id:userId, ...rest}

        const token = jwt.sign({ email: user.email, id: userId }, JWT_SECRET, { expiresIn });

        const response: LoginResponse = {
            token: token,
            user: publicUser
        }

        res.status(200).json(createSuccessJson("BE_user_login_successfully", response));

    }

    catch(error:any){
        console.error(error);
         res.status(500).json(createErrorJson([{ type: 'general', msg: 'BE_something_went_wrong' }]));
         return;
    }

    }

]
    