import Fastify, { errorCodes } from 'fastify';
import { string, z } from 'zod';
import { prisma } from './lib/prisma';
import argon2 from 'argon2';
import jwt, { JwtPayload } from 'jsonwebtoken';
import express, { NextFunction, Request, response, Response } from 'express';
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
  const authToken = extractJwtFromCookies(request.headers.cookie);

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

function extractJwtFromCookies(cookie?: string) {
  return cookie?.split('=')[1];
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

    const authToken = jwt.sign(
      { userId: createdUser.id },
      process.env.PRIVATE_KEY_JWT as string,
    );

    reply
      .setHeader('set-cookie', `authToken=${authToken}; HttpOnly`)
      .send({ message: 'success', statusCode: 201 });
  } catch (err) {
    console.log(err);
    reply.send({ err });
  }
});

router.post('/api/signin', async (request, reply) => {
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

    const isPasswordMatch = await argon2.verify(user?.password, data.password);

    if (!isPasswordMatch) {
      reply
        .status(400)
        .send({ message: 'Invalid email or password', statusCode: 400 });
      return;
    }

    const authToken = jwt.sign(
      { userId: user.id },
      process.env.PRIVATE_KEY_JWT as string,
    );

    reply
      .setHeader('set-cookie', `authToken=${authToken}; HttpOnly`)
      .send({ message: 'success', statusCode: 201 });
  } catch (err) {
    console.log(err);
    reply.status(500).send({ err });
  }
});

router.get('/api/me', ensureAuthenticated, async (request, reply) => {
  try {
    const token = extractJwtFromCookies(request.headers.cookie);

    const payload = jwt.verify(
      token!,
      process.env.PRIVATE_KEY_JWT as string,
    ) as JwtPayload & { userId: string };

    const currentUser = await prisma.user.findFirst({
      where: { id: payload.userId },
    });

    reply.status(200).send({ ...currentUser });
  } catch (err) {
    console.log(err);
    reply.status(500).send({ err });
  }
});

router.post('/api/boards', ensureAuthenticated, async (request, reply) => {
  try {
    const boardSchema = z.object({
      name: z.string().min(4),
      userId: z.string().nonempty(),
    });

    const data = boardSchema.parse(request.body);

    const board = await prisma.board.findFirst({
      where: { name: data.name, AND: { userId: data.userId } },
    });

    if (board) {
      reply.status(400).send({
        message: 'You already have a board with that name!',
        statusCode: 400,
      });
    }

    const createdBoard = await prisma.board.create({ data });

    reply.status(201).send(createdBoard);
  } catch (err) {
    console.log(err);
    reply.status(500).send({ err });
  }
});

fastify.register(fastifyExpress).after(() => {
  fastify.use(express.urlencoded({ extended: false }));
  fastify.use(express.json());

  fastify.use(router);
});

fastify.listen({ port: 3000 }, console.log);
