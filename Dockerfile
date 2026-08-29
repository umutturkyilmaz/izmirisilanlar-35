# Multi-stage: Vite static build → nginx (Railway)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_PUBLIC_SUPABASE_URL
ARG VITE_PUBLIC_SUPABASE_ANON_KEY
ARG VITE_PUBLIC_SITE_URL=https://izmirisilanlari35.com
ENV VITE_PUBLIC_SUPABASE_URL=$VITE_PUBLIC_SUPABASE_URL
ENV VITE_PUBLIC_SUPABASE_ANON_KEY=$VITE_PUBLIC_SUPABASE_ANON_KEY
ENV VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL
RUN npm run build

FROM nginx:alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/template.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY --from=build /app/out /usr/share/nginx/html
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
