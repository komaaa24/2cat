FROM node:16.14.0
COPY /app/src/ .
WORKDIR /app
ADD package*.json ./
RUN npm install
ADD /src/server.js ./
CMD [ "node","/src/server.js" ]