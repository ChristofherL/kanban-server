import Fastify, { errorCodes } from 'fastify';
import { z } from 'zod';
import { prisma } from './lib/prisma';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import express, { NextFunction, Request, Response } from 'express';
import fastifyExpress from '@fastify/express';
import cookieParser from 'cookie-parser';

const fastify = Fastify();
const router = express.Router();
express().use(cookieParser());

function ensureAuthenticated(
  request: Request,
  reply: Response,
  next: NextFunction,
) {
  const authToken = request.headers.cookie?.split('=')[1];

  if (!authToken) {
    reply
      .status(401)
      .send({ message: 'token must be provided', statusCode: 401 });
    return;
  }

  jwt.verify(authToken, process.env.PRIVATE_KEY_JWT as string, (err) => {
    if (err) {
      reply.status(500).send(err);
      console.log(err);
      return;
    }
    next();
  });
}

router.post('/api/signup', async function (request, reply) {
  try {
    const signupSchema = z.object({
      name: z.string().min(3).max(50),
      email: z.string().email().max(254),
      password: z.string().min(8),
    });

    const data = signupSchema.parse(request.body);

    const user = await prisma.user.findFirst({ where: { email: data.email } });

    if (user) {
      reply.status(400).send({
        message: 'there is already a user with this email!',
        statusCode: 400,
      });
      return;
    }

    const encryptedPassword = await argon2.hash(data.password);

    const createdUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: encryptedPassword,
      },
    });

    const privateKey = crypto.randomBytes(64).toString('hex');

    const authToken = jwt.sign({ userId: createdUser.id }, privateKey);

    reply
      .status(201)
      .send({ message: 'success', statusCode: 201 })
      .setCookie('authToken', authToken, { httpOnly: true });
  } catch (err) {
    console.log(err);
    reply.send({ err });
  }
});

fastify.post('/signin', async (request, reply) => {
  try {
    const signinSchema = z.object({
      email: z.string().nonempty(),
      password: z.string().nonempty(),
    });

    const data = signinSchema.parse(request.body);

    const user = await prisma.user.findFirst({ where: { email: data.email } });

    if (!user) {
      reply
        .status(400)
        .send({ message: 'Invalid email or password', statusCode: 400 });
      return;
    }

    const isPasswordCorresponding = await argon2.verify(
      user?.password,
      data.password,
    );

    if (!isPasswordCorresponding) {
      reply
        .status(400)
        .send({ message: 'Invalid email or password', statusCode: 400 });
      return;
    }

    const privateKey = crypto.randomBytes(64).toString('hex');

    const authToken = jwt.sign({ userId: user.id }, privateKey);

    reply
      .status(201)
      .send({ message: 'success', statusCode: 201 })
      .setCookie('authToken', authToken, { httpOnly: true });
  } catch (err) {
    console.log(err);
    reply.status(500).send({ err });
  }
});

fastify.listen({ port: 3000 }, function (err) {
  if (err) {
    fastify.log.error(err);
  }
  console.log(`Server is now listening on 3000`);
});
