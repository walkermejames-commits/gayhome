FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system navigator && useradd --system --gid navigator navigator
COPY --from=build --chown=navigator:navigator /app/.next/standalone ./
COPY --from=build --chown=navigator:navigator /app/.next/static ./.next/static
USER navigator
EXPOSE 3000
CMD ["node","server.js"]
