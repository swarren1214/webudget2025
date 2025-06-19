# ---- Stage 1: Build ----
# This stage installs dependencies and builds the TypeScript code

# Use an official Node.js image. Alpine versions are smaller.
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package*.json ./

# Install all dependencies, including devDependencies for building
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build


# ---- Stage 2: Production ----
# This stage creates the final, lean image with only what's needed to run

FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files again
COPY package*.json ./

# Install ONLY production dependencies (and node-pg-migrate)
RUN npm install --only=production

# Copy the compiled code from the 'builder' stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy the top-level migrations folder
COPY --from=builder /usr/src/app/migrations ./migrations

# Copy the entrypoint script into the container's filesystem
COPY entrypoint.sh .

# Make the script executable
RUN chmod +x ./entrypoint.sh

# Expose the port the app runs on
EXPOSE 3000

# 3. Set the entrypoint script as the container's entrypoint
ENTRYPOINT ["./entrypoint.sh"]

# 4. Set the default command to be passed to the entrypoint
CMD [ "node", "dist/index.js" ]