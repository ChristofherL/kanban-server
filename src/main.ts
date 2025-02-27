import Fastify from 'fastify';
import { z } from 'zod';
import { prisma } from './lib/prisma';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import cookies from '@fastify/cookie';

const fastify = Fastify();

fastify.register(cookies);

fastify.post('/signup', async function (request, reply) {
  try {
    const signupSchema = z.object({
      name: z.string().min(3).max(5),
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

fastify.listen({ port: 3000 }, function (err) {
  if (err) {
    fastify.log.error(err);
  }
  console.log(`Server is now listening on 3000`);
});
