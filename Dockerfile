FROM oven/bun:slim

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build

EXPOSE 3000
RUN chmod +x ./entrypoint.sh
CMD ["./entrypoint.sh"]