FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy the rest of the code (though invalidation is handled by volume)
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
