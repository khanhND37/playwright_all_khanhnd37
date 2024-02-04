FROM mcr.microsoft.com/playwright:v1.34.3-jammy

RUN apt-get update && apt-get install build-essential -y
ENV PATH /app/node_modules/.bin:$PATH
WORKDIR /app

COPY package.json /app/

# Install dependencies
RUN yarn install
