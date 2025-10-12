FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .


FROM node:18-alpine

WORKDIR /app

COPY --from=build /app /app

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "index.js"]
