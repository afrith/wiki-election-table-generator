FROM node:8
ENV NODE_ENV production
WORKDIR /usr/src
COPY package.json yarn.lock /usr/src/
RUN yarn install --production
COPY dist /usr/src/dist
EXPOSE 3000
USER node
CMD [ "yarn", "start" ]
