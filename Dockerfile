FROM node:18

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl

# Instalar yt-dlp global (MUY IMPORTANTE)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "index.js"]
