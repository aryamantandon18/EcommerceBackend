FROM node:18-alpine
# set the working directory in the container
WORKDIR /app
ADD package*.json /app
# install any needed packages 
RUN npm install
# copy the current directory contents into the container at /app
COPY . /app
EXPOSE 4000
# Run this command when the container launches
CMD [ "npm","run","node" ]



# The ADD and RUN commands are placed before the COPY . /app command to take advantage of Docker's layer caching. Since dependency files (package*.json) usually change less frequently than the source code, this approach allows Docker to cache the installation step (npm install). As a result, when rebuilding the image after modifying only the source code, Docker will reuse the cached layers for dependencies and only re-execute the steps after COPY, significantly improving build efficiency.