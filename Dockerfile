FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Instala dependências nativas necessárias
RUN apk add --no-cache python3 make g++

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

CMD ["npx", "prisma", "migrate", "deploy"] && ["node", "dist/main.js"]
