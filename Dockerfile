FROM node:16
# set the working directory in the container
WORKDIR /app
# copy the current directory contents into the container at /app
COPY . /app
# install any needed packages
RUN npm install

EXPOSE 4000
# Run this command when the container launches
CMD [ "npm","run","node" ]
