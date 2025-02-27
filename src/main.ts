import Fastify from 'fastify';

const fastify = Fastify();

fastify.get('/', function (_, reply) {
  reply.send({ hello: 'world' });
});

fastify.listen({ port: 3000 }, function (err) {
  if (err) {
    fastify.log.error(err);
  }
  console.log(`Server is now listening on 3000`);
});
