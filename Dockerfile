# Multi-stage: Vite build → static serve (Railway)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_PUBLIC_SUPABASE_URL=
ARG VITE_PUBLIC_SUPABASE_ANON_KEY=
ARG VITE_PUBLIC_SITE_URL=https://izmirisilanlari35.com
ENV VITE_PUBLIC_SUPABASE_URL=$VITE_PUBLIC_SUPABASE_URL \
    VITE_PUBLIC_SUPABASE_ANON_KEY=$VITE_PUBLIC_SUPABASE_ANON_KEY \
    VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve@14.2.4
COPY --from=build /app/out ./out
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "serve -s out -l tcp://0.0.0.0:${PORT}"]
