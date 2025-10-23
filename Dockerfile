FROM oven/bun:slim

RUN apt update && \
    apt install -y curl && \
    apt clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .
RUN bun run build

HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 CMD [ "curl", "-f", "http://localhost:3000/" ]

EXPOSE 3000
RUN chmod +x ./entrypoint.sh
CMD ["./entrypoint.sh"]